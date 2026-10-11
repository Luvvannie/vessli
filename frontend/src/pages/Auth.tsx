import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signup' | 'login'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('Authenticating...')
    try {
      if (mode === 'signup') {
        // Try server-assisted signup first to auto-confirm user without SMTP restrictions
        let signedUp = false
        try {
          const apiRes = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password }),
          })
          if (apiRes.ok) {
            signedUp = true
          }
        } catch {
          // Continue to client signup fallback
        }

        if (!signedUp) {
          const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
          })
          if (error && !error.message.toLowerCase().includes('already')) {
            throw error
          }
        }

        // Auto sign-in immediately after account creation
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (loginError) {
          setMsg('Account created! Please sign in with your email and password.')
          setMode('login')
          return
        }

        setMsg('Account created! Welcome to Vessli...')
        setTimeout(() => navigate('/'), 500)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) {
          throw new Error(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message)
        }
        setMsg('Logged in successfully! Redirecting...')
        setTimeout(() => navigate('/'), 500)
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.')
    } finally {
      setBusy(false)
    }
  }

  async function handleQuickLogin(accountEmail: string, pass: string, label: string) {
    setBusy(true)
    setMsg(`Logging in as ${label}...`)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: accountEmail,
        password: pass,
      })
      if (error) throw error
      setMsg(`Logged in as ${label}! Redirecting...`)
      setTimeout(() => navigate('/'), 400)
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Quick login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#2A1A1E]">
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-2xl text-[#7A1E2E]">
          <span className="w-9 h-9 rounded-xl bg-[#7A1E2E] text-[#FAF6EE] flex items-center justify-center font-black">
            V
          </span>
          Vessli
        </Link>
        <div className="ml-auto flex items-center gap-6 font-semibold">
          <button
            onClick={() => {
              setMode('login')
              setMsg('')
            }}
            className={`transition ${mode === 'login' ? 'text-[#7A1E2E] font-bold' : 'text-[#5C4A4E]'}`}
          >
            Log in
          </button>
          <button
            onClick={() => {
              setMode('signup')
              setMsg('')
            }}
            className="bg-[#7A1E2E] hover:bg-[#5A1421] text-[#FAF6EE] px-6 py-2.5 rounded-xl transition"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center pb-20">
        <div>
          <p className="inline-block text-xs font-bold tracking-widest text-wine-dark bg-gold-soft border border-gold/30 px-4 py-1.5 rounded-full">
            ✨ DIGITAL MARKETPLACE FOR CREATORS
          </p>
          <h1 className="mt-3 text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-[#5A1421]">
            Sell your work.<br />
            Keep your <span className="underline decoration-gold decoration-4 underline-offset-4">shine</span>.
          </h1>
          <p className="mt-5 text-lg text-[#5C4A4E] max-w-md">
            Vessli gives creators a calm, trusted shop for ebooks, templates, and guides — upload once, get paid securely.
          </p>

          <form onSubmit={submit} className="mt-8 max-w-md bg-white rounded-2xl p-6 shadow-sm border border-[#E2D5BE]">
            <div className="flex gap-2 mb-4 text-sm font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setMsg('')
                }}
                className={mode === 'signup' ? 'bg-[#7A1E2E] text-[#FAF6EE] px-4 py-2 rounded-full' : 'px-4 py-2 text-[#7A1E2E]'}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setMsg('')
                }}
                className={mode === 'login' ? 'bg-[#7A1E2E] text-[#FAF6EE] px-4 py-2 rounded-full' : 'px-4 py-2 text-[#7A1E2E]'}
              >
                Log in
              </button>
            </div>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="Email address"
              className="w-full mb-3 rounded-xl px-4 py-3 text-slate-900 outline-none border border-[#E2D5BE] focus:border-[#7A1E2E]"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              placeholder="Password"
              className="w-full rounded-xl px-4 py-3 text-slate-900 outline-none border border-[#E2D5BE] focus:border-[#7A1E2E]"
            />

            <button
              disabled={busy}
              className="mt-4 w-full bg-[#7A1E2E] hover:bg-[#5A1421] disabled:opacity-50 text-[#FAF6EE] font-extrabold text-lg rounded-full py-4 flex items-center justify-center gap-2 shadow-lg shadow-wine/20 transition cursor-pointer"
            >
              {busy ? 'Connecting...' : mode === 'signup' ? 'Create Account' : 'Continue'}{' '}
              <span className="text-gold">→</span>
            </button>

            {msg && (
              <p className={`mt-3 text-sm p-3 rounded-xl ${msg.includes('error') || msg.includes('failed') || msg.includes('Incorrect') ? 'bg-wine-soft text-wine-dark' : 'bg-[#FAF6EE] text-[#5C4A4E] border border-[#E2D5BE]'}`}>
                {msg}
              </p>
            )}

            {/* Quick 1-Click Access for Testing */}
            <div className="mt-5 pt-4 border-t border-[#E2D5BE]">
              <p className="text-xs font-bold text-[#8A767A] uppercase tracking-wider mb-2">
                ⚡ 1-Click Quick Login:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('annabelijeoma18@gmail.com', 'password123', 'Annabel (Creator & Admin)')}
                  className="p-2.5 text-xs font-bold bg-[#FAF6EE] hover:bg-gold-soft border border-[#E2D5BE] rounded-xl text-[#2A1A1E] transition text-left"
                >
                  <p className="text-wine font-extrabold">🏪 Annabel Studio</p>
                  <p className="text-[10px] text-[#8A767A] font-normal truncate">annabelijeoma18@gmail.com</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('testuser@gmail.com', 'password123', 'Test Buyer')}
                  className="p-2.5 text-xs font-bold bg-[#FAF6EE] hover:bg-sage-soft border border-[#E2D5BE] rounded-xl text-[#2A1A1E] transition text-left"
                >
                  <p className="text-sage font-extrabold">🛍️ Test Buyer</p>
                  <p className="text-[10px] text-[#8A767A] font-normal truncate">testuser@gmail.com</p>
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-sage pt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sage" /> Secure checkout
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold" /> Instant download
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-wine" /> 10% flat fee
              </span>
            </div>
          </form>
        </div>

        <div className="relative hidden lg:block h-[560px]">
          <div className="absolute right-10 top-0 w-72 rotate-3 bg-[#7A1E2E] text-[#FAF6EE] rounded-3xl p-4 shadow-2xl border-t-4 border-gold">
            <p className="font-serif text-xl text-center">Creator Storefront</p>
            <div className="mt-2 h-56 rounded-2xl bg-[#5A1421] flex items-center justify-center text-6xl">📚</div>
            <p className="mt-2 text-center text-xs font-bold text-gold">★ TRUSTED SELLERS</p>
          </div>
          <div className="absolute left-10 top-64 w-80 -rotate-2 bg-white rounded-2xl p-4 shadow-2xl border border-[#E2D5BE]">
            <p className="font-bold text-sm">Ultimate Ebook Bundle</p>
            <p className="text-xs text-[#8A767A]">Ebooks, templates & planners in one shop</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-bold">
              <span>₦10,000</span>
              <span className="bg-[#F1E9D9] text-[#7A1E2E] text-xs px-2 py-0.5 rounded">Bestseller</span>
              <span className="bg-sage-soft text-sage text-xs px-2 py-0.5 rounded">Instant</span>
            </div>
            <div className="mt-3 bg-[#7A1E2E] text-[#FAF6EE] rounded-xl py-2.5 px-4 text-sm font-semibold flex justify-between">
              Buy now <span className="text-gold">→</span>
            </div>
          </div>
          <div className="absolute left-16 top-[430px] w-72 bg-white rounded-2xl p-3 shadow-xl text-sm font-semibold border border-[#E2D5BE]">
            📅 Planner Template — ₦5,000
          </div>
          <div className="absolute left-20 top-[500px] w-72 bg-white rounded-2xl p-3 shadow-xl text-sm font-semibold border border-[#E2D5BE]">
            📕 Design Guide — ₦7,500
          </div>
          <div className="absolute left-0 top-72 w-28 h-28 rounded-full bg-[#7A1E2E] text-[#FAF6EE] flex flex-col items-center justify-center text-xs font-bold">
            ✓<br />SECURE
          </div>
          <div className="absolute right-0 top-72 w-32 h-32 rounded-full bg-[#F1E9D9] text-[#7A1E2E] border-2 border-[#7A1E2E]/20 flex flex-col items-center justify-center text-xs font-bold">
            ★<br />TRUSTED
          </div>
          <div className="absolute left-4 bottom-0 w-28 h-28 rounded-full bg-white border border-[#E2D5BE] text-[#7A1E2E] flex flex-col items-center justify-center text-xs font-bold">
            ⬇<br />INSTANT
          </div>
        </div>
      </div>
    </div>
  )
}
