# Plan: Integra Gestão Visual Enhancements & PWA

Implement visual refinements, skeleton loaders, PWA support, and external calendar sync as suggested to improve system UX.

## User Review Required

> [!IMPORTANT]
> The PWA implementation requires specific icons (192x192 and 512x512) for professional results. I will use generic placeholders if not provided, but custom branding is recommended.

- **Google Calendar Sync**: This will be a UI-only implementation for now (mocked sync) as a full integration requires OAuth client credentials which must be configured in the project settings by the user.

## Proposed Changes

### Visual Refinement & UX
- **Skeleton Loaders**: Add skeleton loading states to `Dashboard.tsx`, `Financeiro.tsx`, and `Reservas.tsx` to improve perceived performance.
- **Micro-animations**: Enhance transitions using `framer-motion` in core layout components.
- **Glassmorphism Improvements**: Refine the `.premium-card` and header styles in `index.css` for better depth.

### Progressive Web App (PWA)
- **Manifest**: Create `manifest.webmanifest` with brand colors (#0A0A0F background, #C2A66D theme).
- **Service Worker**: Implement a basic service worker for offline asset caching.
- **Metadata**: Add PWA-related meta tags to `index.html`.

### Calendar Integration (UI/Mock)
- **External Sync UI**: Add a "Sync Calendar" button in `Agenda.tsx` and `Reservas.tsx` with a loading state simulation.

### Security & Multi-tenant (Self-correction)
- **Global Visibility**: Re-check RLS to ensure "Coworking" data visibility across tenants as requested while maintaining strict isolation for other modules.

## Technical Details
- Use `lucide-react` for consistent iconography.
- Implement `Skeleton` component from `shadcn/ui`.
- `vite-plugin-pwa` (if possible) or manual service worker registration.
- Update `index.css` with semantic tokens for dark mode consistency.
