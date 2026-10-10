import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { Button, ProductCard } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import { supabase } from './lib/supabase'
import Admin from './pages/Admin'
import Auth from './pages/Auth'
import Seller from './pages/Seller'

function Nav() {
  const { session } = useAuth()
  return (
    <nav className="bg-[#FAF6EE]/90 backdrop-blur border-b border-[#E2D5BE] px-6 py-4 flex items-center gap-6 sticky top-0 z-10">
      <Link to="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-wine-dark"> <span className="w-8 h-8 rounded-lg bg-wine text-[#FAF6EE] flex items-center justify-center">V</span>Vessli<span className="text-gold">.</span></Link>
      <div className="hidden sm:flex gap-5 text-sm font-medium text-[#5C4A4E]">
        <Link to="/">Discover</Link>
        <Link to="/account">Orders</Link>
        <Link to="/seller">Sell</Link>
        <Link to="/admin">Admin</Link>
      </div>
      {session ? (
        <button onClick={() => supabase.auth.signOut()} className="ml-auto text-sm font-semibold text-wine">Log out</button>
      ) : (
        <Link to="/login" className="ml-auto"><Button>Login</Button></Link>
      )}
    </nav>
  )
}

const DEMO = [
  { title: 'Ultimate Ebook Bundle', price: '₦10,000', store: 'Annabel Studio', status: 'approved' },
  { title: 'Notion Planner System', price: '₦5,000', store: 'Vessli Creators', status: 'approved' },
  { title: 'Canva Wedding Pack', price: '₦7,500', store: 'Design Hub', status: 'pending_review' },
]
void DEMO

function Home() {
  const [q, setQ] = useState('')
  const [live, setLive] = useState<{ title: string; price: string; store?: string; status: string }[]>([])
  useEffect(() => {
    supabase.from('products').select('title,price_kobo,status').eq('status', 'approved').order('created_at', { ascending: false }).limit(12)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLive(data.map((d) => ({ title: d.title, price: `₦${(d.price_kobo / 100).toLocaleString()}`, status: d.status })))
        }
      })
  }, [])
  const fallback = [
    { title: 'Ultimate Ebook Bundle', price: '₦10,000', store: 'Annabel Studio', status: 'approved' },
    { title: 'Notion Planner System', price: '₦5,000', store: 'Vessli Creators', status: 'approved' },
  ]
  const list = live.length > 0 ? live : fallback
  const items = list.filter((d) => d.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="py-12 text-center">
        <p className="inline-block text-xs font-bold tracking-widest text-wine bg-wine-soft px-4 py-1.5 rounded-full">✨ NEW — CREATORS KEEP MORE WITH 10% FLAT FEE</p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-[#2A1A1E]">Discover digital products<br />worth <span className="text-wine underline decoration-gold decoration-4 underline-offset-4">paying for</span>.</h1>
        <p className="text-[#5C4A4E] mt-3">Ebooks, templates, planners, design assets — from trusted creators.</p>
        <div className="mt-6 max-w-md mx-auto flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ebooks, planners..." className="flex-1 border border-[#E2D5BE] bg-white rounded-full px-5 py-3 outline-none focus:border-wine" />
          <Button>Search</Button>
        </div>
      </div>
      <div className="pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p) => <ProductCard key={p.title} {...p} />)}
      </div>
      {items.length === 0 && <p className="text-center text-ink-500 pb-16">No products found for “{q}”.</p>}
    </div>
  )
}

function Shell() {
  const loc = useLocation()
  const bare = loc.pathname === '/login'
  if (bare) {
    return (
      <Routes>
        <Route path="/login" element={<Auth />} />
      </Routes>
    )
  }
  return (
    <div className="min-h-screen bg-sand-50">
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<div className="p-8 text-center">Product page — Phase 5</div>} />
        <Route path="/account" element={<div className="p-8 text-center">My orders + downloads — Phase 7</div>} />
        <Route path="/seller" element={<Seller />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Auth />} />
      </Routes>
      <footer className="text-center text-sm text-[#8A767A] py-8">Vessli <span className="text-gold-dark">©</span> 2026 — <span className="text-wine font-semibold">10% commission</span>, secure Paystack checkout</footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  )
}
