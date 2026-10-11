import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, NoticeBanner, StatusBadge } from '../components/ui'
import { AIBundleCard } from '../components/AIBundleCard'
import { supabase } from '../lib/supabase'
import { coverUrl } from '../lib/s3'
import { useBuy } from '../lib/buy'
import { FALLBACK_PRODUCTS, type Product } from '../lib/products'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const { buy, busy, error, setError, message, setMessage } = useBuy()

  useEffect(() => {
    let isMounted = true

    async function loadProduct() {
      if (!id) return

      // Try fetching from Supabase
      try {
        const { data, error: sbError } = await supabase
          .from('products')
          .select('id, title, description, category, price_kobo, cover_s3_key, status, seller_id, seller_profiles(store_name, bio)')
          .eq('id', id)
          .maybeSingle()

        if (!sbError && data && isMounted) {
          const seller = Array.isArray(data.seller_profiles)
            ? data.seller_profiles[0]
            : (data.seller_profiles as { store_name?: string } | null)

          setProduct({
            id: data.id,
            title: data.title,
            description: data.description || 'Digital download package crafted for creators.',
            category: data.category || 'Digital Asset',
            price_kobo: data.price_kobo,
            price: `₦${(data.price_kobo / 100).toLocaleString()}`,
            store: seller?.store_name || 'Vessli Creator',
            cover_s3_key: data.cover_s3_key,
            status: data.status,
            file_type: 'Digital Download (PDF / Assets)',
            file_size: 'Included file bundle',
            format: 'PDF',
            rating: 4.9,
            sales_count: 85,
          })
          setLoading(false)
          return
        }
      } catch {
        // Fallback gracefully to local catalog
      }

      // Check fallback mock catalog
      const fallback = FALLBACK_PRODUCTS.find((p) => p.id === id) || FALLBACK_PRODUCTS[0]
      if (isMounted) {
        setProduct(fallback)
        setLoading(false)
      }
    }

    loadProduct()
    return () => {
      isMounted = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#4A0E17] border-t-transparent rounded-full" />
        <p className="mt-4 text-sm text-[#8A767A]">Loading product details...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-[#4A0E17]">Product Not Found</h2>
        <p className="mt-2 text-sm text-[#5C4A4E]">This listing may have been moved or removed by the creator.</p>
        <Link to="/" className="inline-block mt-6">
          <Button variant="secondary">← Back to Discover</Button>
        </Link>
      </div>
    )
  }

  const related = FALLBACK_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-medium text-[#8A767A]">
        <Link to="/" className="hover:text-[#4A0E17] transition">
          Discover
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-[#5C4A4E]">{product.category}</span>
        <span aria-hidden="true">/</span>
        <span className="text-[#1C1618] truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Visual Showcase & Specs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative rounded-3xl overflow-hidden border border-[#E2D5BE] bg-gradient-to-br from-[#F5EFE6] via-[#FAF6EE] to-[#EFE6DB] shadow-xs">
            {product.cover_s3_key ? (
              <img
                src={coverUrl(product.cover_s3_key)}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-80 sm:h-96 object-cover"
              />
            ) : (
              <div className="w-full h-80 sm:h-96 flex flex-col items-center justify-center text-center p-8 select-none">
                <span className="text-6xl mb-3 opacity-80">📖</span>
                <span className="text-xs font-bold text-[#8A767A] uppercase tracking-wider">{product.category}</span>
                <h3 className="mt-2 font-bold text-xl text-[#1C1618] max-w-md">{product.title}</h3>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <StatusBadge status={product.status} />
            </div>
          </div>

          {/* Product Specifications Card */}
          <div className="bg-white rounded-2xl border border-[#E2D5BE] p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A767A] mb-4">Package Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-[#FAF6EE] p-3 rounded-xl border border-[#E2D5BE]/60">
                <p className="text-xs text-[#8A767A]">Format</p>
                <p className="font-bold text-[#1C1618] mt-0.5">{product.file_type || 'PDF / Assets'}</p>
              </div>
              <div className="bg-[#FAF6EE] p-3 rounded-xl border border-[#E2D5BE]/60">
                <p className="text-xs text-[#8A767A]">Size</p>
                <p className="font-bold text-[#1C1618] mt-0.5">{product.file_size || 'Instant Access'}</p>
              </div>
              <div className="bg-[#FAF6EE] p-3 rounded-xl border border-[#E2D5BE]/60 col-span-2 sm:col-span-1">
                <p className="text-xs text-[#8A767A]">Delivery</p>
                <p className="font-bold text-emerald-800 mt-0.5">5-min S3 Link</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout & Purchase Module */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E2D5BE] p-6 sm:p-8 shadow-xs">
            {/* Clean Unboxed Metadata */}
            <div className="flex items-center gap-1.5 text-xs text-[#8A767A] mb-3">
              <span className="font-semibold text-[#4A0E17]">{product.category}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-semibold">Instant S3 Access</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#1C1618] tracking-tight leading-snug">
              {product.title}
            </h1>

            {/* Creator Tag */}
            <div className="mt-4 flex items-center gap-3 pb-6 border-b border-[#E2D5BE]">
              <div className="w-9 h-9 rounded-full bg-[#4A0E17] text-[#FAF6EE] flex items-center justify-center font-bold text-xs">
                {product.store.slice(0, 1)}
              </div>
              <div>
                <p className="text-[11px] text-[#8A767A]">Created by</p>
                <p className="font-bold text-sm text-[#1C1618]">{product.store}</p>
              </div>
              <span className="ml-auto text-xs text-amber-700 font-bold">
                ★ Verified Creator
              </span>
            </div>

            {/* Price Box */}
            <div className="mt-6">
              <p className="text-xs font-semibold text-[#8A767A]">One-time digital purchase</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-[#4A0E17] tabular-nums">{product.price}</span>
                <span className="text-xs text-[#8A767A] font-bold">NGN</span>
              </div>
            </div>

            {/* Creator Fee Callout */}
            <div className="mt-4 bg-[#FAF6EE] border border-[#E2D5BE] p-3 rounded-xl flex items-center gap-2 text-xs text-[#5C4A4E]">
              <span className="text-[#4A0E17] font-bold">✨ Fair Marketplace:</span>
              <span>10% flat commission. Creator receives 90% net earnings.</span>
            </div>

            {/* Notice / Feedback Banners */}
            {error && (
              <NoticeBanner type="error" onDismiss={() => setError(null)}>
                {error}
              </NoticeBanner>
            )}
            {message && (
              <NoticeBanner type="success" onDismiss={() => setMessage(null)}>
                {message}
              </NoticeBanner>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                variant="primary"
                disabled={busy}
                onClick={() => buy(product.id)}
                className="w-full py-3.5 text-sm font-bold shadow-md"
              >
                {busy ? 'Connecting Paystack...' : `Buy now for ${product.price}`}
              </Button>
              <p className="text-[11px] text-center text-[#8A767A]">
                Secure Paystack checkout. S3 download link generated instantly upon verification.
              </p>
            </div>

            {/* Trust Signals */}
            <div className="mt-6 pt-6 border-t border-[#E2D5BE] grid grid-cols-2 gap-3 text-xs text-[#5C4A4E]">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold text-sm">✓</span> Verified purchase
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold text-sm">✓</span> Direct 5-min S3 link
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold text-sm">✓</span> Lifetime license
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold text-sm">✓</span> Bank, USSD & Card
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic AI Bundle Section */}
      <div className="max-w-4xl mt-6">
        <AIBundleCard
          currentProduct={product}
          onMessage={(m) => (m.type === 'error' ? setError(m.text) : setMessage(m.text))}
        />
      </div>

      {/* Description & Included Section */}
      <div className="mt-12 bg-white rounded-3xl border border-[#E2D5BE] p-8 max-w-4xl shadow-xs">
        <h2 className="text-xl font-bold text-[#1C1618] mb-4">About this Product</h2>
        <p className="text-[#5C4A4E] text-sm leading-relaxed whitespace-pre-line">
          {product.description}
        </p>

        <h3 className="text-base font-bold text-[#1C1618] mt-8 mb-4">What's Included:</h3>
        <ul className="space-y-2 text-xs text-[#5C4A4E]">
          <li className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold mt-0.5">✓</span>
            <span>Direct access to master files and editable templates.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold mt-0.5">✓</span>
            <span>Accompanying setup guides and best practice documentation.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold mt-0.5">✓</span>
            <span>Commercial and personal license for unlimited client projects.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-700 font-bold mt-0.5">✓</span>
            <span>Protected download link valid for 5 minutes after payment confirmation.</span>
          </li>
        </ul>
      </div>

      {/* Related Products Carousel / Grid */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-[#1C1618]">More from Vessli Creators</h2>
          <Link to="/" className="text-xs font-bold text-[#4A0E17] hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {related.map((p) => (
            <div key={p.id} className="h-full">
              <Link to={`/product/${p.id}`} className="block h-full group">
                <div className="bg-white rounded-2xl border border-[#E2D5BE] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col h-full">
                  <div className="h-44 bg-gradient-to-br from-[#F5EFE6] to-[#EFE6DB] flex items-center justify-center text-4xl group-hover:scale-105 transition duration-300">
                    📖
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-xs font-bold text-[#5C4A4E]">{p.store}</p>
                    <h4 className="font-bold text-[#1C1618] group-hover:text-[#4A0E17] transition mt-1 line-clamp-1">
                      {p.title}
                    </h4>
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-[#E2D5BE]/60">
                      <span className="font-extrabold text-[#4A0E17] tabular-nums">{p.price}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
