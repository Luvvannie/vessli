import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Button, StatusBadge } from '../components/ui'

type Seller = { id: string; store_name: string }
type Product = { id: string; title: string; price_kobo: number; status: string }

export default function Seller() {
  const { session, loading } = useAuth()
  const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  const token = session?.access_token ?? ''
  const [seller, setSeller] = useState<Seller | null>(null)
  const [storeName, setStoreName] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('10000')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!session) return
    supabase.from('seller_profiles').select('id,store_name').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => { if (data) { setSeller(data); loadProducts(data.id) } })
  }, [session])

  async function loadProducts(sellerId: string) {
    const { data } = await supabase.from('products').select('id,title,price_kobo,status').eq('seller_id', sellerId).order('created_at', { ascending: false })
    if (data) setProducts(data)
  }

  async function doUploadCover() {
    if (!seller) return
    const coverKey = `covers/${seller.id}.jpg`
    try {
      const url = await generateCoverUrl(coverKey)
      setMsg(`Cover uploaded: ${url}`)
    } catch (err: any) {
      setMsg(`Cover upload failed: ${err.message}`)
    }
  }

  async function doUploadFile() {
    if (!seller) return
    const prodKey = `products/${seller.id}.pdf`
    try {
      const url = await generateFileUrl(prodKey)
      setMsg(`Product file uploaded: ${url}`)
    } catch (err: any) {
      setMsg(`Product upload failed: ${err.message}`)
    }
  }

  async function generateCoverUrl(key: string): Promise<string> {
    const res = await fetch(`${VITE_SUPABASE_URL}/functions/v1/generate-cover-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key }),
    })
    if (!res.ok) throw new Error('Cover upload failed')
    const data = await res.json()
    return data.url as string
  }

  async function generateFileUrl(key: string): Promise<string> {
    const res = await fetch(`${VITE_SUPABASE_URL}/functions/v1/generate-file-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key }),
    })
    if (!res.ok) throw new Error('Product upload failed')
    const data = await res.json()
    return data.url as string
  }

  async function createSeller(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setMsg('Creating store...')
    const { data, error } = await supabase.from('seller_profiles').insert({ user_id: session.user.id, store_name: storeName }).select('id,store_name').single()
    if (error) { setMsg(error.message); return }
    setSeller(data); setMsg(`Store "${data.store_name}" created.`)
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !seller) return
    setMsg('Submitting for review...')
    const priceKobo = Math.round(parseFloat(price) * 100)
    const { error } = await supabase.from('products').insert({
      seller_id: seller.id, title, description: title, category: 'general',
      price_kobo: priceKobo, currency: 'NGN', status: 'pending_review',
    })
    if (error) { setMsg(error.message); return }
    setTitle(''); setMsg('Submitted! Now upload cover and product files to S3.')

    doUploadCover()
    doUploadFile()

    loadProducts(seller.id)
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!session) return <div className="p-8 text-center">Please <a href="/login" className="text-wine font-bold">log in</a> to sell.</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold text-wine-dark">Seller Dashboard</h1>
      {seller ? (
        <>
          <p className="mt-1 text-sm text-[#5C4A4E]">Store: <b>{seller.store_name}</b></p>
          <form onSubmit={createProduct} className="mt-4 bg-white rounded-2xl border border-[#E2D5BE] p-5 grid gap-3">
            <p className="font-semibold">New product — goes to <StatusBadge status="pending_review" /></p>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Title, e.g. Ultimate Ebook Bundle" className="border border-[#E2D5BE] rounded-xl px-4 py-3 outline-none focus:border-wine" />
            <input value={price} onChange={(e) => setPrice(e.target.value)} required inputMode="decimal" placeholder="Price in ₦, e.g. 10000" className="border border-[#E2D5BE] rounded-xl px-4 py-3 outline-none focus:border-wine" />
            <p className="text-xs text-[#8A767A]">Cover + file upload to S3 buckets (vessli-covers / vessli-product-files) will attach here once server upload URLs are deployed. Price is stored as kobo.</p>
            <div><Button>Submit for review</Button></div>
            <div className="mt-4 bg-white rounded-2xl border divide-y">
              {products.map((p) => (
                <div key={p.id} className="p-4 flex items-center gap-3">
                  <span className="flex-1 font-medium">{p.title} ₦{(p.price_kobo / 100).toLocaleString()}</span>
                  <StatusBadge status={p.status} />
                </div>
              ))}
              {products.length === 0 && <p className="p-4 text-sm text-[#8A767A]">No products yet.</p>}
            </div>
          </form>
          <div className="mt-4 bg-white rounded-2xl border divide-y">
            {/* Upload cover image */}
            <label>
              <span className="text-sm text-[#FFD700]">Upload Cover</span>
              <input type="text" value={`covers/${seller.id}.jpg`} className="hidden" />
              <button onClick={doUploadCover}>Upload Cover</button>
            </label>

            {/* Upload product file */}
            <label>
              <span className="text-sm text-[#FFD700]">Upload Product</span>
              <input type="text" value={`products/${seller.id}.pdf`} className="hidden" />
              <button onClick={doUploadFile}>Upload File</button>
            </label>
          </div>
          {msg && <p className="mt-3 text-sm bg-gold-soft rounded-lg p-3">{msg}</p>}
        </>
      ) : (
        <form onSubmit={createSeller} className="mt-4 bg-white rounded-2xl border border-[#E2D5BE] p-5">
          <p className="font-semibold">Create your store</p>
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} required placeholder="Store name, e.g. Annabel Studio" className="mt-3 w-full border border-[#E2D5BE] rounded-xl px-4 py-3 outline-none focus:border-wine" />
          <div className="mt-3"><Button>Create store</Button></div>
        </form>
      )}
    </div>
  )
}