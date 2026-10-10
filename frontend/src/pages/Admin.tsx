import { useState } from 'react'
import { Button, StatusBadge } from '../components/ui'

// Admin UI is thin: it only calls the backend Edge Function admin-moderate.
// Server checks JWT + admin_users table. Non-admins get 403 even if they open this page.
export default function Admin() {
  const [log, setLog] = useState('Backend-enforced: approve/reject via Edge Function. No direct DB writes from here.')
  const [pending] = useState([
    { id: 'demo-1', title: 'Canva Wedding Pack', seller: 'Design Hub', status: 'pending_review' },
  ])

  async function act(id: string, action: 'approve' | 'reject') {
    setLog(`Calling backend: ${action} ${id} ... (connect Supabase to go live)`)
    // Live call once SUPABASE_URL + login wired:
    // await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-moderate`, {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ product_id: id, action }),
    // })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold">Admin — Moderation</h1>
      <p className="text-sm text-ink-500 mt-1">🔒 Server decides. This page cannot approve anything by itself.</p>
      <div className="mt-6 bg-white rounded-2xl border divide-y">
        {pending.map((p) => (
          <div key={p.id} className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-ink-500">{p.seller}</p>
            </div>
            <StatusBadge status={p.status} />
            <Button onClick={() => act(p.id, 'approve')}>Approve</Button>
            <button onClick={() => act(p.id, 'reject')} className="px-4 py-2 rounded-full border text-sm">Reject</button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm bg-stone-100 rounded-lg p-3">{log}</p>
    </div>
  )
}
