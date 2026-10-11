import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { coverUrl } from '../lib/s3'

export function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
  className = '',
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  className?: string
  type?: 'button' | 'submit' | 'reset'
}) {
  const base =
    'px-5 py-2.5 rounded-full font-semibold transition inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] whitespace-nowrap shrink-0'
  const variants = {
    primary: 'bg-[#4A0E17] hover:bg-[#380A11] text-[#FAF6EE] shadow-sm hover:shadow',
    secondary: 'bg-white hover:bg-[#FAF6EE] text-[#1C1618] border border-[#E2D5BE] shadow-xs',
    outline: 'border border-[#4A0E17] text-[#4A0E17] hover:bg-[#4A0E17]/5',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white shadow-xs',
    ghost: 'text-[#5C4A4E] hover:text-[#1C1618] hover:bg-[#FAF6EE]',
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, { text: string; color: string }> = {
    draft: { text: 'Draft', color: 'text-stone-600' },
    pending_review: { text: 'Pending Review', color: 'text-amber-700 font-semibold' },
    approved: { text: 'Approved & Live', color: 'text-emerald-700 font-semibold' },
    rejected: { text: 'Changes Requested', color: 'text-rose-700 font-semibold' },
    paid: { text: 'Payment Verified', color: 'text-emerald-700 font-semibold' },
    failed: { text: 'Payment Failed', color: 'text-rose-700 font-semibold' },
    pending: { text: 'Awaiting Payment', color: 'text-amber-700 font-semibold' },
    archived: { text: 'Archived', color: 'text-stone-500' },
  }
  const item = labels[status] || { text: status.replace('_', ' '), color: 'text-stone-600' }
  return (
    <span className={`text-xs ${item.color}`}>
      {item.text}
    </span>
  )
}

export function NoticeBanner({
  type = 'info',
  children,
  onDismiss,
}: {
  type?: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
  onDismiss?: () => void
}) {
  const styles = {
    info: 'bg-[#F4EFE6] text-[#2A1A1E] border-[#E2D5BE]',
    success: 'bg-[#EBF3E8] text-[#1D3E21] border-[#C8DFBF]',
    warning: 'bg-[#FFF8E6] text-[#5C4505] border-[#F1DF99]',
    error: 'bg-[#FDF0F0] text-[#6E1423] border-[#F1C0C7]',
  }
  return (
    <div className={`p-4 rounded-2xl border text-sm flex items-start gap-3 my-3 shadow-xs ${styles[type]}`}>
      <span className="text-base select-none shrink-0" aria-hidden="true">
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'warning' && '⚠'}
        {type === 'info' && 'ℹ'}
      </span>
      <div className="flex-1 font-medium leading-relaxed">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
          aria-label="Dismiss notice"
        >
          ✕
        </button>
      )}
    </div>
  )
}

// Favorite Heart button with LocalStorage persistence
export function FavoriteButton({ productId }: { productId: string }) {
  const [isFav, setIsFav] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('vessli_favorites') || '[]')
      return favs.includes(productId)
    } catch {
      return false
    }
  })

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('vessli_favorites') || '[]')
      const updated = isFav ? favs.filter((id) => id !== productId) : [...favs, productId]
      localStorage.setItem('vessli_favorites', JSON.stringify(updated))
      setIsFav(!isFav)
    } catch {
      setIsFav(!isFav)
    }
  }

  return (
    <button
      onClick={toggle}
      title={isFav ? 'Remove from saved' : 'Save to wishlist'}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition backdrop-blur-md cursor-pointer border ${
        isFav
          ? 'bg-rose-50 border-rose-200 text-rose-600'
          : 'bg-white/80 hover:bg-white border-[#E2D5BE]/60 text-stone-400 hover:text-rose-600'
      }`}
    >
      <span className="text-xs select-none">{isFav ? '♥' : '♡'}</span>
    </button>
  )
}

export function ProductCard({
  id,
  title,
  price,
  coverKey,
  store,
  category,
  format,
  rating = 4.9,
  salesCount = 98,
  badge,
  onQuickView,
}: {
  id?: string
  title: string
  price: string
  coverKey?: string | null
  store?: string
  status?: string
  category?: string
  format?: string
  rating?: number
  salesCount?: number
  badge?: string
  onQuickView?: () => void
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden border border-[#E2D5BE] flex flex-col h-full group hover:-translate-y-0.5">
      {/* Cover Showcase */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-[#F5EFE6] via-[#FAF6EE] to-[#EFE6DB] flex items-center justify-center overflow-hidden border-b border-[#E2D5BE]/40">
        {coverKey ? (
          <img
            src={coverUrl(coverKey)}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center select-none">
            <span className="text-4xl mb-2 opacity-80">📖</span>
            <span className="text-xs font-bold text-[#8A767A] uppercase tracking-wider">{category || 'Digital Asset'}</span>
          </div>
        )}

        {/* Favorite heart */}
        {id && (
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton productId={id} />
          </div>
        )}

        {/* Badge in top left if featured/bestseller */}
        {badge && (
          <div className="absolute top-3 left-3 bg-[#4A0E17] text-[#FAF6EE] text-[11px] font-bold px-2.5 py-0.5 rounded shadow-xs">
            {badge}
          </div>
        )}

        {/* Quick View trigger on hover */}
        {onQuickView && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onQuickView()
            }}
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm cursor-pointer"
          >
            Quick Preview
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Unboxed Metadata Line with typographic separators */}
        <div className="flex items-center gap-1.5 text-xs text-[#8A767A] mb-1.5">
          <span className="font-semibold text-[#5C4A4E]">{store || 'Vessli Creator'}</span>
          <span aria-hidden="true">·</span>
          <span>{category || 'Resource'}</span>
          {format && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[11px]">{format}</span>
            </>
          )}
        </div>

        {/* Product Title */}
        <Link to={`/product/${id || 'bundle-1'}`}>
          <h3 className="font-bold text-base text-[#1C1618] group-hover:text-[#4A0E17] transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
        </Link>

        {/* Rating and verified sales */}
        <div className="flex items-center gap-1.5 mt-2 text-xs text-[#8A767A]">
          <span className="text-amber-600 font-bold">★ {rating.toFixed(1)}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{salesCount} verified downloads</span>
        </div>

        {/* Price & Guarantee Baseline */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#E2D5BE]/60">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8A767A] block leading-none">Instant Download</span>
            <span className="font-extrabold text-lg text-[#4A0E17] tabular-nums mt-0.5 block">{price}</span>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Verified S3
          </span>
        </div>
      </div>
    </div>
  )
}

// Quick View Modal
export function QuickViewModal({
  product,
  onClose,
  onBuy,
  busy,
}: {
  product: {
    id: string
    title: string
    description?: string
    price: string
    store: string
    category: string
    coverKey?: string | null
    file_type?: string
    file_size?: string
    format?: string
    highlights?: string[]
  }
  onClose: () => void
  onBuy: (id: string) => void
  busy?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E2D5BE] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-[#E2D5BE] text-stone-600 hover:text-black flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Cover Preview */}
          <div className="bg-[#FAF6EE] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#E2D5BE]">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white border border-[#E2D5BE] flex items-center justify-center shadow-xs">
              {product.coverKey ? (
                <img
                  src={coverUrl(product.coverKey)}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl select-none">📖</span>
              )}
            </div>

            <div className="mt-4 w-full text-center">
              <span className="text-xs text-[#8A767A] block">Created by</span>
              <span className="font-bold text-sm text-[#1C1618]">{product.store}</span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#8A767A] mb-2">
                <span>{product.category}</span>
                {product.format && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-xs">{product.format}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-semibold">Instant Access</span>
              </div>

              <h2 className="text-xl font-black text-[#1C1618] leading-tight">
                {product.title}
              </h2>

              <p className="text-xs text-[#5C4A4E] mt-3 leading-relaxed line-clamp-4">
                {product.description || 'Complete digital asset bundle ready for immediate download upon successful payment verification.'}
              </p>

              {product.highlights && product.highlights.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#E2D5BE]/60">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8A767A] mb-2">Included in this bundle</h4>
                  <ul className="text-xs text-[#2A1A1E] space-y-1">
                    {product.highlights.slice(0, 3).map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 p-3 rounded-xl bg-[#FAF6EE] border border-[#E2D5BE]/60 text-xs text-[#5C4A4E] space-y-1">
                <div className="flex justify-between">
                  <span>File type:</span>
                  <span className="font-medium text-[#1C1618]">{product.file_type || 'Digital Download'}</span>
                </div>
                {product.file_size && (
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium text-[#1C1618]">{product.file_size}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="font-medium text-emerald-800">Secure AWS S3 (5-min link)</span>
                </div>
              </div>
            </div>

            {/* Price & Checkout Action */}
            <div className="mt-6 pt-4 border-t border-[#E2D5BE]">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs text-[#8A767A] font-semibold">Paystack Total</span>
                <span className="text-2xl font-black text-[#4A0E17] tabular-nums">{product.price}</span>
              </div>

              <div className="flex gap-2">
                <Link to={`/product/${product.id}`} onClick={onClose} className="flex-1">
                  <Button variant="secondary" className="w-full text-xs py-2.5">
                    Full Overview
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  disabled={busy}
                  onClick={() => onBuy(product.id)}
                  className="flex-1 text-xs py-2.5 font-bold"
                >
                  {busy ? 'Connecting...' : 'Buy Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
