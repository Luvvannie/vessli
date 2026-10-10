// POST create-order { product_id } -> { order_id, reference }
// Server reads real price from DB, creates pending order + payment. Frontend never sets price.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const URL = Deno.env.get('SUPABASE_URL')!
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return new Response('Unauthorized', { status: 401 })
  const db = createClient(URL, KEY)
  const { data: { user } } = await db.auth.getUser(jwt)
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { product_id } = await req.json()
  const { data: p } = await db.from('products').select('id,seller_id,price_kobo,currency,status').eq('id', product_id).single()
  if (!p || p.status !== 'approved') return new Response('Product not available', { status: 400 })
  const { data: order } = await db.from('orders').insert({
    buyer_id: user.id, seller_id: p.seller_id, total_kobo: p.price_kobo, currency: p.currency, status: 'pending',
  }).select('id').single()
  const reference = `vessli_${order.id.replaceAll('-', '').slice(0, 12)}_${Date.now()}`
  await db.from('order_items').insert({ order_id: order.id, product_id: p.id, unit_price_kobo: p.price_kobo, quantity: 1 })
  await db.from('payments').insert({ order_id: order.id, provider: 'paystack', provider_reference: reference, amount_kobo: p.price_kobo, currency: p.currency, status: 'pending' })
  return Response.json({ order_id: order.id, reference })
})
