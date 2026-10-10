import type { ReactNode } from 'react'
import { coverUrl } from '../lib/s3'

export function Button({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="bg-wine hover:bg-wine-dark text-[#FAF6EE] px-5 py-2.5 rounded-full font-semibold shadow-sm transition">
      {children}
    </button>
  )
}

const statusColor: Record<string, string> = {
  draft: 'bg-stone-200 text-stone-700',
  pending_review: 'bg-gold-soft text-gold-dark',
  approved: 'bg-sage-soft text-sage',
  rejected: 'bg-wine-soft text-wine-dark',
  paid: 'bg-sage-soft text-sage',
  failed: 'bg-wine-soft text-wine-dark',
  pending: 'bg-gold-soft text-gold-dark',
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[status] ?? 'bg-stone-100'}`}>{status.replace('_', ' ')}</span>
}

export function ProductCard({ title, price, coverKey, store, status }: { title: string; price: string; coverKey?: string; store?: string; status?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden border border-[#E2D5BE]">
      {coverKey ? (
        <img src={coverUrl(coverKey)} alt={title} className="w-full h-56 object-cover" />
      ) : (
        <div className="w-full h-56 bg-gradient-to-br from-[#F1E9D9] via-[#F7EDC9] to-[#F6E3E6] flex items-center justify-center text-5xl">📚</div>
      )}
      <div className="p-5">
        {store && <p className="text-xs uppercase tracking-widest text-gold-dark font-bold">{store}</p>}
        <h3 className="font-bold text-lg text-[#2A1A1E] mt-1">{title}</h3>
        <div className="flex items-center justify-between mt-3">
          <span className="font-extrabold text-lg text-wine-dark">{price}</span>
          {status && <StatusBadge status={status} />}
        </div>
      </div>
    </div>
  )
}
