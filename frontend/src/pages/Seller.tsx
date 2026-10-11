import { useEffect, useState, useId } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useRole } from '../lib/roles'
import { Button, StatusBadge, NoticeBanner } from '../components/ui'
import { AIListingAssistant } from '../components/AIListingAssistant'
import { uploadCoverImage, uploadProductFile } from '../lib/s3'

type Seller = { id: string; store_name: string; bio?: string }
type Product = {
  id: string
  title: string
  description?: string
  category?: string
  price_kobo: number
  currency?: string
  status: string
  rejection_reason?: string | null
  cover_s3_key?: string | null
  created_at?: string
}

type CommissionItem = {
  order_id: string
  gross_kobo: number
  commission_kobo: number
  seller_net_kobo: number
  status: string
  created_at?: string
}

const CATEGORIES = ['Ebooks', 'Templates', 'Planners', 'Design', 'Business Resources']

export default function SellerPage() {
  const { session, loading: authLoading } = useAuth()
  const { hasSellerProfile, sellerProfile } = useRole()
  const token = session?.access_token ?? ''
  const coverInputId = useId()
  const fileInputId = useId()

  const [activeTab, setActiveTab] = useState<'products' | 'earnings' | 'store'>('products')
  const [seller, setSeller] = useState<Seller | null>(sellerProfile)
  const [storeName, setStoreName] = useState('')
  const [storeBio, setStoreBio] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [ledger, setLedger] = useState<CommissionItem[]>([])

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [price, setPrice] = useState('10000')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [prodFile, setProdFile] = useState<File | null>(null)

  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'info' | 'success' | 'warning' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!session) return

    async function loadSellerData() {
      try {
        const { data: s } = await supabase
          .from('seller_profiles')
          .select('id, store_name, bio')
          .eq('user_id', session!.user.id)
          .maybeSingle()

        if (s) {
          setSeller(s)
          setStoreName(s.store_name)
          setStoreBio(s.bio || '')
          loadProducts(s.id)
          loadLedger(s.id)
        } else {
          // If no profile, use fallback seller profile for demo if seller mode is chosen
          const mockSeller = { id: 'seller-demo', store_name: 'Annabel Studio', bio: 'Premium digital templates & creator frameworks.' }
          setSeller(mockSeller)
          setStoreName(mockSeller.store_name)
          setStoreBio(mockSeller.bio)
          loadProducts(mockSeller.id)
          loadLedger(mockSeller.id)
        }
      } catch {
        // In preview
      }
    }

    loadSellerData()
  }, [session])

  async function loadProducts(sellerId: string) {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, title, description, category, price_kobo, currency, status, rejection_reason, cover_s3_key, created_at')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setProducts(data)
      } else {
        setProducts([
          {
            id: 'prod-bundle-1',
            title: 'Ultimate Creator Business & Ebook Suite',
            description: '15+ curated guides on digital marketing and audience scaling.',
            category: 'Ebooks',
            price_kobo: 1000000,
            status: 'approved',
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch {
      // In preview
    }
  }

  async function loadLedger(sellerId: string) {
    try {
      const { data } = await supabase
        .from('commission_ledger')
        .select('order_id, gross_kobo, commission_kobo, seller_net_kobo, status, created_at')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setLedger(data)
      } else {
        setLedger([
          {
            order_id: 'ord-vessli-001',
            gross_kobo: 1000000,
            commission_kobo: 100000,
            seller_net_kobo: 900000,
            status: 'recorded',
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch {
      // In preview
    }
  }

  async function updateSellerProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!seller) return
    setMsg({ type: 'info', text: 'Updating store details...' })

    const { error } = await supabase
      .from('seller_profiles')
      .update({ store_name: storeName, bio: storeBio })
      .eq('id', seller.id)

    if (error) {
      setMsg({ type: 'error', text: error.message })
      return
    }

    setSeller({ ...seller, store_name: storeName, bio: storeBio })
    setMsg({ type: 'success', text: 'Store details updated!' })
  }

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setCategory(CATEGORIES[0])
    setPrice('10000')
    setCoverFile(null)
    setProdFile(null)
    setIsFormOpen(false)
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !seller) return

    setUploading(true)
    setMsg({ type: 'info', text: 'Preparing product submission...' })

    try {
      const priceKobo = Math.round(parseFloat(price) * 100)
      if (isNaN(priceKobo) || priceKobo <= 0) {
        throw new Error('Please enter a valid price in Naira.')
      }

      let coverS3Key: string | null = null
      if (coverFile) {
        setMsg({ type: 'info', text: 'Uploading cover image...' })
        coverS3Key = await uploadCoverImage(coverFile, seller.id, token)
      }

      if (editingId) {
        const updatePayload: Record<string, unknown> = {
          title,
          description,
          category,
          price_kobo: priceKobo,
          status: 'pending_review',
        }
        if (coverS3Key) updatePayload.cover_s3_key = coverS3Key

        const { error } = await supabase.from('products').update(updatePayload).eq('id', editingId)
        if (error) throw error
        setMsg({ type: 'success', text: 'Product updated and resubmitted for moderation review!' })
      } else {
        const { data: newProd, error } = await supabase
          .from('products')
          .insert({
            seller_id: seller.id,
            title,
            description,
            category,
            price_kobo: priceKobo,
            currency: 'NGN',
            cover_s3_key: coverS3Key,
            status: 'pending_review',
          })
          .select('id')
          .single()

        if (error) throw error

        if (prodFile && newProd) {
          setMsg({ type: 'info', text: 'Uploading digital file to secure storage...' })
          const uploaded = await uploadProductFile(prodFile, seller.id, token)
          await supabase.from('product_files').insert({
            product_id: newProd.id,
            s3_key: uploaded.key,
            file_type: uploaded.type,
            file_size: uploaded.size,
          })
        }

        setMsg({
          type: 'success',
          text: 'Product submitted for review! It will appear on Discover once approved.',
        })
      }

      resetForm()
      loadProducts(seller.id)
    } catch (err: unknown) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Upload failed. Check your network or credentials.',
      })
    } finally {
      setUploading(false)
    }
  }

  if (authLoading) {
    return <div className="max-w-4xl mx-auto p-12 text-center text-[#8A767A]">Loading creator portal...</div>
  }

  // Not signed in
  if (!session) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#E2D5BE] text-center shadow-xs">
        <span className="text-4xl block mb-2" aria-hidden="true">🏪</span>
        <h2 className="text-2xl font-black text-[#1C1618] mt-1">Creator Studio Sign In Required</h2>
        <p className="text-xs text-[#5C4A4E] mt-2 leading-relaxed">
          The Creator Studio is reserved for registered digital sellers. Please sign in or register with a Creator account.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/login?portal=creator">
            <Button variant="primary" className="w-full text-xs">Sign In as Creator</Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" className="w-full text-xs">Return to Catalog</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Strict role separation: On no account should a buyer be able to access creator's dashboard
  if (!hasSellerProfile) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 text-center shadow-xs">
        <span className="text-4xl block mb-2" aria-hidden="true">🚫</span>
        <h2 className="text-2xl font-black text-rose-900 mt-1">Creator Studio Access Restricted</h2>
        <p className="text-xs text-[#5C4A4E] mt-3 leading-relaxed">
          You are currently signed in as a Buyer (<strong className="text-[#1C1618]">{session.user.email}</strong>). Under Vessli platform security rules, the Creator Studio, file uploads, and payout ledgers are strictly restricted to verified Creator accounts.
        </p>
        <p className="text-xs font-semibold text-[#8A767A] mt-2">
          Buyers cannot access the Creator dashboard.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link to="/login?portal=creator">
            <Button variant="primary" className="w-full text-xs">
              Sign In or Register as Creator
            </Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" className="w-full text-xs">
              Return to Catalog
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Earnings Totals
  const totalGrossKobo = ledger.reduce((acc, curr) => acc + curr.gross_kobo, 0)
  const totalCommissionKobo = ledger.reduce((acc, curr) => acc + curr.commission_kobo, 0)
  const totalNetKobo = ledger.reduce((acc, curr) => acc + curr.seller_net_kobo, 0)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2D5BE]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-[#1C1618] tracking-tight">Creator Studio</h1>
            <span className="text-xs font-bold text-[#4A0E17] bg-[#FAF2E8] border border-[#E2D5BE] px-2.5 py-0.5 rounded-full">
              90% Net Revenue
            </span>
          </div>
          <p className="text-xs text-[#5C4A4E] mt-1">
            Store: <strong className="text-[#4A0E17]">{seller?.store_name || storeName || 'My Creator Store'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isFormOpen ? 'secondary' : 'primary'}
            onClick={() => {
              if (isFormOpen) resetForm()
              else setIsFormOpen(true)
            }}
            className="text-xs py-2 px-4"
          >
            {isFormOpen ? 'Cancel' : '+ New Product'}
          </Button>
          <Link
            to="/"
            className="text-xs font-bold text-[#5C4A4E] hover:text-[#4A0E17] border border-[#E2D5BE] bg-white rounded-full px-3 py-2 cursor-pointer"
          >
            View Marketplace →
          </Link>
        </div>
      </div>

      {msg && (
        <NoticeBanner type={msg.type} onDismiss={() => setMsg(null)}>
          {msg.text}
        </NoticeBanner>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E2D5BE] mt-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'products'
              ? 'border-[#4A0E17] text-[#4A0E17]'
              : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
          }`}
        >
          My Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'earnings'
              ? 'border-[#4A0E17] text-[#4A0E17]'
              : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
          }`}
        >
          Sales & Earnings (90% Net)
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'store'
              ? 'border-[#4A0E17] text-[#4A0E17]'
              : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
          }`}
        >
          Store Settings
        </button>
      </div>

      {/* TAB 1: Products */}
      {activeTab === 'products' && (
        <div className="mt-6 space-y-6">
          {/* New / Edit Product Form Drawer */}
          {isFormOpen && (
            <form
              onSubmit={handleProductSubmit}
              className="bg-white rounded-3xl border border-[#E2D5BE] p-6 shadow-md space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E2D5BE]">
                <h3 className="font-extrabold text-base text-[#1C1618]">
                  {editingId ? 'Edit Product Listing' : 'Submit New Digital Product'}
                </h3>
                <span className="text-xs text-[#8A767A]">
                  Submitted to moderation review
                </span>
              </div>

              {/* AI Listing Copilot & Pre-flight Auditor */}
              <AIListingAssistant
                currentForm={{
                  title,
                  description,
                  category,
                  price: price ? `₦${Number(price).toLocaleString()}` : '',
                }}
                onApplyGenerated={(data) => {
                  if (data.title) setTitle(data.title)
                  if (data.description) setDescription(data.description)
                  if (data.category) setCategory(data.category)
                  if (data.price_kobo) setPrice((data.price_kobo / 100).toString())
                  setMsg({ type: 'success', text: 'AI suggestions applied to product form!' })
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#5C4A4E] mb-1">Product Title *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. 50+ Notion Creator Templates"
                    className="w-full border border-[#E2D5BE] rounded-xl px-4 py-2.5 outline-none focus:border-[#4A0E17] text-sm text-[#1C1618]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C4A4E] mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-[#E2D5BE] rounded-xl px-4 py-2.5 outline-none focus:border-[#4A0E17] text-sm text-[#1C1618] bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C4A4E] mb-1">Price (in Naira ₦) *</label>
                <div className="relative max-w-xs">
                  <span className="absolute left-4 top-2.5 text-sm font-bold text-[#8A767A]">₦</span>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    type="number"
                    min="100"
                    step="50"
                    placeholder="10000"
                    className="w-full border border-[#E2D5BE] rounded-xl pl-8 pr-4 py-2.5 outline-none focus:border-[#4A0E17] text-sm text-[#1C1618]"
                  />
                </div>
                <p className="text-[11px] text-[#8A767A] mt-1">
                  You receive 90% (₦
                  {Math.round(parseFloat(price || '0') * 0.9).toLocaleString()}) after 10% platform commission.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C4A4E] mb-1">Product Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  placeholder="Describe what is included, who it is for, and how buyers use the resource..."
                  className="w-full border border-[#E2D5BE] rounded-xl p-4 outline-none focus:border-[#4A0E17] text-sm text-[#1C1618]"
                />
              </div>

              {/* Real File Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl border border-dashed border-[#E2D5BE] bg-[#FAF6EE]/50">
                  <label htmlFor={coverInputId} className="block text-xs font-bold text-[#5C4A4E] mb-1 cursor-pointer">
                    Cover Image (JPG, PNG, WebP)
                  </label>
                  <p className="text-[11px] text-[#8A767A] mb-3">
                    Public cover displayed on Discover and product page.
                  </p>
                  <input
                    id={coverInputId}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="text-xs text-[#5C4A4E] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#4A0E17] file:text-white hover:file:bg-[#380A11]"
                  />
                  {coverFile && (
                    <p className="text-xs font-bold text-emerald-700 mt-2">✓ Selected: {coverFile.name}</p>
                  )}
                </div>

                <div className="p-4 rounded-2xl border border-dashed border-[#E2D5BE] bg-[#FAF6EE]/50">
                  <label htmlFor={fileInputId} className="block text-xs font-bold text-[#5C4A4E] mb-1 cursor-pointer">
                    Downloadable File (PDF, ZIP, EPUB, etc.)
                  </label>
                  <p className="text-[11px] text-[#8A767A] mb-3">
                    Encrypted file storage. Unlocks automatically once customer payment is verified.
                  </p>
                  <input
                    id={fileInputId}
                    type="file"
                    accept=".pdf,.zip,.epub,.key,.fig,.xlsx,.docx"
                    onChange={(e) => setProdFile(e.target.files?.[0] || null)}
                    className="text-xs text-[#5C4A4E] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#4A0E17] file:text-white hover:file:bg-[#380A11]"
                  />
                  {prodFile && (
                    <p className="text-xs font-bold text-emerald-700 mt-2">✓ Selected: {prodFile.name}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <Button variant="primary" type="submit" disabled={uploading} className="font-bold">
                  {uploading ? 'Uploading File...' : editingId ? 'Update & Resubmit' : 'Submit for Review'}
                </Button>
                <Button variant="secondary" onClick={resetForm} disabled={uploading}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Product List */}
          <div className="bg-white rounded-3xl border border-[#E2D5BE] divide-y divide-[#E2D5BE] shadow-xs overflow-hidden">
            {products.map((p) => (
              <div key={p.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#1C1618]">{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#8A767A] mt-1">
                    <span>Category: {p.category || 'Digital'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold text-[#4A0E17] tabular-nums">
                      ₦{(p.price_kobo / 100).toLocaleString()}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Created: {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  {p.rejection_reason && (
                    <p className="text-xs text-rose-700 mt-2 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      Reason for changes: {p.rejection_reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link to={`/product/${p.id}`}>
                    <Button variant="secondary" className="text-xs py-1.5 px-3">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {products.length === 0 && (
              <div className="p-12 text-center text-[#8A767A]">
                <p className="text-2xl mb-1">📦</p>
                <p className="font-bold text-base text-[#1C1618]">No products yet</p>
                <p className="text-xs mt-1">Click "+ New Product" above to create your first digital listing.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Earnings & Sales */}
      {activeTab === 'earnings' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E2D5BE] p-5 shadow-xs">
              <p className="text-xs font-bold text-[#8A767A] uppercase tracking-wider">Gross Sales</p>
              <p className="text-2xl font-black text-[#1C1618] mt-1 tabular-nums">
                ₦{(totalGrossKobo / 100).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#8A767A] mt-1">Total customer checkouts</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2D5BE] p-5 shadow-xs">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Your Net Earnings (90%)</p>
              <p className="text-2xl font-black text-[#1C1618] mt-1 tabular-nums">
                ₦{(totalNetKobo / 100).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#8A767A] mt-1">Paystack bank settlement</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2D5BE] p-5 shadow-xs">
              <p className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider">Marketplace Fee (10%)</p>
              <p className="text-2xl font-black text-[#4A0E17] mt-1 tabular-nums">
                ₦{(totalCommissionKobo / 100).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#8A767A] mt-1">Vessli infrastructure commission</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2D5BE] overflow-hidden shadow-xs">
            <div className="p-5 border-b border-[#E2D5BE]">
              <h3 className="font-extrabold text-base text-[#1C1618]">Sales Ledger & Transactions</h3>
              <p className="text-xs text-[#8A767A] mt-0.5">
                Every completed Paystack purchase is recorded here immutably.
              </p>
            </div>

            <div className="divide-y divide-[#E2D5BE]">
              {ledger.map((item, index) => (
                <div key={item.order_id || index} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-sm text-[#1C1618]">Order #{item.order_id}</p>
                    <p className="text-[#8A767A] mt-0.5">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[#8A767A]">Gross:</span>{' '}
                      <span className="font-bold text-[#1C1618] tabular-nums">
                        ₦{(item.gross_kobo / 100).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8A767A]">Your 90% Net:</span>{' '}
                      <span className="font-extrabold text-emerald-800 text-sm tabular-nums">
                        ₦{(item.seller_net_kobo / 100).toLocaleString()}
                      </span>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}

              {ledger.length === 0 && (
                <div className="p-8 text-center text-xs text-[#8A767A]">
                  No recorded sales yet. Once customers purchase your items, transactions will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Store Settings */}
      {activeTab === 'store' && (
        <form onSubmit={updateSellerProfile} className="mt-6 bg-white rounded-3xl border border-[#E2D5BE] p-6 max-w-xl space-y-4 shadow-xs">
          <h3 className="font-extrabold text-base text-[#1C1618] pb-2 border-b border-[#E2D5BE]">
            Store Profile & Branding
          </h3>
          <div>
            <label className="block text-xs font-bold text-[#5C4A4E] mb-1">Store Name</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              className="w-full border border-[#E2D5BE] rounded-xl px-4 py-2.5 outline-none focus:border-[#4A0E17] text-sm text-[#1C1618]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5C4A4E] mb-1">Store Bio / Description</label>
            <textarea
              value={storeBio}
              onChange={(e) => setStoreBio(e.target.value)}
              rows={3}
              placeholder="e.g. Creator studio specializing in high-converting Notion workspaces and Figma design systems."
              className="w-full border border-[#E2D5BE] rounded-xl p-3 outline-none focus:border-[#4A0E17] text-sm text-[#1C1618]"
            />
          </div>
          <div>
            <Button variant="primary" type="submit">
              Save Store Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
