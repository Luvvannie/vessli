import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('Working...')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg('Check your email to verify your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMsg('Logged in! Redirecting to shop...')
        window.location.href = '/'
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Something went wrong. Connect Supabase keys first.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#2A1A1E]">
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-2xl text-[#7A1E2E]">
          <span className="w-9 h-9 rounded-xl bg-[#7A1E2E] text-[#FAF6EE] flex items-center justify-center font-black">V</span>
          Vessli
        </Link>
        <div className="ml-auto flex items-center gap-6 font-semibold">
          <button onClick={() => setMode('login')} className="text-[#7A1E2E]">Log in</button>
          <button onClick={() => setMode('signup')} className="bg-[#7A1E2E] text-[#FAF6EE] px-6 py-2.5 rounded-xl">Sign Up</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center pb-20">
        <div>
          <p className="text-sm font-bold tracking-widest text-[#7A1E2E]/70">DIGITAL MARKETPLACE FOR CREATORS</p>
          <h1 className="mt-3 text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-[#5A1421]">
            Sell your work.<br />Keep your shine.
          </h1>
          <p className="mt-5 text-lg text-[#5C4A4E] max-w-md">
            Vessli gives creators a calm, trusted shop for ebooks, templates and guides — upload once, get paid securely.
          </p>

          <form onSubmit={submit} className="mt-8 max-w-md bg-white rounded-2xl p-5 shadow-sm border border-[#E2D5BE]">
            <div className="flex gap-2 mb-4 text-sm font-bold">
              <button type="button" onClick={() => setMode('signup')} className={mode === 'signup' ? 'bg-[#7A1E2E] text-[#FAF6EE] px-4 py-2 rounded-full' : 'px-4 py-2 text-[#7A1E2E]'}>Sign Up</button>
              <button type="button" onClick={() => setMode('login')} className={mode === 'login' ? 'bg-[#7A1E2E] text-[#FAF6EE] px-4 py-2 rounded-full' : 'px-4 py-2 text-[#7A1E2E]'}>Log in</button>
            </div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email address" className="w-full mb-3 rounded-xl px-4 py-3 text-slate-900 outline-none border border-[#E2D5BE] focus:border-[#7A1E2E]" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="Password" className="w-full rounded-xl px-4 py-3 text-slate-900 outline-none border border-[#E2D5BE] focus:border-[#7A1E2E]" />
            <button className="mt-4 w-full bg-[#7A1E2E] hover:bg-[#5A1421] text-[#FAF6EE] font-extrabold text-lg rounded-full py-4 flex items-center justify-center gap-2">
              Continue <span>→</span>
            </button>
            {msg && <p className="mt-3 text-sm text-[#5C4A4E]">{msg}</p>}
          </form>
        </div>

        <div className="relative hidden lg:block h-[560px]">
          <div className="absolute right-10 top-0 w-72 rotate-3 bg-[#7A1E2E] text-[#FAF6EE] rounded-3xl p-4 shadow-2xl">
            <p className="font-serif text-xl text-center">Creator Storefront</p>
            <div className="mt-2 h-56 rounded-2xl bg-[#5A1421] flex items-center justify-center text-6xl">📚</div>
          </div>
          <div className="absolute left-10 top-64 w-80 -rotate-2 bg-white rounded-2xl p-4 shadow-2xl border border-[#E2D5BE]">
            <p className="font-bold text-sm">Ultimate Ebook Bundle</p>
            <p className="text-xs text-[#8A767A]">Ebooks, templates & planners in one shop</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-bold">
              <span>₦10,000</span>
              <span className="bg-[#F1E9D9] text-[#7A1E2E] text-xs px-2 py-0.5 rounded">Bestseller</span>
            </div>
            <div className="mt-3 bg-[#7A1E2E] text-[#FAF6EE] rounded-xl py-2.5 px-4 text-sm font-semibold flex justify-between">Buy now <span>→</span></div>
          </div>
          <div className="absolute left-16 top-[430px] w-72 bg-white rounded-2xl p-3 shadow-xl text-sm font-semibold border border-[#E2D5BE]">📅 Planner Template — ₦5,000</div>
          <div className="absolute left-20 top-[500px] w-72 bg-white rounded-2xl p-3 shadow-xl text-sm font-semibold border border-[#E2D5BE]">📕 Design Guide — ₦7,500</div>
          <div className="absolute left-0 top-72 w-28 h-28 rounded-full bg-[#7A1E2E] text-[#FAF6EE] flex flex-col items-center justify-center text-xs font-bold">✓<br />SECURE</div>
          <div className="absolute right-0 top-72 w-32 h-32 rounded-full bg-[#F1E9D9] text-[#7A1E2E] border-2 border-[#7A1E2E]/20 flex flex-col items-center justify-center text-xs font-bold">★<br />TRUSTED</div>
          <div className="absolute left-4 bottom-0 w-28 h-28 rounded-full bg-white border border-[#E2D5BE] text-[#7A1E2E] flex flex-col items-center justify-center text-xs font-bold">⬇<br />INSTANT</div>
        </div>
      </div>
    </div>
  )
}
