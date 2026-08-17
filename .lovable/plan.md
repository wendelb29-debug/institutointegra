# Plan: Coworking Reservations Security and Optimization

Correcting the security breach from the previous global migration, implementing database-level integrity for bookings, and synchronizing the public site with the real database.

## 1. Security (RLS) & Integrity (Double-booking)
I will implement a migration to:
- Revert the overly permissive `USING (true)` policies for `reservations`, `rooms`, and `room_blocks`.
- Scoping access: Users can only see and manage their own reservations. Admins and Socios retain full access.
- **Double-booking prevention**: Add a Postgres `EXCLUDE` constraint with `btree_gist` to the `reservations` and `room_blocks` tables. This ensures that no two overlapping reservations can exist for the same room at the database level, preventing race conditions.

## 2. Public Booking Logic Refinement
Currently, the public site (`/reservas`) only opens WhatsApp. I will:
- Update `ReservasPublicas.tsx` to check real-time availability from the database before showing rooms or allowing time selection.
- Change the "Reserve" button to first create a `pending` reservation in the database (linked to the user or with provided details) before redirecting to WhatsApp.
- This ensures the slot is "held" while they talk on WhatsApp.

## 3. Automated Notifications (Z-API)
- Deploy an Edge Function `reservations-webhook` that triggers on `reservations` table changes.
- When a reservation is created or its status changes (e.g., to `confirmada`), it will automatically send a formatted WhatsApp message to the client using Z-API.

## Technical Details
- **Migration**: `20260818000000_secure_reservations.sql`
- **Edge Function**: `supabase/functions/reservations-webhook/index.ts`
- **Frontend Changes**: `src/pages/ReservasPublicas.tsx` and `src/pages/gestao/Reservas.tsx` (to handle user identification).
- **Security**: Ensuring `public.has_role` is used consistently to avoid privilege escalation.
