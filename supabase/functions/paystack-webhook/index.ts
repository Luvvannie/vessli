// POST paystack-webhook - verifies signature, processes idempotently.
// Configure in Paystack dashboard: webhook URL = <supabase>/functions/v1/paystack-webhook
// Set PAYSTACK_SECRET_KEY + webhook secret in Supabase secrets.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const URL = Deno.env.get('SUPABASE_URL')!
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!
const RATE = parseFloat(Deno.env.get('COMMISSION_RATE') ?? '0.10')

async function verifySignature(body: string, sig: string | null): Promise<boolean> {
  if (!sig) return false
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return hex === sig
}

Deno.serve(async (req) => {
  const raw = await req.text()
  const sig = req.headers.get('x-paystack-signature')
  if (!(await verifySignature(raw, sig))) return new Response('bad signature', { status: 401 })
  const evt = JSON.parse(raw)
  if (evt.event !== 'charge.success') return Response.json({ ok: true, ignored: true })
  const reference = evt.data.reference as string
  const db = createClient(URL, KEY)
  const { data: pay } = await db.from('payments').select('*,orders!inner(*)').eq('provider_reference', reference).single()
  if (!pay) return Response.json({ ok: true, unknown: true })
  if (evt.data.amount !== pay.amount_kobo || evt.data.currency !== pay.currency) {
    return Response.json({ ok: false, reason: 'amount mismatch' }, { status: 400 })
  }
  await db.from('payments').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', pay.id)
  await db.from('orders').update({ status: 'paid' }).eq('id', pay.order_id)
  const gross = pay.amount_kobo
  const commission = Math.round(gross * RATE)
  await db.from('commission_ledger').upsert({
    order_id: pay.order_id, seller_id: pay.orders.seller_id,
    gross_kobo: gross, commission_rate: RATE, commission_kobo: commission,
    seller_net_kobo: gross - commission, status: 'recorded',
  }, { onConflict: 'order_id' })
  return Response.json({ ok: true })
})
