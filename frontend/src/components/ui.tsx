import type { ReactNode } from 'react'
import { coverUrl } from '../lib/s3'

export function Button({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="bg-accent hover:bg-accent-dark text-white px-5 py-2.5 rounded-full font-semibold shadow-sm transition">
      {children}
    </button>
  )
}

const statusColor: Record<string, string> = {
  draft: 'bg-stone-200 text-stone-700',
  pending_review: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[status] ?? 'bg-stone-100'}`}>{status.replace('_', ' ')}</span>
}

export function ProductCard({ title, price, coverKey, store, status }: { title: string; price: string; coverKey?: string; store?: string; status?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden border border-stone-100">
      {coverKey ? (
        <img src={coverUrl(coverKey)} alt={title} className="w-full h-56 object-cover" />
      ) : (
        <div className="w-full h-56 bg-gradient-to-br from-sand-100 to-sand-200 flex items-center justify-center text-5xl">📚</div>
      )}
      <div className="p-5">
        {store && <p className="text-xs uppercase tracking-wide text-ink-500">{store}</p>}
        <h3 className="font-bold text-lg text-ink-900 mt-1">{title}</h3>
        <div className="flex items-center justify-between mt-3">
          <span className="font-extrabold text-lg">{price}</span>
          {status && <StatusBadge status={status} />}
        </div>
      </div>
    </div>
  )
}
