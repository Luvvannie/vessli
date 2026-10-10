// POST /functions/v1/admin-moderate { product_id, action: approve|reject|deactivate, reason? }
// Server-only: verifies JWT, checks admin_users, updates products. Frontend never decides status.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return new Response('Unauthorized', { status: 401 })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data: { user } } = await admin.auth.getUser(jwt)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: isAdmin } = await admin.rpc('is_admin', { uid: user.id })
  if (!isAdmin) return new Response('Forbidden: admin only', { status: 403 })

  const { product_id, action, reason } = await req.json()
  if (!product_id || !['approve', 'reject', 'deactivate'].includes(action)) {
    return new Response('Bad request', { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (action === 'approve') { patch.status = 'approved'; patch.approved_at = new Date().toISOString(); patch.rejection_reason = null }
  if (action === 'reject') { patch.status = 'rejected'; patch.rejection_reason = reason ?? 'Does not meet policy' }
  if (action === 'deactivate') { patch.status = 'archived' }

  const { error } = await admin.from('products').update(patch).eq('id', product_id)
  if (error) return new Response(error.message, { status: 500 })
  return Response.json({ ok: true })
})
