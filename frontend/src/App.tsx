import { useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Button, ProductCard } from './components/ui'
import Admin from './pages/Admin'

function Nav() {
  return (
    <nav className="bg-white/90 backdrop-blur border-b border-stone-100 px-6 py-4 flex items-center gap-6 sticky top-0 z-10">
      <Link to="/" className="font-extrabold text-xl tracking-tight">Vessli<span className="text-accent">.</span></Link>
      <div className="hidden sm:flex gap-5 text-sm font-medium text-ink-700">
        <Link to="/">Discover</Link>
        <Link to="/account">Orders</Link>
        <Link to="/seller">Sell</Link>
        <Link to="/admin">Admin</Link>
      </div>
      <Link to="/login" className="ml-auto"><Button>Login</Button></Link>
    </nav>
  )
}

const DEMO = [
  { title: 'Ultimate Ebook Bundle', price: '₦10,000', store: 'Annabel Studio', status: 'approved' },
  { title: 'Notion Planner System', price: '₦5,000', store: 'Vessli Creators', status: 'approved' },
  { title: 'Canva Wedding Pack', price: '₦7,500', store: 'Design Hub', status: 'pending_review' },
]

function Home() {
  const [q, setQ] = useState('')
  const items = DEMO.filter((d) => d.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="py-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Discover digital products<br />worth paying for.</h1>
        <p className="text-ink-500 mt-3">Ebooks, templates, planners, design assets — from trusted creators.</p>
        <div className="mt-6 max-w-md mx-auto flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ebooks, planners..." className="flex-1 border border-stone-200 rounded-full px-5 py-3 outline-none focus:border-accent" />
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-sand-50">
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<div className="p-8 text-center">Product page — Phase 5</div>} />
          <Route path="/account" element={<div className="p-8 text-center">My orders + downloads — Phase 7</div>} />
          <Route path="/seller" element={<div className="p-8 text-center">Seller dashboard — Phase 4</div>} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<div className="p-8 text-center">Login — Phase 3</div>} />
        </Routes>
        <footer className="text-center text-sm text-ink-500 py-8">Vessli © 2026 — 10% commission, secure Paystack checkout</footer>
      </div>
    </BrowserRouter>
  )
}
