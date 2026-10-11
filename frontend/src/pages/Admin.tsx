import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useRole } from '../lib/roles'
import { Button, StatusBadge, NoticeBanner } from '../components/ui'
import { FALLBACK_PRODUCTS } from '../lib/products'
import { requestAIAuditListing, type ListingAudit } from '../lib/aiClient'

type ProductItem = {
  id: string
  title: string
  description?: string
  seller_id: string
  category?: string
  price_kobo: number
  currency?: string
  status: string
  rejection_reason?: string | null
  created_at?: string
  seller_name?: string
}

type OrderRecord = {
  id: string
  buyer_id: string
  total_kobo: number
  status: string
  created_at?: string
}

type CommissionRecord = {
  order_id: string
  seller_id: string
  gross_kobo: number
  commission_kobo: number
  seller_net_kobo: number
  status: string
  created_at?: string
}

const COMMON_REJECTION_REASONS = [
  'Incomplete digital file bundle or corrupt archive.',
  'Cover image does not meet resolution or clarity standards.',
  'Prohibited content or service violates Vessli terms.',
  'Misleading pricing or title description.',
]

export default function Admin() {
  const { session, loading: authLoading } = useAuth()
  const { hasAdminAccess } = useRole()
  const [activeTab, setActiveTab] = useState<'moderation' | 'active' | 'financials'>('moderation')

  const [pendingProducts, setPendingProducts] = useState<ProductItem[]>([])
  const [approvedProducts, setApprovedProducts] = useState<ProductItem[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [ledger, setLedger] = useState<CommissionRecord[]>([])

  // Moderation state
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState(COMMON_REJECTION_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [acting, setActing] = useState(false)
  const [msg, setMsg] = useState<{ type: 'info' | 'success' | 'warning' | 'error'; text: string } | null>(null)

  // AI Trust & Audit state
  const [aiAuditingId, setAiAuditingId] = useState<string | null>(null)
  const [aiAuditResults, setAiAuditResults] = useState<Record<string, ListingAudit>>({})

  async function runAiAudit(p: ProductItem) {
    setAiAuditingId(p.id)
    try {
      const res = await requestAIAuditListing({
        title: p.title,
        description: p.description || '',
        category: p.category || 'Templates',
        price: `₦${(p.price_kobo / 100).toLocaleString()}`,
      })
      setAiAuditResults((prev) => ({ ...prev, [p.id]: res }))
      setMsg({ type: 'info', text: `AI Trust Audit complete for "${p.title}" (Score: ${res.quality_score}/100)` })
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'AI audit failed' })
    } finally {
      setAiAuditingId(null)
    }
  }

  useEffect(() => {
    if (!hasAdminAccess) return

    loadAllData()
  }, [hasAdminAccess, session])

  async function loadAllData() {
    // 1. Load pending products
    try {
      const { data: pending } = await supabase
        .from('products')
        .select('id, title, description, category, price_kobo, seller_id, status, rejection_reason, created_at')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false })

      if (pending && pending.length > 0) {
        setPendingProducts(pending)
      } else {
        // Default pending item for demonstration
        setPendingProducts([
          {
            id: 'prod-pending-demo',
            title: 'Freelance Client Retainer & SOW Agreement Template',
            description: 'Comprehensive legal contract agreements, statement of work templates, and client onboarding forms formatted for Google Docs and Microsoft Word.',
            category: 'Templates',
            price_kobo: 600000,
            seller_id: 'seller-annabel',
            seller_name: 'Annabel Studio',
            status: 'pending_review',
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch {
      // In preview
    }

    // 2. Load approved products
    try {
      const { data: approved } = await supabase
        .from('products')
        .select('id, title, description, category, price_kobo, seller_id, status, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (approved && approved.length > 0) {
        setApprovedProducts(approved)
      } else {
        setApprovedProducts(
          FALLBACK_PRODUCTS.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            seller_id: p.store,
            category: p.category,
            price_kobo: p.price_kobo,
            status: 'approved',
            created_at: new Date().toISOString(),
          }))
        )
      }
    } catch {
      // Handled in preview
    }

    // 3. Load orders & commission ledger
    try {
      const { data: ords } = await supabase
        .from('orders')
        .select('id, buyer_id, total_kobo, status, created_at')
        .order('created_at', { ascending: false })

      if (ords && ords.length > 0) {
        setOrders(ords)
      } else {
        setOrders([
          { id: 'ord-vessli-001', buyer_id: 'usr-buyer-demo', total_kobo: 1000000, status: 'paid', created_at: new Date().toISOString() },
          { id: 'ord-vessli-002', buyer_id: 'usr-buyer-demo', total_kobo: 500000, status: 'paid', created_at: new Date(Date.now() - 86400000).toISOString() },
        ])
      }

      const { data: ledg } = await supabase
        .from('commission_ledger')
        .select('order_id, seller_id, gross_kobo, commission_kobo, seller_net_kobo, status, created_at')
        .order('created_at', { ascending: false })

      if (ledg && ledg.length > 0) {
        setLedger(ledg)
      } else {
        setLedger([
          {
            order_id: 'ord-vessli-001',
            seller_id: 'seller-annabel',
            gross_kobo: 1000000,
            commission_kobo: 100000,
            seller_net_kobo: 900000,
            status: 'recorded',
            created_at: new Date().toISOString(),
          },
          {
            order_id: 'ord-vessli-002',
            seller_id: 'seller-annabel',
            gross_kobo: 500000,
            commission_kobo: 50000,
            seller_net_kobo: 450000,
            status: 'recorded',
            created_at: new Date(Date.now() - 172800000).toISOString(),
          },
        ])
      }
    } catch {
      // In preview
    }
  }

  async function handleApprove(id: string) {
    setActing(true)
    setMsg({ type: 'info', text: 'Approving product...' })

    try {
      const patch = {
        status: 'approved',
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      }
      const { error } = await supabase.from('products').update(patch).eq('id', id)
      if (error) throw error

      setMsg({ type: 'success', text: `Product approved! Visible in the public catalog.` })
      loadAllData()
    } catch (err: unknown) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Approval failed. Admin privileges required.',
      })
    } finally {
      setActing(false)
    }
  }

  async function handleReject(id: string) {
    setActing(true)
    const finalReason = customReason.trim() || rejectionReason
    setMsg({ type: 'info', text: 'Recording rejection...' })

    try {
      const patch = {
        status: 'rejected',
        rejection_reason: finalReason,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('products').update(patch).eq('id', id)
      if (error) throw error

      setMsg({ type: 'warning', text: 'Listing rejected. Rejection notice saved.' })
      setRejectingId(null)
      loadAllData()
    } catch (err: unknown) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Rejection update failed.',
      })
    } finally {
      setActing(false)
    }
  }

  async function handleDeactivate(id: string) {
    setActing(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error

      setMsg({ type: 'info', text: 'Product deactivated and archived from the public catalog.' })
      loadAllData()
    } catch (err: unknown) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Deactivation failed.',
      })
    } finally {
      setActing(false)
    }
  }

  if (authLoading) {
    return <div className="max-w-4xl mx-auto p-12 text-center text-[#8A767A]">Verifying platform credentials...</div>
  }

  // Strict check 1: Unauthenticated visitors are blocked completely
  if (!session) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#E2D5BE] text-center shadow-xs">
        <span className="text-4xl block mb-2" aria-hidden="true">🔒</span>
        <h2 className="text-2xl font-black text-[#1C1618] mt-1">Platform Manager Sign In Required</h2>
        <p className="text-xs text-[#5C4A4E] mt-3 leading-relaxed">
          The Manager Dashboard is a private operational console reserved exclusively for the Vessli platform administrator. Public access is strictly forbidden.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link to="/login">
            <Button variant="primary" className="w-full text-xs">
              Sign In to Continue
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

  // Strict check 2: Logged in non-admins are blocked completely
  if (!hasAdminAccess) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 text-center shadow-xs">
        <span className="text-4xl block mb-2" aria-hidden="true">🚫</span>
        <h2 className="text-2xl font-black text-rose-900 mt-1">403 Forbidden: Access Denied</h2>
        <p className="text-xs text-[#5C4A4E] mt-3 leading-relaxed">
          Your signed-in account (<strong className="text-[#1C1618]">{session.user.email}</strong>) does not have manager privileges. This backend console is restricted exclusively to the platform administrator alone.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link to="/">
            <Button variant="primary" className="w-full text-xs">
              Return to Discover
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Financial totals
  const totalVolumeKobo = ledger.reduce((acc, curr) => acc + curr.gross_kobo, 0)
  const totalFeeKobo = ledger.reduce((acc, curr) => acc + curr.commission_kobo, 0)
  const totalCreatorNetKobo = ledger.reduce((acc, curr) => acc + curr.seller_net_kobo, 0)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2D5BE]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-[#1C1618] tracking-tight">App Manager Console</h1>
            <span className="text-xs font-bold text-[#4A0E17] bg-[#FAF2E8] border border-[#E2D5BE] px-2.5 py-0.5 rounded-full">
              Platform Admin
            </span>
          </div>
          <p className="text-xs text-[#5C4A4E] mt-1">
            Enforced server-side via PostgreSQL RLS and security-definer triggers.
          </p>
        </div>

        <Link
          to="/"
          className="text-xs font-bold text-[#5C4A4E] hover:text-[#4A0E17] border border-[#E2D5BE] bg-white rounded-full px-4 py-2 self-start sm:self-auto cursor-pointer"
        >
          View Storefront →
        </Link>
      </div>

      {msg && (
        <NoticeBanner type={msg.type} onDismiss={() => setMsg(null)}>
          {msg.text}
        </NoticeBanner>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#E2D5BE] mt-6">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'moderation'
              ? 'border-[#4A0E17] text-[#4A0E17]'
              : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
          }`}
        >
          <span>Pending Review</span>
          <span className="text-xs bg-[#FAF2E8] text-[#4A0E17] font-bold px-2 py-0.5 rounded-full tabular-nums">
            {pendingProducts.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'active'
              ? 'border-[#4A0E17] text-[#4A0E17]'
              : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
          }`}
        >
          <span>Active Catalogue</span>
          <span className="text-xs bg-[#EBF3E8] text-[#1D3E21] font-bold px-2 py-0.5 rounded-full tabular-nums">
            {approvedProducts.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('financials')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'financials'
              ? 'border-[#4A0E17] text-[#4A0E17]'
              : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
          }`}
        >
          Financial Audit & Ledger (10% Fee)
        </button>
      </div>

      {/* TAB 1: Product Moderation */}
      {activeTab === 'moderation' && (
        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2D5BE] divide-y divide-[#E2D5BE] shadow-xs overflow-hidden">
            {pendingProducts.map((p) => (
              <div key={p.id} className="p-6 space-y-4 hover:bg-[#FAF6EE]/30 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-[#1C1618]">{p.title}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#8A767A] mt-1">
                      <span>Category: <strong className="text-[#5C4A4E]">{p.category || 'General'}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>Creator: <strong className="text-[#5C4A4E]">{p.seller_name || p.seller_id.slice(0, 8)}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span className="font-extrabold text-[#4A0E17] tabular-nums">
                        ₦{(p.price_kobo / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      disabled={aiAuditingId === p.id}
                      onClick={() => runAiAudit(p)}
                      className="text-xs py-2 px-3 bg-[#FAF7F2] border border-[#D9D0C3] hover:border-[#4A0E17] text-[#4A0E17] font-bold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <span className="w-2 h-2 bg-[#D4AF37] inline-block"></span>
                      {aiAuditingId === p.id ? 'Scanning...' : 'AI Trust Scan'}
                    </button>
                    <Button
                      variant="primary"
                      disabled={acting}
                      onClick={() => handleApprove(p.id)}
                      className="text-xs py-2 px-5 font-bold"
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      variant="outline"
                      disabled={acting}
                      onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)}
                      className="text-xs py-2 px-4"
                    >
                      Reject...
                    </Button>
                  </div>
                </div>

                {/* AI Trust & Quality Audit Card */}
                {aiAuditResults[p.id] && (
                  <div className="p-4 bg-[#FAF7F2] border border-[#D9D0C3] text-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#4A0E17] uppercase tracking-wider text-[11px]">
                          AI Quality Score:
                        </span>
                        <span className="font-serif font-bold text-sm text-[#4A0E17]">
                          {aiAuditResults[p.id].quality_score}/100
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase">
                          {aiAuditResults[p.id].verdict}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-stone-700">
                        Copyright Risk: <strong className="uppercase">{aiAuditResults[p.id].copyright_risk}</strong>
                      </span>
                    </div>
                    <p className="text-stone-700">{aiAuditResults[p.id].pricing_analysis}</p>
                    {aiAuditResults[p.id].recommendations?.length > 0 && (
                      <p className="text-stone-700 text-[11px]">
                        <strong>Notes:</strong> {aiAuditResults[p.id].recommendations.join(' • ')}
                      </p>
                    )}
                  </div>
                )}

                {p.description && (
                  <p className="text-xs text-[#5C4A4E] bg-[#FAF6EE] p-3 rounded-xl border border-[#E2D5BE]/60 line-clamp-2">
                    {p.description}
                  </p>
                )}

                {/* Inline Rejection Drawer */}
                {rejectingId === p.id && (
                  <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3 animate-fade-in">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      Specify Rejection Reason (Creator will see this on their dashboard):
                    </h4>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full text-xs border border-[#E2D5BE] bg-white rounded-xl p-2.5 outline-none focus:border-[#4A0E17]"
                    >
                      {COMMON_REJECTION_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    <input
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Or enter a custom rejection reason..."
                      className="w-full text-xs border border-[#E2D5BE] bg-white rounded-xl px-3 py-2 outline-none focus:border-[#4A0E17]"
                    />

                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        disabled={acting}
                        onClick={() => handleReject(p.id)}
                        className="text-xs py-2 px-4 font-bold"
                      >
                        Confirm Rejection
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setRejectingId(null)}
                        className="text-xs py-2 px-4"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {pendingProducts.length === 0 && (
              <div className="p-12 text-center text-[#8A767A]">
                <p className="text-2xl mb-1">✓</p>
                <p className="font-bold text-base text-[#1C1618]">Moderation Queue Clear</p>
                <p className="text-xs mt-1">All creator submissions have been reviewed and approved.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Active Catalogue Management */}
      {activeTab === 'active' && (
        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E2D5BE] divide-y divide-[#E2D5BE] shadow-xs overflow-hidden">
            {approvedProducts.map((p) => (
              <div
                key={p.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF6EE]/30 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#1C1618]">{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8A767A] mt-1">
                    <span>Category: {p.category || 'General'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold text-[#4A0E17] tabular-nums">
                      ₦{(p.price_kobo / 100).toLocaleString()}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>ID: {p.id.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link to={`/product/${p.id}`}>
                    <Button variant="secondary" className="text-xs py-1.5 px-3">
                      View Live Listing
                    </Button>
                  </Link>
                  <button
                    disabled={acting}
                    onClick={() => handleDeactivate(p.id)}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-900 border border-rose-200 rounded-full px-3 py-1.5 transition cursor-pointer"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}

            {approvedProducts.length === 0 && (
              <div className="p-12 text-center text-[#8A767A]">
                No active approved products currently in the catalogue.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Financial Audit & Ledger */}
      {activeTab === 'financials' && (
        <div className="mt-6 space-y-6">
          {/* Revenue Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#E2D5BE] p-5 shadow-xs">
              <p className="text-xs font-bold text-[#8A767A] uppercase tracking-wider">Gross GMV</p>
              <p className="text-2xl font-black text-[#1C1618] mt-1 tabular-nums">
                ₦{(totalVolumeKobo / 100).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#8A767A] mt-1">Total customer checkout value</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2D5BE] p-5 shadow-xs">
              <p className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider">Platform Fee (10%)</p>
              <p className="text-2xl font-black text-[#4A0E17] mt-1 tabular-nums">
                ₦{(totalFeeKobo / 100).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#8A767A] mt-1">Marketplace revenue retained</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2D5BE] p-5 shadow-xs">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Creator Net (90%)</p>
              <p className="text-2xl font-black text-[#1C1618] mt-1 tabular-nums">
                ₦{(totalCreatorNetKobo / 100).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#8A767A] mt-1">Recorded seller entitlement</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2D5BE] p-5 shadow-xs">
              <p className="text-xs font-bold text-[#8A767A] uppercase tracking-wider">Total Orders</p>
              <p className="text-2xl font-black text-[#1C1618] mt-1 tabular-nums">{orders.length}</p>
              <p className="text-[11px] text-[#8A767A] mt-1">{ledger.length} verified in ledger</p>
            </div>
          </div>

          {/* Audit Ledger Table */}
          <div className="bg-white rounded-2xl border border-[#E2D5BE] overflow-hidden shadow-xs">
            <div className="p-5 border-b border-[#E2D5BE]">
              <h3 className="font-extrabold text-base text-[#1C1618]">
                Marketplace Commission Audit Ledger
              </h3>
              <p className="text-xs text-[#8A767A] mt-0.5">
                Every verified Paystack order generates exactly one immutable commission row enforcing the 10% platform fee.
              </p>
            </div>

            <div className="divide-y divide-[#E2D5BE]">
              {ledger.map((row, index) => (
                <div
                  key={row.order_id || index}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-sm text-[#1C1618]">Order #{row.order_id}</p>
                    <p className="text-[#8A767A] mt-0.5">
                      Seller ID: {row.seller_id.slice(0, 12)} · Date:{' '}
                      {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[#8A767A]">Gross:</span>{' '}
                      <span className="font-bold text-[#1C1618] tabular-nums">
                        ₦{(row.gross_kobo / 100).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8A767A]">10% Fee:</span>{' '}
                      <span className="font-bold text-[#4A0E17] tabular-nums">
                        ₦{(row.commission_kobo / 100).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8A767A]">90% Net:</span>{' '}
                      <span className="font-extrabold text-emerald-800 text-sm tabular-nums">
                        ₦{(row.seller_net_kobo / 100).toLocaleString()}
                      </span>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                </div>
              ))}

              {ledger.length === 0 && (
                <div className="p-8 text-center text-xs text-[#8A767A]">
                  No financial ledger records recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
