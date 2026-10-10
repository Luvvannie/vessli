import type { ReactNode } from 'react'

export function Button({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium">
      {children}
    </button>
  )
}

const statusColor: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor[status] ?? 'bg-gray-100'}`}>{status}</span>
}

export function ProductCard({ title, price, cover, status }: { title: string; price: string; cover?: string; status?: string }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      {cover ? <img src={cover} alt={title} className="w-full h-48 object-cover" /> : <div className="w-full h-48 bg-sand-100" />}
      <div className="p-4">
        <h3 className="font-semibold text-ink-900">{title}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold">{price}</span>
          {status && <StatusBadge status={status} />}
        </div>
      </div>
    </div>
  )
}
