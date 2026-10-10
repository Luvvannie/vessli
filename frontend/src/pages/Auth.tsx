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
    <div className="min-h-screen bg-[#5B52FF] text-white">
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-10">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-2xl">
          <span className="w-8 h-8 rounded-full bg-white text-[#5B52FF] flex items-center justify-center font-black">$</span>
          Vessli
        </Link>
        <div className="hidden md:flex gap-10 font-semibold text-white/90">
          <Link to="/">Home</Link>
          <span className="text-white/50">Our Mission</span>
          <span className="text-white/50">Blog</span>
        </div>
        <div className="ml-auto flex items-center gap-6 font-semibold">
          <button onClick={() => setMode('login')}>Log in</button>
          <button onClick={() => setMode('signup')} className="bg-white text-[#1A1363] px-6 py-2.5 rounded-xl">Sign Up</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 items-center pb-20">
        <div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.02] tracking-tight">
            Meet Your<br />All-in-One<br />Creator Store
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-md">
            Vessli is the <em>easiest</em> way to make money online. All of your ebooks, templates and downloads are now hosted in one shop.
          </p>

          <form onSubmit={submit} className="mt-8 max-w-md bg-white/10 rounded-2xl p-5 backdrop-blur">
            <div className="flex gap-2 mb-4 text-sm font-bold">
              <button type="button" onClick={() => setMode('signup')} className={mode === 'signup' ? 'bg-white text-[#1A1363] px-4 py-2 rounded-full' : 'px-4 py-2'}>Sign Up</button>
              <button type="button" onClick={() => setMode('login')} className={mode === 'login' ? 'bg-white text-[#1A1363] px-4 py-2 rounded-full' : 'px-4 py-2'}>Log in</button>
            </div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email address" className="w-full mb-3 rounded-xl px-4 py-3 text-slate-900 outline-none" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="Password" className="w-full rounded-xl px-4 py-3 text-slate-900 outline-none" />
            <button className="mt-4 w-full bg-[#3DFFA2] text-[#14213D] font-extrabold text-lg rounded-full py-4 flex items-center justify-center gap-2">
              Continue <span>→</span>
            </button>
            {msg && <p className="mt-3 text-sm text-white/90">{msg}</p>}
          </form>
        </div>

        <div className="relative hidden lg:block h-[560px]">
          <div className="absolute right-10 top-0 w-72 rotate-3 bg-[#E8E6DF] text-slate-900 rounded-3xl p-4 shadow-2xl">
            <p className="font-serif text-xl text-center">Alexandra Silva</p>
            <div className="mt-2 h-56 rounded-2xl bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center text-6xl">👩🏻</div>
          </div>
          <div className="absolute left-10 top-64 w-80 -rotate-2 bg-white text-slate-900 rounded-2xl p-4 shadow-2xl">
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-amber-400" />
              <div>
                <p className="font-bold text-sm">My Creator Course</p>
                <p className="text-xs text-slate-500">Everything you need to start selling online!</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm font-bold">
              <span>$129</span><span className="line-through text-slate-400">$248</span>
              <span className="bg-amber-300 text-xs px-2 py-0.5 rounded">★ 4.7</span>
              <span className="bg-rose-200 text-xs px-2 py-0.5 rounded">50% OFF</span>
            </div>
            <div className="mt-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-xl py-2.5 px-4 text-sm font-semibold flex justify-between">Get Started <span>→</span></div>
          </div>
          <div className="absolute left-16 top-[430px] w-72 bg-[#FFF8E7] text-slate-900 rounded-2xl p-3 shadow-xl text-sm font-semibold">📅 1:1 Coaching Session<br />$49</div>
          <div className="absolute left-20 top-[500px] w-72 bg-white text-slate-900 rounded-2xl p-3 shadow-xl text-sm font-semibold">📕 Download My Guide<br />$25</div>
          <div className="absolute left-0 top-72 w-28 h-28 rounded-full border-2 border-white/40 flex flex-col items-center justify-center text-xs font-bold">🗓️<br />CALENDAR</div>
          <div className="absolute right-0 top-72 w-32 h-32 rounded-full bg-[#8B85FF] border-2 border-white/40 flex flex-col items-center justify-center text-xs font-bold">🎓<br />COURSES</div>
          <div className="absolute left-4 bottom-0 w-28 h-28 rounded-full border-2 border-white/40 flex flex-col items-center justify-center text-xs font-bold">⬇️<br />DOWNLOADS</div>
        </div>
      </div>
    </div>
  )
}
