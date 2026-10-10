// POST init-paystack { order_id } -> { authorization_url }
// Calls Paystack /transaction/initialize with server secret. Amount from DB order (kobo->naira*100).
const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!

Deno.serve(async (req) => {
  const { order_id, email, callback_url } = await req.json()
  // NOTE: fetch order amount server-side in production (omitted here for brevity, see create-order).
  // This scaffold expects caller is authenticated Edge chain; full version looks up orders+payments tables.
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, amount: 0, reference: '', callback_url }),
  })
  const data = await res.json()
  return Response.json(data)
})
