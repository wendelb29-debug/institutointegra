import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller } } = await supabase.auth.getUser(token)
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', caller.id)
    const isAdmin = roles?.some((r: any) => r.role === 'admin')
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { action, ...payload } = await req.json()
    const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

    switch (action) {
      case 'list': {
        const { data: { users }, error } = await supabase.auth.admin.listUsers()
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: jsonHeaders })
        return new Response(JSON.stringify({ users }), { headers: jsonHeaders })
      }

      case 'create': {
        const { email, password, full_name, access_profile_id } = payload
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name }
        })
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: jsonHeaders })

        if (data.user) {
          // Wait briefly for trigger to create profile
          await new Promise(r => setTimeout(r, 500))
          const updates: any = {}
          if (access_profile_id) updates.access_profile_id = access_profile_id
          if (Object.keys(updates).length > 0) {
            await supabase.from('profiles').update(updates).eq('user_id', data.user.id)
          }
        }

        return new Response(JSON.stringify({ user: data.user }), { headers: jsonHeaders })
      }

      case 'update': {
        const { user_id, email, password, full_name, access_profile_id, status } = payload
        const updateData: any = {}
        if (email) updateData.email = email
        if (password) updateData.password = password
        if (full_name) updateData.user_metadata = { full_name }

        const { data, error } = await supabase.auth.admin.updateUserById(user_id, updateData)
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: jsonHeaders })

        const profileUpdate: any = {}
        if (access_profile_id !== undefined) profileUpdate.access_profile_id = access_profile_id || null
        if (status) profileUpdate.status = status
        if (full_name) profileUpdate.full_name = full_name
        if (Object.keys(profileUpdate).length > 0) {
          await supabase.from('profiles').update(profileUpdate).eq('user_id', user_id)
        }

        return new Response(JSON.stringify({ user: data.user }), { headers: jsonHeaders })
      }

      case 'delete': {
        const { user_id } = payload
        const { error } = await supabase.auth.admin.deleteUser(user_id)
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: jsonHeaders })
        return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders })
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: jsonHeaders })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
