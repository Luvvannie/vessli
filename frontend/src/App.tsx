import { useEffect, useState, useMemo } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Button, NoticeBanner, ProductCard, QuickViewModal } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import { RoleProvider, useRole } from './lib/roles'
import { AIProvider, useAI } from './lib/aiContext'
import { AIChatModal } from './components/AIChatModal'
import { supabase } from './lib/supabase'
import { useBuy } from './lib/buy'
import { FALLBACK_PRODUCTS, type Product } from './lib/products'
import Admin from './pages/Admin'
import Auth from './pages/Auth'
import Account from './pages/Account'
import Seller from './pages/Seller'
import ProductDetail from './pages/ProductDetail'
import APKDownloadPage from './pages/APKDownloadPage'
import { APKMobileShell } from './components/APKMobileShell'

function Nav() {
  const { session } = useAuth()
  const { currentRole, setRole, hasSellerProfile, hasBuyerProfile } = useRole()
  const { openChat } = useAI()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const userInitial = session?.user?.email?.slice(0, 1).toUpperCase() || 'U'
  const userDisplayName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'My Account'

  return (
    <header className="bg-[#FAF6EE]/95 backdrop-blur-md border-b border-[#E2D5BE] px-6 py-3.5 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link to="/" className="flex items-center gap-2 font-black text-2xl tracking-tight text-[#4A0E17] whitespace-nowrap shrink-0">
          <span className="w-8 h-8 rounded-xl bg-[#4A0E17] text-[#FAF6EE] flex items-center justify-center font-black text-sm shadow-xs">
            V
          </span>
          Vessli<span className="text-[#D4AF37] font-black">.</span>
        </Link>

        {/* Zone 2: Role-Tailored Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#5C4A4E]">
          <Link to="/" className="hover:text-[#4A0E17] transition whitespace-nowrap shrink-0">
            Discover
          </Link>

          {/* Role: BUYER (Default) */}
          {currentRole === 'buyer' && (
            <>
              <a href="#categories" className="hover:text-[#4A0E17] transition whitespace-nowrap shrink-0">
                Categories
              </a>
              <a href="#creators" className="hover:text-[#4A0E17] transition whitespace-nowrap shrink-0">
                Creators
              </a>
              {session && hasBuyerProfile && (
                <Link to="/account" className="hover:text-[#4A0E17] transition whitespace-nowrap shrink-0 font-medium">
                  Buyer Hub
                </Link>
              )}
            </>
          )}

          {/* Role: CREATOR / SELLER */}
          {currentRole === 'seller' && (
            <>
              <Link to="/seller" className="text-[#4A0E17] font-bold hover:underline transition whitespace-nowrap shrink-0">
                Creator Studio
              </Link>
              {hasBuyerProfile && (
                <Link to="/account" className="hover:text-[#4A0E17] transition whitespace-nowrap shrink-0">
                  Buyer Hub
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action & Profile Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A0E17]/10 hover:bg-[#4A0E17]/20 border border-[#4A0E17]/30 text-[#4A0E17] text-xs font-bold transition cursor-pointer"
            title="Ask Vessli AI Shopping Advisor"
          >
            <span className="w-2 h-2 bg-[#D4AF37] inline-block animate-pulse"></span>
            <span>Ask AI</span>
          </button>

          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-3 pr-2 bg-white hover:bg-[#FAF6EE] border border-[#E2D5BE] rounded-full transition shadow-xs cursor-pointer"
              >
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-[#1C1618] leading-none truncate max-w-[120px]">
                    {userDisplayName}
                  </p>
                  <p className="text-[10px] text-[#8A767A] font-semibold mt-0.5 leading-none capitalize">
                    {currentRole === 'seller' ? 'Creator' : 'Buyer'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#4A0E17] text-[#FAF6EE] flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInitial}
                </div>
              </button>

              {/* User Dropdown: Only Creator and Buyer Hub */}
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#E2D5BE] shadow-xl py-2 z-50 text-xs animate-fade-in divide-y divide-[#E2D5BE]/60">
                    <div className="px-4 py-3">
                      <p className="font-bold text-[#1C1618] truncate">{session.user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF2E8] text-[#4A0E17] border border-[#E2D5BE]">
                        {hasSellerProfile && hasBuyerProfile
                          ? '✨ Dual: Buyer & Creator'
                          : hasSellerProfile
                          ? '🎨 Verified Creator'
                          : '🛍️ Verified Buyer'}
                      </span>
                    </div>

                    {/* Mode Switcher ONLY shown if user has BOTH creator and buyer profiles */}
                    {hasSellerProfile && hasBuyerProfile && (
                      <div className="px-4 py-2.5 bg-[#FAF6EE]/60">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A767A] mb-2">
                          Switch Profile View
                        </p>
                        <div className="flex gap-1 p-1 bg-white border border-[#E2D5BE] rounded-xl">
                          <button
                            onClick={() => {
                              setRole('buyer')
                              setMenuOpen(false)
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] transition cursor-pointer ${
                              currentRole === 'buyer'
                                ? 'bg-[#4A0E17] text-white shadow-xs'
                                : 'text-[#5C4A4E] hover:text-[#1C1618]'
                            }`}
                          >
                            Buyer Hub
                          </button>
                          <button
                            onClick={() => {
                              setRole('seller')
                              setMenuOpen(false)
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] transition cursor-pointer ${
                              currentRole === 'seller'
                                ? 'bg-[#4A0E17] text-white shadow-xs'
                                : 'text-[#5C4A4E] hover:text-[#1C1618]'
                            }`}
                          >
                            Creator Studio
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="py-1">
                      {hasBuyerProfile && (
                        <Link
                          to="/account"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2 hover:bg-[#FAF6EE] text-[#5C4A4E] hover:text-[#1C1618] font-medium transition"
                        >
                          <span className="font-semibold">Buyer Hub</span>
                          <span className="text-[10px] text-[#8A767A]">Purchases & Library</span>
                        </Link>
                      )}

                      {hasSellerProfile && (
                        <Link
                          to="/seller"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2 hover:bg-[#FAF6EE] text-[#4A0E17] font-bold transition"
                        >
                          <span>Creator Studio</span>
                          <span className="text-[10px] text-[#4A0E17]/70 font-semibold">Store & Sales</span>
                        </Link>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          supabase.auth.signOut()
                          navigate('/')
                        }}
                        className="w-full text-left px-4 py-2 text-[#4A0E17] hover:bg-[#4A0E17]/10 font-bold transition cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login?portal=creator" className="hidden sm:inline-block text-xs font-bold text-[#5C4A4E] hover:text-[#4A0E17] px-3 py-2 transition">
                Creator Login
              </Link>
              <Link to="/login?portal=buyer">
                <Button variant="primary" className="text-xs py-2 px-5">
                  Sign in
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

const CATEGORIES = ['All', 'Ebooks', 'Templates', 'Planners', 'Design']

const FORMAT_OPTIONS = ['All Formats', 'PDF', 'Notion', 'Figma', 'Canva', 'Sheets', 'ZIP']

const CATEGORY_TILES = [
  { name: 'Ebooks', icon: '📖', desc: 'Strategy, audience growth & freelance guides', count: '18+ books' },
  { name: 'Planners', icon: '🗓️', desc: 'Notion creator workspaces & operating dashboards', count: '14+ systems' },
  { name: 'Design', icon: '🎨', desc: 'Canva stationery, UI kits & vector assets', count: '28+ packs' },
  { name: 'Templates', icon: '📊', desc: 'Investor pitch decks, legal contracts & finance models', count: '16+ decks' },
]

const QUICK_TAGS = ['Notion Planners', 'Investor Decks', 'Canva Wedding', 'Financial Models', 'Legal Contracts', 'Audio Presets']

function Home() {
  const { openChat } = useAI()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const [format, setFormat] = useState('All Formats')
  const [sort, setSort] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating' | 'popular'>('featured')
  const [priceRange, setPriceRange] = useState<'all' | 'under5k' | '5k_to_10k' | 'above10k'>('all')
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  const [live, setLive] = useState<Product[]>([])
  const { buy, busy, error, setError } = useBuy()

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, title, description, category, price_kobo, cover_s3_key, status, seller_profiles(store_name)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(24)

        if (data && data.length > 0) {
          setLive(
            data.map((d) => {
              const seller = Array.isArray(d.seller_profiles)
                ? d.seller_profiles[0]
                : (d.seller_profiles as { store_name?: string } | null)
              return {
                id: d.id,
                title: d.title,
                description: d.description || '',
                category: d.category || 'Digital Asset',
                price_kobo: d.price_kobo,
                price: `₦${(d.price_kobo / 100).toLocaleString()}`,
                store: seller?.store_name || 'Annabel Studio',
                cover_s3_key: d.cover_s3_key,
                status: d.status,
                rating: 4.9,
                sales_count: 85,
              }
            })
          )
        }
      } catch {
        // Fallback
      }
    }

    loadProducts()
  }, [])

  const baseList = live.length > 0 ? live : FALLBACK_PRODUCTS

  // Favorites filter
  const favoriteIds = useMemo(() => {
    if (!showSavedOnly) return []
    try {
      return JSON.parse(localStorage.getItem('vessli_favorites') || '[]') as string[]
    } catch {
      return []
    }
  }, [showSavedOnly])

  const filteredItems = useMemo(() => {
    let result = baseList.filter((item) => {
      const matchQ =
        item.title.toLowerCase().includes(q.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(q.toLowerCase()))
      const matchCat = category === 'All' || item.category.toLowerCase() === category.toLowerCase()
      const matchFormat = format === 'All Formats' || item.format === format

      let matchPrice = true
      const amountNaira = item.price_kobo / 100
      if (priceRange === 'under5k') matchPrice = amountNaira < 5000
      else if (priceRange === '5k_to_10k') matchPrice = amountNaira >= 5000 && amountNaira <= 10000
      else if (priceRange === 'above10k') matchPrice = amountNaira > 10000

      let matchFav = true
      if (showSavedOnly) {
        matchFav = favoriteIds.includes(item.id)
      }

      return matchQ && matchCat && matchFormat && matchPrice && matchFav
    })

    if (sort === 'price_asc') {
      result = [...result].sort((a, b) => a.price_kobo - b.price_kobo)
    } else if (sort === 'price_desc') {
      result = [...result].sort((a, b) => b.price_kobo - a.price_kobo)
    } else if (sort === 'rating') {
      result = [...result].sort((a, b) => (b.rating || 4.9) - (a.rating || 4.9))
    } else if (sort === 'popular') {
      result = [...result].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
    }

    return result
  }, [baseList, q, category, format, sort, priceRange, showSavedOnly, favoriteIds])

  const hasActiveFilters = q || category !== 'All' || format !== 'All Formats' || priceRange !== 'all' || showSavedOnly

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero Showcase */}
      <section className="py-16 md:py-20 text-center relative">
        <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-[#4A0E17] bg-[#FAF2E8] border border-[#E2D5BE] px-4 py-1.5 rounded-full shadow-xs">
          <span>✨</span> CREATORS KEEP 90% · 10% FLAT MARKETPLACE COMMISSION
        </div>

        <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#1C1618] leading-[1.15] max-w-4xl mx-auto" style={{ textWrap: 'balance' }}>
          Discover digital products worth <span className="text-[#4A0E17] underline decoration-[#D4AF37] decoration-4 underline-offset-8">paying for</span>.
        </h1>

        <p className="text-[#5C4A4E] text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
          The curated marketplace for high-impact ebooks, Notion systems, investor pitch decks, and creative design kits by top African creators.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto bg-white rounded-full border border-[#E2D5BE] shadow-md p-2 focus-within:border-[#4A0E17] focus-within:ring-2 focus-within:ring-[#4A0E17]/10 transition flex items-center">
          <span className="pl-4 text-base text-[#8A767A] select-none" aria-hidden="true">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates, ebooks, planners..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-[#1C1618] outline-none"
          />
          {q && (
            <button onClick={() => setQ('')} className="px-2 text-xs text-[#8A767A] hover:text-[#1C1618] cursor-pointer">
              Clear
            </button>
          )}
          <div className="flex items-center gap-1.5 pr-1">
            <Button variant="primary" className="py-2.5 px-5 font-bold text-xs">
              Search
            </Button>
            <button
              type="button"
              onClick={openChat}
              className="py-2.5 px-3 bg-[#FAF6EE] hover:bg-[#F2ECE1] border border-[#E2D5BE] text-[#4A0E17] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer rounded-full"
              title="Ask AI Concierge"
            >
              <span className="w-2 h-2 bg-[#D4AF37] inline-block animate-pulse"></span>
              <span className="hidden sm:inline">Ask</span> AI
            </button>
          </div>
        </div>

        {/* Quick Search Tags */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#8A767A]">
          <span className="font-semibold text-[#5C4A4E]">Trending keywords:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQ(tag.split(' ')[0])
                window.scrollTo({ top: 560, behavior: 'smooth' })
              }}
              className="bg-white/80 hover:bg-white text-[#5C4A4E] hover:text-[#4A0E17] border border-[#E2D5BE] px-3 py-1 rounded-full transition cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Trust Value Strip */}
        <div className="mt-10 pt-6 border-t border-[#E2D5BE]/60 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-[#5C4A4E]">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-emerald-700 font-black text-sm">✓</span> 90% Creator Net
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-emerald-700 font-black text-sm">✓</span> Instant Delivery
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-emerald-700 font-black text-sm">✓</span> Paystack Verified
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-emerald-700 font-black text-sm">✓</span> Secure Download
          </div>
        </div>
      </section>

      {/* Global Error Notice */}
      {error && (
        <div className="max-w-xl mx-auto mb-6">
          <NoticeBanner type="error" onDismiss={() => setError(null)}>
            {error}
          </NoticeBanner>
        </div>
      )}

      {/* Visual Category Cards */}
      <section id="categories" className="py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-[#1C1618]">Explore Categories</h2>
          <span className="text-xs text-[#8A767A] font-semibold">Hand-curated digital goods</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORY_TILES.map((tile) => (
            <div
              key={tile.name}
              onClick={() => {
                setCategory(tile.name)
                window.scrollTo({ top: 820, behavior: 'smooth' })
              }}
              className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5 ${
                category === tile.name
                  ? 'bg-[#4A0E17] text-white border-[#4A0E17] shadow-md'
                  : 'bg-white hover:bg-[#FAF6EE] border-[#E2D5BE] text-[#1C1618] shadow-xs'
              }`}
            >
              <div>
                <span className="text-2xl mb-2 block">{tile.icon}</span>
                <h3 className="font-bold text-base group-hover:text-[#D4AF37] transition">{tile.name}</h3>
                <p className={`text-xs mt-1 leading-snug ${category === tile.name ? 'text-white/80' : 'text-[#8A767A]'}`}>
                  {tile.desc}
                </p>
              </div>
              <span className={`text-[11px] font-bold mt-4 ${category === tile.name ? 'text-[#D4AF37]' : 'text-[#8A767A]'}`}>
                {tile.count} →
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Multi-Dimensional Filter & Sort Bar */}
      <section className="mt-8 pt-8 border-t border-[#E2D5BE]">
        <div className="flex flex-col gap-4">
          {/* Row 1: Categories & Format Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Interactive Category Segmented Controls */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-[#E2D5BE] rounded-xl shadow-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    category === cat
                      ? 'bg-[#4A0E17] text-white shadow-xs'
                      : 'text-[#5C4A4E] hover:text-[#1C1618] hover:bg-[#FAF6EE]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Wishlist quick toggle */}
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                showSavedOnly
                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-xs'
                  : 'bg-white border-[#E2D5BE] text-[#5C4A4E] hover:border-rose-400'
              }`}
            >
              <span>{showSavedOnly ? '♥' : '♡'}</span> Saved ({favoriteIds.length})
            </button>
          </div>

          {/* Row 2: Format filter, Price range, and Sorting dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            {/* Format Filter */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#5C4A4E]">
              <span className="font-semibold text-[#8A767A]">Format:</span>
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer font-medium ${
                    format === f
                      ? 'bg-[#1C1618] text-white'
                      : 'bg-white border border-[#E2D5BE] text-[#5C4A4E] hover:bg-[#FAF6EE]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Price & Sort Selectors */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[#8A767A] font-semibold">Price:</span>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value as typeof priceRange)}
                  className="bg-white border border-[#E2D5BE] rounded-lg px-2.5 py-1.5 text-[#1C1618] font-medium outline-none focus:border-[#4A0E17]"
                >
                  <option value="all">All Prices</option>
                  <option value="under5k">Under ₦5,000</option>
                  <option value="5k_to_10k">₦5,000 – ₦10,000</option>
                  <option value="above10k">Over ₦10,000</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[#8A767A] font-semibold">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="bg-white border border-[#E2D5BE] rounded-lg px-2.5 py-1.5 text-[#1C1618] font-medium outline-none focus:border-[#4A0E17]"
                >
                  <option value="featured">Featured / Staff Picks</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Counter and Active Filter Pill Tags */}
        <div className="mt-4 flex items-center justify-between text-xs text-[#8A767A] pt-2">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-[#1C1618] tabular-nums">{filteredItems.length}</strong> verified products</span>
            {category !== 'All' && <span className="text-[#5C4A4E]">in {category}</span>}
            {format !== 'All Formats' && <span className="text-[#5C4A4E]">({format})</span>}
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setQ('')
                setCategory('All')
                setFormat('All Formats')
                setPriceRange('all')
                setShowSavedOnly(false)
              }}
              className="font-bold text-[#4A0E17] hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </section>

      {/* Main Product Grid */}
      <section className="py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((p) => (
          <div key={p.id} className="flex flex-col h-full">
            <div className="flex-1">
              <ProductCard
                id={p.id}
                title={p.title}
                price={p.price}
                coverKey={p.cover_s3_key}
                store={p.store}
                status={p.status}
                category={p.category}
                format={p.format}
                rating={p.rating}
                salesCount={p.sales_count}
                badge={p.badge}
                onQuickView={() => setQuickViewProduct(p)}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Link to={`/product/${p.id}`} className="flex-1">
                <Button variant="secondary" className="w-full text-xs py-2 font-medium">
                  Details
                </Button>
              </Link>
              <Button
                variant="primary"
                disabled={busy}
                onClick={() => buy(p.id)}
                className="flex-1 text-xs py-2 font-bold"
              >
                Buy Now
              </Button>
            </div>
          </div>
        ))}
      </section>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E2D5BE] p-8 max-w-md mx-auto my-6 shadow-xs">
          <p className="text-3xl mb-3">🔍</p>
          <h3 className="font-bold text-lg text-[#1C1618]">No products match these filters</h3>
          <p className="text-sm text-[#8A767A] mt-1">
            Try resetting your search query or selecting a different category or file format.
          </p>
          <button
            onClick={() => {
              setQ('')
              setCategory('All')
              setFormat('All Formats')
              setPriceRange('all')
              setShowSavedOnly(false)
            }}
            className="mt-4 text-xs font-bold text-[#4A0E17] hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Featured Creator Spotlight */}
      <section id="creators" className="my-16 bg-[#4A0E17] text-[#FAF6EE] rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] bg-black/25 px-3 py-1 rounded-full mb-4">
            <span>★</span> VERIFIED CREATOR SPOTLIGHT
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Meet Annabel Studio: High-impact marketing & founder resources.
          </h2>
          <p className="text-[#F1E9D9] text-sm mt-3 leading-relaxed">
            Annabel builds top-rated growth workbooks, client onboarding frameworks, and author toolkits. Every purchase directly empowers independent African creators.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link to="/product/prod-bundle-1">
              <Button variant="secondary" className="font-bold text-xs py-2.5">
                Explore Ultimate Ebook Bundle →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ & Purchase Assurance Accordion */}
      <section id="faq" className="py-12 border-t border-[#E2D5BE]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[#1C1618]">Frequently Asked Questions</h2>
            <p className="text-xs text-[#8A767A] mt-1">Everything you need to know about purchasing and selling on Vessli.</p>
          </div>

          <div className="space-y-3">
            <FaqItem
              question="How do digital downloads work on Vessli?"
              answer="As soon as your Paystack transaction is verified by our server, your order is unlocked. You will immediately receive a secure download link from our private cloud storage. You can re-generate links anytime from your Buyer Hub."
            />
            <FaqItem
              question="What payment methods are supported?"
              answer="We process transactions securely via Paystack, supporting Nigerian Naira (NGN) bank transfers, debit cards (Mastercard, Visa, Verve), and USSD codes. Amounts are verified server-side before orders are fulfilled."
            />
            <FaqItem
              question="How does the 10% marketplace commission work?"
              answer="Unlike platforms charging up to 30% plus hidden processing markups, Vessli takes a flat 10% commission. Creators retain 90% of every sale, recorded immutably in their sales ledger."
            />
            <FaqItem
              question="How can I start selling my own digital templates or ebooks?"
              answer="Simply switch to Creator mode or click 'Sell on Vessli'. Set up your store profile, upload your cover and digital assets, and submit your listing. Submissions are reviewed within 24 hours."
            />
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={{
            id: quickViewProduct.id,
            title: quickViewProduct.title,
            description: quickViewProduct.description,
            price: quickViewProduct.price,
            store: quickViewProduct.store,
            category: quickViewProduct.category,
            coverKey: quickViewProduct.cover_s3_key,
            file_type: quickViewProduct.file_type,
            file_size: quickViewProduct.file_size,
            format: quickViewProduct.format,
            highlights: quickViewProduct.highlights,
          }}
          onClose={() => setQuickViewProduct(null)}
          onBuy={(id) => {
            setQuickViewProduct(null)
            buy(id)
          }}
          busy={busy}
        />
      )}
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl border border-[#E2D5BE] overflow-hidden shadow-xs transition">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#1C1618] cursor-pointer"
      >
        <span>{question}</span>
        <span className="text-[#4A0E17] text-base font-black shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-xs text-[#5C4A4E] leading-relaxed border-t border-[#E2D5BE]/40 pt-3">
          {answer}
        </div>
      )}
    </div>
  )
}

function Shell() {
  const loc = useLocation()
  const navigate = useNavigate()
  const { isChatOpen, openChat, closeChat } = useAI()
  const bare = loc.pathname === '/login'

  if (bare) {
    return (
      <APKMobileShell>
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
          <Nav />
          <Routes>
            <Route path="/login" element={<Auth />} />
          </Routes>
        </div>
      </APKMobileShell>
    )
  }

  return (
    <APKMobileShell>
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
        <Nav />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/account" element={<Account />} />
            <Route path="/seller" element={<Seller />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/apk" element={<APKDownloadPage />} />
            <Route path="/install-apk" element={<APKDownloadPage />} />
          </Routes>
        </main>

        {/* Floating AI Copilot Launcher (Visible on desktop; mobile uses bottom dock action) */}
        <button
          onClick={openChat}
          className="hidden md:flex fixed bottom-6 right-6 z-40 bg-[#4A0E17] hover:bg-[#380b12] text-[#FAF7F2] border-2 border-[#D4AF37] px-4 py-3 shadow-2xl items-center gap-2.5 transition transform hover:-translate-y-0.5 cursor-pointer font-bold text-xs uppercase tracking-wider"
          aria-label="Open AI Shopping Concierge"
        >
          <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block animate-pulse"></span>
          <span>Ask Vessli Copilot</span>
        </button>

        {/* Global AI Chat Modal */}
        <AIChatModal
          isOpen={isChatOpen}
          onClose={closeChat}
          catalog={FALLBACK_PRODUCTS}
          onSelectProduct={(p) => {
            navigate('/product/' + p.id)
          }}
        />

        <footer className="text-center text-sm text-[#8A767A] py-10 border-t border-[#E2D5BE]/60 mt-16 bg-[#FAF6EE] pb-24 md:pb-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-[#1C1618]">
              <span className="w-6 h-6 rounded-md bg-[#4A0E17] text-white flex items-center justify-center text-xs font-black">
                V
              </span>
              Vessli Marketplace
            </div>
            <p className="text-xs">
              Vessli <span className="text-[#D4AF37]">©</span> 2026 —{' '}
              <span className="text-[#4A0E17] font-semibold">10% commission</span>, verified Paystack checkout & instant secure delivery.
            </p>
            <div className="flex gap-4 text-xs font-semibold text-[#5C4A4E]">
              <Link to="/" className="hover:text-[#4A0E17]">Discover</Link>
              <Link to="/account" className="hover:text-[#4A0E17]">Buyer Hub</Link>
            </div>
          </div>
        </footer>
      </div>
    </APKMobileShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <AIProvider>
            <Shell />
          </AIProvider>
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
