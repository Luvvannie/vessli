import { useState } from 'react'
import { supabase } from './supabase'

// Buy flow: 1) create-order (server sets price) 2) init checkout 3) redirect to Paystack.
// Never trust frontend price. Amount verified server-side before marking paid.
export function useBuy() {
  const [busy, setBusy] = useState(false)

  async function buy(productId: string) {
    setBusy(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const base = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${base}/functions/v1/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ product_id: productId }),
      })
      if (!res.ok) throw new Error('Order failed — is the product approved?')
      const { reference } = await res.json()
      // Next: call init-paystack to get authorization_url, then redirect.
      // Until Paystack keys are added, show reference for test verification.
      alert(`Order created: ${reference}. Add Paystack keys to enable redirect.`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Buy failed')
    } finally {
      setBusy(false)
    }
  }

  return { buy, busy }
}
