import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { ProductCard } from './components/ui'

function Nav() {
  return (
    <nav className="bg-white border-b px-4 py-3 flex gap-4">
      <Link to="/" className="font-bold">Vessli</Link>
      <Link to="/account">Orders</Link>
      <Link to="/seller">Seller</Link>
      <Link to="/admin">Admin</Link>
      <Link to="/login" className="ml-auto">Login</Link>
    </nav>
  )
}

function Home() {
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProductCard title="Sample Ebook" price="₦10,000" status="approved" />
      <ProductCard title="Planner Template" price="₦5,000" status="approved" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<div className="p-4">Product page - to build in Phase 5</div>} />
        <Route path="/account" element={<div className="p-4">My orders + downloads - Phase 7</div>} />
        <Route path="/seller" element={<div className="p-4">Seller dashboard - Phase 4</div>} />
        <Route path="/admin" element={<div className="p-4">Admin moderation - Phase 8</div>} />
        <Route path="/login" element={<div className="p-4">Login - Phase 3</div>} />
      </Routes>
    </BrowserRouter>
  )
}
