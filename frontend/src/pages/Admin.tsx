import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Button, StatusBadge } from '../components/ui'

type P = { id: string; title: string; seller_id: string; status: string }

export default function Admin() {
  const { session } = useAuth()
  const [pending, setPending] = useState<P[]>([])
  const [log, setLog] = useState('Admins only — enforced by database (is_admin).')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('products').select('id,title,seller_id,status').eq('status', 'pending_review').order('created_at', { ascending: false })
    if (data) setPending(data)
  }

  async function act(id: string, action: 'approve' | 'reject') {
    setLog('Working...')
    const patch = action === 'approve'
      ? { status: 'approved', approved_at: new Date().toISOString(), rejection_reason: null }
      : { status: 'rejected', rejection_reason: 'Does not meet policy' }
    const { error } = await supabase.from('products').update(patch).eq('id', id)
    if (error) { setLog(`Denied: ${error.message} (you must be in admin_users)`); return }
    setLog(`${action}d ${id}.`)
    load()
  }

  if (!session) return <div className="p-8 text-center">Please <a href="/login" className="text-wine font-bold">log in</a> as admin.</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold text-wine-dark">Admin — Moderation</h1>
      <p className="text-sm text-[#5C4A4E] mt-1">🔒 Server decides via RLS. Non-admins get denied even if they open this page.</p>
      <div className="mt-6 bg-white rounded-2xl border divide-y">
        {pending.map((p) => (
          <div key={p.id} className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold">{p.title}</p>
            </div>
            <StatusBadge status={p.status} />
            <Button onClick={() => act(p.id, 'approve')}>Approve</Button>
            <button onClick={() => act(p.id, 'reject')} className="px-4 py-2 rounded-full border text-sm">Reject</button>
          </div>
        ))}
        {pending.length === 0 && <p className="p-4 text-sm text-[#8A767A]">No pending products. 🎉</p>}
      </div>
      <p className="mt-4 text-sm bg-stone-100 rounded-lg p-3">{log}</p>
    </div>
  )
}
