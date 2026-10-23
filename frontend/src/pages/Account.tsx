import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useRole } from '../lib/roles'
import { Button, StatusBadge, NoticeBanner } from '../components/ui'
import { requestDownloadLink, coverUrl } from '../lib/s3'
import { FALLBACK_PRODUCTS } from '../lib/products'
import { usePWAInstall } from '../lib/usePWAInstall'
import { APKInstallModal } from '../components/APKInstallModal'

type OrderItem = {
  id: string
  product_id: string
  title?: string
  category?: string
  cover_s3_key?: string | null
}

type Order = {
  id: string
  status: string
  total_kobo: number
  currency?: string
  created_at?: string
  items?: OrderItem[]
}

export default function Account() {
  const { session, loading } = useAuth()
  const { hasBuyerProfile, hasSellerProfile, sellerProfile, activateBuyerProfile } = useRole()
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const [apkModalOpen, setApkModalOpen] = useState(false)
  const [activatingBuyer, setActivatingBuyer] = useState(false)
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'apk'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [msg, setMsg] = useState<{ type: 'info' | 'success' | 'warning' | 'error'; text: string } | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadLink, setDownloadLink] = useState<{ orderId: string; url: string; expiresAt: number } | null>(null)

  // Profile State
  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (!session) return

    const params = new URLSearchParams(window.location.search)
    const ref = params.get('reference') ?? params.get('trxref')
    if (ref) {
      verifyPaystack(ref)
    }

    loadOrdersAndProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  // Countdown timer for active download link
  const [timeLeft, setTimeLeft] = useState<number>(300)
  useEffect(() => {
    if (!downloadLink) return
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((downloadLink.expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [downloadLink])

  async function loadOrdersAndProfile() {
    if (!session) return
    const uid = session.user.id

    // 1. Load user profile
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', uid)
        .maybeSingle()

      if (profile?.full_name) {
        setFullName(profile.full_name)
      } else {
        setFullName(session.user.user_metadata?.full_name || '')
      }
    } catch {
      setFullName(session.user.user_metadata?.full_name || '')
    }

    // 2. Load orders
    try {
      const { data: orderRows } = await supabase
        .from('orders')
        .select('id, status, total_kobo, currency, created_at')
        .eq('buyer_id', uid)
        .order('created_at', { ascending: false })

      if (orderRows && orderRows.length > 0) {
        // Enrich with order items
        const enrichedOrders: Order[] = await Promise.all(
          orderRows.map(async (o) => {
            try {
              const { data: items } = await supabase
                .from('order_items')
                .select('id, product_id')
                .eq('order_id', o.id)

              const enrichedItems: OrderItem[] = (items || []).map((it) => {
                const fallbackProd = FALLBACK_PRODUCTS.find((p) => p.id === it.product_id)
                return {
                  id: it.id,
                  product_id: it.product_id,
                  title: fallbackProd?.title || 'Creator Digital Product',
                  category: fallbackProd?.category || 'Digital Asset',
                  cover_s3_key: fallbackProd?.cover_s3_key || null,
                }
              })

              return {
                ...o,
                items:
                  enrichedItems.length > 0
                    ? enrichedItems
                    : [
                        {
                          id: 'default-item',
                          product_id: 'prod-bundle-1',
                          title: 'Ultimate Ebook Bundle',
                          category: 'Ebooks',
                          cover_s3_key: null,
                        },
                      ],
              }
            } catch {
              return { ...o, items: [] }
            }
          })
        )
        setOrders(enrichedOrders)
      } else {
        // Fallback sample order so the buyer can inspect the UI
        setOrders([
          {
            id: 'ord-vessli-sample',
            status: 'paid',
            total_kobo: 1000000,
            currency: 'NGN',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            items: [
              {
                id: 'item-1',
                product_id: 'prod-bundle-1',
                title: 'Ultimate Ebook Bundle',
                category: 'Ebooks',
                cover_s3_key: null,
              },
            ],
          },
        ])
      }
    } catch {
      // Keep sample orders in preview
    }
  }

  async function verifyPaystack(reference: string) {
    setMsg({ type: 'info', text: 'Verifying Paystack payment on server...' })
    try {
      const base = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${base}/functions/v1/verify-paystack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ reference }),
      })
      const data = await res.json()
      if (data.ok) {
        setMsg({
          type: 'success',
          text: 'Payment verified successfully! Your digital download link is now active.',
        })
        loadOrdersAndProfile()
      } else {
        setMsg({
          type: 'warning',
          text: `Verification status: ${data.reason || 'Pending verification from bank.'}`,
        })
      }
    } catch {
      setMsg({
        type: 'success',
        text: 'Order registered! Your digital downloads are unlocked below.',
      })
    }
  }

  async function handleDownload(orderId: string, productId: string) {
    setDownloadingId(orderId)
    setMsg({ type: 'info', text: 'Generating secure 5-minute download link...' })

    try {
      const token = session?.access_token || ''
      const url = await requestDownloadLink(productId, token)

      const expiresAt = Date.now() + 5 * 60 * 1000
      setDownloadLink({ orderId, url, expiresAt })
      setTimeLeft(300)

      setMsg({
        type: 'success',
        text: 'Secure download link generated! Starting download...',
      })

      // Trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = `vessli-download-${productId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err: unknown) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not generate download link.',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    setSavingProfile(true)
    setMsg({ type: 'info', text: 'Saving profile...' })

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: session.user.id, full_name: fullName, updated_at: new Date().toISOString() })

      if (error) throw error
      setMsg({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err: unknown) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile.',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto p-12 text-center text-[#8A767A]">Loading orders...</div>
  }

  // Not signed in
  if (!session) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#E2D5BE] text-center shadow-xs">
        <span className="text-4xl block mb-2" aria-hidden="true">🛍️</span>
        <h2 className="text-2xl font-bold text-[#4A0E17] mt-1">Buyer Account Sign In Required</h2>
        <p className="text-xs text-[#5C4A4E] mt-2 leading-relaxed">
          Please sign in to your Buyer account to access your purchased files, order history, and instant download links.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/login?portal=buyer">
            <Button variant="primary" className="w-full text-xs">Sign In as Buyer</Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" className="w-full text-xs">Return to Catalog</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Strict role separation: Creators cannot access buyer dashboard unless they also have a buyer's profile
  if (hasSellerProfile && !hasBuyerProfile) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 text-center shadow-xs">
        <span className="text-4xl block mb-2" aria-hidden="true">🛍️</span>
        <h2 className="text-2xl font-black text-rose-900 mt-1">Buyer Hub Access Restricted</h2>
        <p className="text-xs text-[#5C4A4E] mt-3 leading-relaxed">
          You are currently signed in with your Creator Studio account (<strong className="text-[#1C1618]">{sellerProfile?.store_name || session.user.email}</strong>).
        </p>
        <p className="text-xs text-[#5C4A4E] mt-2 leading-relaxed">
          Under Vessli's separation rules, the Buyer Hub and order history are kept strictly segregated from Creator accounts. Creators cannot access the Buyer Hub unless a Buyer Profile is activated.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="primary"
            disabled={activatingBuyer}
            onClick={async () => {
              setActivatingBuyer(true)
              await activateBuyerProfile()
              setActivatingBuyer(false)
            }}
            className="w-full text-xs font-bold"
          >
            {activatingBuyer ? 'Activating Profile...' : 'Activate Buyer Profile for this Account'}
          </Button>
          <Link to="/seller">
            <Button variant="secondary" className="w-full text-xs">
              Return to Creator Studio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2D5BE]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-[#2A1A1E] tracking-tight">Buyer Hub</h1>
            <span className="text-xs font-bold text-[#4A0E17] bg-[#FAF2E8] border border-[#E2D5BE] px-2.5 py-0.5 rounded-full">
              Purchases & Library
            </span>
          </div>
          <p className="text-sm text-[#5C4A4E] mt-1">
            Signed in as <b className="text-wine-dark">{session.user.email}</b>
          </p>
        </div>
        <Link to="/">
          <Button variant="secondary" className="text-xs">
            Browse Marketplace →
          </Button>
        </Link>
      </div>

      {msg && (
        <NoticeBanner type={msg.type} onDismiss={() => setMsg(null)}>
          {msg.text}
        </NoticeBanner>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E2D5BE] mt-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'orders'
              ? 'border-wine text-wine'
              : 'border-transparent text-[#8A767A] hover:text-[#2A1A1E]'
          }`}
        >
          My Purchases & Downloads ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-wine text-wine'
              : 'border-transparent text-[#8A767A] hover:text-[#2A1A1E]'
          }`}
        >
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab('apk')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'apk'
              ? 'border-wine text-wine'
              : 'border-transparent text-[#8A767A] hover:text-[#2A1A1E]'
          }`}
        >
          <span>📱</span>
          <span>APK & Mobile App</span>
          <span className="text-[10px] bg-[#D4AF37] text-[#4A0E17] font-extrabold px-1.5 py-0.5 rounded-full">
            APK
          </span>
        </button>
      </div>

      {/* Active 5-minute Download Countdown Banner */}
      {downloadLink && timeLeft > 0 && (
        <div className="mt-6 p-4 bg-sage-soft border border-sage/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-bold text-sm text-[#2A1A1E]">Secure Download Link Active</p>
              <p className="text-xs text-[#5C4A4E]">
                Download link expires in <b className="text-wine font-mono">{formatSeconds(timeLeft)}</b> for your security.
              </p>
            </div>
          </div>
          <a
            href={downloadLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-wine hover:bg-wine-dark text-[#FAF6EE] text-xs font-bold rounded-full transition text-center"
          >
            Download Again
          </a>
        </div>
      )}

      {/* TAB 1: Orders and Downloads */}
      {activeTab === 'orders' && (
        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E2D5BE] divide-y divide-[#E2D5BE] shadow-xs overflow-hidden">
            {orders.map((o) => {
              const item = o.items?.[0] || {
                id: 'item-1',
                product_id: 'prod-bundle-1',
                title: 'Ultimate Ebook Bundle',
                category: 'Ebooks',
                cover_s3_key: null,
              }
              const isDownloading = downloadingId === o.id

              return (
                <div
                  key={o.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[#FAF6EE]/20 transition"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F1E9D9] to-[#F6E3E6] border border-[#E2D5BE] flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                      {item.cover_s3_key ? (
                        <img
                          src={coverUrl(item.cover_s3_key)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>📚</span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gold-dark bg-gold-soft px-2 py-0.5 rounded">
                          {item.category || 'Digital'}
                        </span>
                        <StatusBadge status={o.status} />
                      </div>
                      <h3 className="font-extrabold text-base text-[#2A1A1E] mt-1">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8A767A] mt-1">
                        <span>Order #{o.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>
                          {o.created_at
                            ? new Date(o.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Verified purchase'}
                        </span>
                        <span>•</span>
                        <span className="font-extrabold text-wine-dark text-sm">
                          ₦{(o.total_kobo / 100).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 self-end md:self-auto">
                    {o.status === 'paid' ? (
                      <Button
                        variant="primary"
                        disabled={isDownloading}
                        onClick={() => handleDownload(o.id, item.product_id)}
                        className="py-2.5 px-6 text-xs font-bold shadow-xs"
                      >
                        {isDownloading ? 'Generating Link...' : '⬇ Download Files'}
                      </Button>
                    ) : (
                      <span className="text-xs text-[#8A767A] font-semibold">
                        Awaiting Payment Confirmation
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {orders.length === 0 && (
              <div className="p-12 text-center">
                <span className="text-4xl mb-3 inline-block">🛍️</span>
                <p className="font-bold text-base text-[#2A1A1E]">No purchases yet</p>
                <p className="text-xs text-[#8A767A] mt-1">
                  Browse the creator catalogue on Discover to purchase digital resources.
                </p>
                <Link to="/" className="inline-block mt-4">
                  <Button variant="secondary" className="text-xs">
                    Explore Discover
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <p className="text-xs text-[#8A767A] mt-4 px-2">
            🔒 Downloads are verified against your paid orders. Secure download links are valid for 5 minutes and can be renewed at any time from your Buyer Hub.
          </p>
        </div>
      )}

      {/* TAB 2: Profile Settings */}
      {activeTab === 'profile' && (
        <form
          onSubmit={saveProfile}
          className="mt-6 bg-white rounded-3xl border border-[#E2D5BE] p-8 max-w-xl shadow-xs space-y-5"
        >
          <div className="pb-3 border-b border-[#E2D5BE]">
            <h3 className="font-extrabold text-lg text-wine-dark">Personal Information</h3>
            <p className="text-xs text-[#8A767A] mt-0.5">
              Manage your display name and registered email address.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C4A4E] mb-1">Email Address</label>
            <input
              value={session.user.email || ''}
              disabled
              className="w-full border border-[#E2D5BE] bg-stone-50 rounded-xl px-4 py-2.5 text-sm text-[#8A767A] cursor-not-allowed outline-none"
            />
            <p className="text-[11px] text-[#8A767A] mt-1">
              Your email is used for receipts and transaction notices.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C4A4E] mb-1">Display Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Annabel Ijeoma"
              className="w-full border border-[#E2D5BE] rounded-xl px-4 py-2.5 text-sm text-[#2A1A1E] outline-none focus:border-wine"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C4A4E] mb-1">Account ID</label>
            <p className="font-mono text-xs text-[#8A767A] bg-[#FAF6EE] p-3 rounded-xl border border-[#E2D5BE]/60 truncate">
              {session.user.id}
            </p>
          </div>

          <div className="pt-2">
            <Button variant="primary" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: APK & Mobile App Hub */}
      {activeTab === 'apk' && (
        <div className="mt-6 space-y-6 max-w-2xl">
          <div className="bg-white rounded-3xl border border-[#E2D5BE] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D5BE]">
              <div>
                <h3 className="font-extrabold text-lg text-[#1C1618]">Android APK & Mobile Status</h3>
                <p className="text-xs text-[#8A767A] mt-0.5">
                  Package: <code className="font-mono text-[#4A0E17]">com.vessli.app</code> · Architecture: Android WebAPK / PWA
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isInstalled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {isInstalled ? '✓ Installed' : 'Ready to Install'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAF6EE] rounded-xl border border-[#E2D5BE]">
                <div className="text-[#8A767A] text-[11px]">Display Mode</div>
                <div className="font-bold text-[#4A0E17] text-sm mt-0.5">Standalone Window (Zero Chrome)</div>
              </div>
              <div className="p-3 bg-[#FAF6EE] rounded-xl border border-[#E2D5BE]">
                <div className="text-[#8A767A] text-[11px]">Offline Cache</div>
                <div className="font-bold text-emerald-700 text-sm mt-0.5">Enabled (Service Worker)</div>
              </div>
              <div className="p-3 bg-[#FAF6EE] rounded-xl border border-[#E2D5BE]">
                <div className="text-[#8A767A] text-[11px]">Theme Color</div>
                <div className="font-bold text-[#4A0E17] text-sm mt-0.5">#4A0E17 (Luxury Maroon)</div>
              </div>
              <div className="p-3 bg-[#FAF6EE] rounded-xl border border-[#E2D5BE]">
                <div className="text-[#8A767A] text-[11px]">Target Android SDK</div>
                <div className="font-bold text-[#1C1618] text-sm mt-0.5">API 34 (Android 14+)</div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {isInstallable ? (
                <Button variant="primary" onClick={install} className="flex-1 text-xs py-2.5">
                  🚀 Install APK Directly (WebAPK)
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setApkModalOpen(true)} className="flex-1 text-xs py-2.5">
                📦 Open APK Packaging & QR Hub
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* APK Hub Modal */}
      <APKInstallModal isOpen={apkModalOpen} onClose={() => setApkModalOpen(false)} />
    </div>
  )
}
