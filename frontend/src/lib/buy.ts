import { useState } from 'react'
import { supabase } from './supabase'

// Buy flow: 1) create-order (server sets price) 2) init-paystack 3) redirect.
// Never trust frontend price. Amount verified server-side before marking paid.
export function useBuy() {
  const [busy, setBusy] = useState(false)

  async function buy(productId: string) {
    setBusy(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const base = import.meta.env.VITE_SUPABASE_URL as string
      const orderRes = await fetch(`${base}/functions/v1/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ product_id: productId }),
      })
      if (!orderRes.ok) throw new Error('Order failed — is the product approved?')
      const { order_id } = await orderRes.json()
      const initRes = await fetch(`${base}/functions/v1/init-paystack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ order_id, callback_url: `${window.location.origin}/account` }),
      })
      if (!initRes.ok) throw new Error('Checkout init failed — deploy functions + set PAYSTACK_SECRET_KEY first.')
      const { authorization_url } = await initRes.json()
      window.location.href = authorization_url
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Buy failed')
    } finally {
      setBusy(false)
    }
  }

  return { buy, busy }
}
