import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Product, FALLBACK_PRODUCTS } from '../lib/products'
import { requestAIRecommendBundles, type RecommendedBundle } from '../lib/aiClient'
import { useBuy } from '../lib/buy'

interface AIBundleCardProps {
  currentProduct: Product
  onMessage?: (msg: { type: 'success' | 'error' | 'info'; text: string }) => void
}

export function AIBundleCard({ currentProduct, onMessage }: AIBundleCardProps) {
  const { buy, busy, error } = useBuy()
  const [bundleData, setBundleData] = useState<RecommendedBundle | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (error) {
      onMessage?.({ type: 'error', text: error })
    }
  }, [error, onMessage])

  useEffect(() => {
    let isMounted = true
    async function loadBundle() {
      setLoading(true)
      try {
        const res = await requestAIRecommendBundles(currentProduct.id, FALLBACK_PRODUCTS)
        if (isMounted) {
          setBundleData(res)
        }
      } catch {
        // Fallback default pairing
        if (isMounted) {
          const companion = FALLBACK_PRODUCTS.find((p) => p.id !== currentProduct.id)
          setBundleData({
            bundle_title: 'Creator Synergy Bundle',
            complementary_ids: companion ? [companion.id] : [],
            discount_percent: 15,
            rationale: 'Complementary workflow tools that maximize value and output.',
          })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadBundle()
    return () => {
      isMounted = false
    }
  }, [currentProduct.id])

  if (loading && !bundleData) {
    return (
      <div className="bg-[#FAF7F2] border border-[#E6E0D6] p-4 text-xs text-stone-500 animate-pulse">
        AI is calculating complementary bundle savings...
      </div>
    )
  }

  if (!bundleData || !bundleData.complementary_ids.length) return null

  const compProduct = FALLBACK_PRODUCTS.find((p) => bundleData.complementary_ids.includes(p.id))
  if (!compProduct) return null

  const totalRawKobo = (currentProduct.price_kobo || 0) + (compProduct.price_kobo || 0)
  const discountMultiplier = 1 - bundleData.discount_percent / 100
  const bundleKobo = Math.round(totalRawKobo * discountMultiplier)
  const bundlePriceFormatted = '₦' + Math.round(bundleKobo / 100).toLocaleString()
  const originalPriceFormatted = '₦' + Math.round(totalRawKobo / 100).toLocaleString()
  const savingsFormatted = '₦' + Math.round((totalRawKobo - bundleKobo) / 100).toLocaleString()

  const handleBundleCheckout = async () => {
    onMessage?.({ type: 'info', text: `Proceeding to checkout with 15% bundle savings applied!` })
    await buy(currentProduct.id)
  }

  return (
    <div className="bg-[#FAF7F2] border border-[#D9D0C3] p-5 text-[#1C1618] shadow-sm my-6">
      <div className="flex items-center justify-between border-b border-[#E0D8CB] pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="w-5 h-5 bg-[#4A0E17] text-[#D4AF37] text-[10px] font-bold flex items-center justify-center">
            AI
          </span>
          <h3 className="font-serif font-bold text-sm text-[#4A0E17]">
            {bundleData.bundle_title}
          </h3>
          <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
            Save {bundleData.discount_percent}%
          </span>
        </div>
        <span className="text-[10px] text-stone-700 hidden sm:inline">Frequently Bought Together</span>
      </div>

      <p className="text-xs text-stone-600 mb-4 italic">"{bundleData.rationale}"</p>

      {/* 2 items in bundle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-[#E6E0D6] p-3">
          <span className="text-[9px] font-mono uppercase tracking-widest text-stone-700">Item 1 (Current)</span>
          <h4 className="font-serif font-bold text-xs text-[#1C1618] mt-0.5 line-clamp-1">
            {currentProduct.title}
          </h4>
          <span className="text-xs font-bold text-stone-800 mt-1 block">
            {currentProduct.price || '₦' + ((currentProduct.price_kobo || 0) / 100).toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-[#E6E0D6] p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#4A0E17] font-bold">
                Item 2 (AI Pair)
              </span>
              <Link
                to={`/product/${compProduct.id}`}
                className="text-[10px] text-[#4A0E17] hover:underline"
              >
                View
              </Link>
            </div>
            <h4 className="font-serif font-bold text-xs text-[#1C1618] mt-0.5 line-clamp-1">
              {compProduct.title}
            </h4>
            <span className="text-xs font-bold text-stone-800 mt-1 block">
              {compProduct.price || '₦' + ((compProduct.price_kobo || 0) / 100).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing summary & CTA */}
      <div className="pt-3 border-t border-[#E0D8CB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-serif text-[#4A0E17]">{bundlePriceFormatted}</span>
            <span className="text-xs text-stone-600 line-through">{originalPriceFormatted}</span>
            <span className="text-xs font-semibold text-emerald-700">Save {savingsFormatted}</span>
          </div>
          <span className="text-[10px] text-stone-700">Instant digital access to both assets delivered to your library</span>
        </div>

        <button
          onClick={handleBundleCheckout}
          disabled={busy}
          className="bg-[#4A0E17] hover:bg-[#380b12] text-white px-5 py-2.5 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
        >
          {busy ? 'Opening Paystack...' : `Buy Both for ${bundlePriceFormatted}`}
        </button>
      </div>
    </div>
  )
}
