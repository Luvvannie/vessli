// POST init-paystack { order_id, email, callback_url } -> { authorization_url }
// Server looks up real amount from DB. Secret stays server-side.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const URL = Deno.env.get('SUPABASE_URL')!
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!

Deno.serve(async (req) => {
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return new Response('Unauthorized', { status: 401 })
  const db = createClient(URL, KEY)
  const { data: { user } } = await db.auth.getUser(jwt)
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { order_id, callback_url } = await req.json()
  const { data: pay } = await db.from('payments').select('provider_reference,amount_kobo,currency').eq('order_id', order_id).single()
  if (!pay) return new Response('order not found', { status: 404 })
  const email = user.email ?? 'customer@vessli.shop'
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, amount: pay.amount_kobo, reference: pay.provider_reference, callback_url }),
  })
  const data = await res.json()
  if (!data.status) return Response.json(data, { status: 400 })
  return Response.json({ authorization_url: data.data.authorization_url, reference: pay.provider_reference })
})
