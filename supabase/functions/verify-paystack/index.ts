// POST verify-paystack { reference } -> verifies via Paystack, marks paid, creates 1 commission row.
// Idempotent: unique constraints on payments.reference + commission.order_id prevent doubles.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const URL = Deno.env.get('SUPABASE_URL')!
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!
const RATE = parseFloat(Deno.env.get('COMMISSION_RATE') ?? '0.10')

Deno.serve(async (req) => {
  const { reference } = await req.json()
  const verify = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
  }).then((r) => r.json())
  if (verify.data?.status !== 'success') return Response.json({ ok: false, reason: 'not success' }, { status: 400 })

  const db = createClient(URL, KEY)
  const { data: pay } = await db.from('payments').select('*,orders!inner(*)').eq('provider_reference', reference).single()
  if (!pay) return new Response('unknown reference', { status: 404 })
  // Amount + currency must match order exactly (Paystack amount is in kobo)
  if (verify.data.amount !== pay.amount_kobo || verify.data.currency !== pay.currency) {
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
