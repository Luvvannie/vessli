import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

type Order = { id: string; status: string; total_kobo: number }

export default function Account() {
  const { session } = useAuth()
  const [msg, setMsg] = useState('')
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('reference') ?? params.get('trxref')
    if (ref) verify(ref)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    const { data: { session: s } } = await supabase.auth.getSession()
    if (!s) return
    const { data } = await supabase.from('orders').select('id,status,total_kobo').eq('buyer_id', s.user.id).order('created_at', { ascending: false })
    if (data) setOrders(data)
  }

  async function verify(reference: string) {
    setMsg('Verifying payment...')
    try {
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!s) return
      const base = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${base}/functions/v1/verify-paystack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.access_token}` },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      setMsg(data.ok ? 'Payment verified ✓ — commission recorded (10%).' : `Not verified: ${data.reason ?? 'unknown'}`)
      load()
    } catch {
      setMsg('Verification call failed — add CORS to verify-paystack like the others.')
    }
  }

  if (!session) return <div className="p-8 text-center">Please <a href="/login" className="text-wine font-bold">log in</a> to see orders.</div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold text-wine-dark">My Orders</h1>
      {msg && <p className="mt-3 text-sm bg-gold-soft rounded-lg p-3">{msg}</p>}
      <div className="mt-4 bg-white rounded-2xl border divide-y">
        {orders.map((o) => (
          <div key={o.id} className="p-4 flex items-center gap-3">
            <span className="flex-1 text-sm">{o.id.slice(0, 8)} — ₦{(o.total_kobo / 100).toLocaleString()}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${o.status === 'paid' ? 'bg-sage-soft text-sage' : 'bg-gold-soft text-gold-dark'}`}>{o.status}</span>
          </div>
        ))}
        {orders.length === 0 && <p className="p-4 text-sm">No orders yet — buy something from Discover.</p>}
      </div>
      <p className="mt-3 text-xs">Downloads unlock here once the seller's file is in S3 (Phase 7).</p>
    </div>
  )
}
