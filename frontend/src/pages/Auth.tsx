import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { signUpUser, loginUser, resetUserPassword, deleteUserAccount } from '../lib/authService'

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Two primary portal features requested by user: Buyer vs Creator
  const initialPortal = searchParams.get('portal') === 'creator' ? 'creator' : 'buyer'
  const [portal, setPortal] = useState<'buyer' | 'creator'>(initialPortal)
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')

  // Common credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  // Creator specific fields
  const [storeName, setStoreName] = useState('')
  const [storeBio, setStoreBio] = useState('')

  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'info' | 'success' | 'error'>('info')
  const [busy, setBusy] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Notification from email confirmation redirect
  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      setMsgType('success')
      setMsg('Email confirmed! You can now log in to your account.')
    }
  }, [searchParams])

  async function handleDeleteAccount() {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setMsgType('error')
      setMsg('Please enter the email address to delete from Supabase.')
      return
    }
    setBusy(true)
    setMsgType('info')
    setMsg('Removing account from Supabase...')
    try {
      const data = await deleteUserAccount(trimmedEmail)
      setMsgType('success')
      setMsg(`${data?.message || 'Account deleted'}. You can now sign up fresh!`)
      setShowDeleteConfirm(false)
      setMode('signup')
    } catch (err: unknown) {
      setMsgType('error')
      setMsg(err instanceof Error ? err.message : 'Failed to delete account.')
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsgType('info')
    setMsg('Authenticating...')

    const trimmedEmail = email.trim().toLowerCase()

    try {
      if (mode === 'reset') {
        setMsg('Updating password in Supabase...')
        await resetUserPassword(trimmedEmail, password, portal === 'creator' ? 'seller' : 'buyer', fullName)

        setMsgType('success')
        setMsg('Password updated! Signing you in...')
        setTimeout(() => {
          navigate(portal === 'creator' ? '/seller' : '/')
        }, 500)
        return
      }

      if (mode === 'signup') {
        const isCreator = portal === 'creator'
        if (isCreator && !storeName.trim()) {
          throw new Error('Please enter your creator store or brand name.')
        }

        setMsg('Creating your account in Supabase...')
        await signUpUser({
          email: trimmedEmail,
          password,
          fullName,
          role: isCreator ? 'seller' : 'buyer',
          storeName,
          bio: storeBio,
        })

        setMsgType('success')
        setMsg(
          isCreator
            ? 'Creator account created! Launching your Creator Studio...'
            : 'Buyer account created! Welcome to Vessli...'
        )
        setTimeout(() => {
          navigate(isCreator ? '/seller' : '/')
        }, 500)
        return
      } else {
        // Login Flow
        setMsg('Verifying credentials...')
        const loginData = await loginUser(trimmedEmail, password)

        const user = loginData.user
        const meta = user?.user_metadata || {}

        // Check if Annabel (admin) is logging in
        const isAdmin =
          trimmedEmail === 'annabelijeoma18@gmail.com' ||
          trimmedEmail === 'admin@vessli.shop' ||
          meta.role === 'admin' ||
          meta.is_admin === true

        // Route smoothly based on role and portal preference
        const isSeller =
          isAdmin ||
          meta.role === 'seller' ||
          meta.is_seller === true ||
          portal === 'creator'

        setMsgType('success')
        setMsg(
          isSeller && portal === 'creator'
            ? 'Welcome to Creator Studio! Redirecting...'
            : 'Welcome back to Vessli! Redirecting...'
        )

        setTimeout(() => {
          if (portal === 'creator' || (isAdmin && portal !== 'buyer')) {
            navigate('/seller')
          } else {
            navigate('/')
          }
        }, 500)
      }
    } catch (err: unknown) {
      setMsgType('error')
      setMsg(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#1C1618]">
      <div className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-10 items-start">
        {/* Left Side: Editorial & Trust Value Proposition */}
        <div className="lg:col-span-5 space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-[#4A0E17] bg-[#FAF2E8] border border-[#E2D5BE] px-3.5 py-1.5 rounded-full">
            <span>✨</span> CURATED DIGITAL MARKETPLACE
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-[#1C1618] tracking-tight leading-[1.1]">
            {portal === 'creator' ? (
              <>
                Sell digital goods.<br />
                Keep <span className="text-[#4A0E17] underline decoration-[#D4AF37] decoration-4 underline-offset-4">90%</span> of revenue.
              </>
            ) : (
              <>
                Instant digital tools for creators and <span className="text-[#4A0E17] underline decoration-[#D4AF37] decoration-4 underline-offset-4">founders</span>.
              </>
            )}
          </h1>

          <p className="text-sm text-[#5C4A4E] leading-relaxed">
            {portal === 'creator'
              ? 'Join African founders and designers selling Notion templates, pitch decks, guides, and ebooks. Direct Paystack payouts and encrypted digital asset delivery.'
              : 'Browse high-quality digital templates, ebooks, and planners. Once purchased, download files directly from secure cloud storage.'}
          </p>

          {/* Role separation guarantee cards */}
          <div className="space-y-3 pt-2">
            <div className={`p-4 rounded-2xl border transition ${portal === 'buyer' ? 'bg-white border-[#4A0E17] shadow-sm' : 'bg-white/60 border-[#E2D5BE]'}`}>
              <div className="flex items-center gap-2 font-bold text-xs text-[#1C1618]">
                <span>🛍️</span> Buyer Account
              </div>
              <p className="text-[11px] text-[#8A767A] mt-1 leading-normal">
                Dedicated customer portal. Keeps order history, payment receipts, and instant download links safe.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border transition ${portal === 'creator' ? 'bg-white border-[#4A0E17] shadow-sm' : 'bg-white/60 border-[#E2D5BE]'}`}>
              <div className="flex items-center gap-2 font-bold text-xs text-[#1C1618]">
                <span>🎨</span> Creator Studio Account
              </div>
              <p className="text-[11px] text-[#8A767A] mt-1 leading-normal">
                Isolated creator dashboard. Upload products, configure pricing in Naira, track sales ledger, and receive 90% net earnings.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Dual-Feature Auth Portal Box */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-[#E2D5BE] shadow-xl p-7 sm:p-9 max-w-lg mx-auto">
            {/* Step 1: Portal Selector (Buyer vs Creator) */}
            <div className="mb-6">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#8A767A] mb-2 text-center">
                Select Your Account Type
              </label>
              <div className="grid grid-cols-2 p-1.5 bg-[#FAF6EE] border border-[#E2D5BE] rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPortal('buyer')
                    setMsg('')
                  }}
                  className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    portal === 'buyer'
                      ? 'bg-[#4A0E17] text-white shadow-md'
                      : 'text-[#5C4A4E] hover:text-[#1C1618]'
                  }`}
                >
                  <span className="text-sm">🛍️</span>
                  <span>Buyer Portal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPortal('creator')
                    setMsg('')
                  }}
                  className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    portal === 'creator'
                      ? 'bg-[#4A0E17] text-white shadow-md'
                      : 'text-[#5C4A4E] hover:text-[#1C1618]'
                  }`}
                >
                  <span className="text-sm">🎨</span>
                  <span>Creator Portal</span>
                </button>
              </div>
            </div>

            {/* Portal Banner */}
            <div className="mb-6 p-3 bg-[#FAF2E8]/60 border border-[#E2D5BE]/60 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-[#5C4A4E]">
                {portal === 'buyer' ? 'Shopping & Digital Downloads' : 'Selling & Creator Dashboard'}
              </span>
              <span className="text-[10px] font-bold text-[#4A0E17] uppercase tracking-wide bg-white px-2 py-0.5 rounded border border-[#E2D5BE]">
                {portal === 'buyer' ? 'Buyer Role' : 'Creator Role'}
              </span>
            </div>

            {/* Step 2: Mode Toggle (Sign In vs Sign Up vs Reset) */}
            <div className="flex border-b border-[#E2D5BE] mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setMsg('')
                }}
                className={`flex-1 pb-3 font-extrabold text-xs sm:text-sm text-center border-b-2 transition cursor-pointer ${
                  mode === 'login'
                    ? 'border-[#4A0E17] text-[#4A0E17]'
                    : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setMsg('')
                }}
                className={`flex-1 pb-3 font-extrabold text-xs sm:text-sm text-center border-b-2 transition cursor-pointer ${
                  mode === 'signup'
                    ? 'border-[#4A0E17] text-[#4A0E17]'
                    : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('reset')
                  setMsg('')
                }}
                className={`flex-1 pb-3 font-extrabold text-xs sm:text-sm text-center border-b-2 transition cursor-pointer ${
                  mode === 'reset'
                    ? 'border-[#4A0E17] text-[#4A0E17]'
                    : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
                }`}
              >
                Set Password
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-4">
              {mode === 'reset' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  🔑 <strong>Direct Password Update</strong>: Enter your email and new password to instantly update your Supabase account and sign in immediately (no verification email needed).
                </div>
              )}

              {/* Full name on sign up */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[#5C4A4E] mb-1">
                    Your Full Name *
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    type="text"
                    required
                    placeholder="e.g. Annabel Ijeoma"
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-[#1C1618] outline-none border border-[#E2D5BE] focus:border-[#4A0E17] transition bg-white"
                  />
                </div>
              )}

              {/* Creator specific store details on signup */}
              {mode === 'signup' && portal === 'creator' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#5C4A4E] mb-1">
                      Creator Store / Brand Name *
                    </label>
                    <input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      type="text"
                      required
                      placeholder="e.g. Annabel Studio, PixelCraft"
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-[#1C1618] outline-none border border-[#E2D5BE] focus:border-[#4A0E17] transition bg-white"
                    />
                    <p className="text-[10px] text-[#8A767A] mt-1">
                      This brand name will appear on all your listed products.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5C4A4E] mb-1">
                      Store Bio (Optional)
                    </label>
                    <input
                      value={storeBio}
                      onChange={(e) => setStoreBio(e.target.value)}
                      type="text"
                      placeholder="e.g. Design frameworks, pitch decks & creator playbooks"
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-[#1C1618] outline-none border border-[#E2D5BE] focus:border-[#4A0E17] transition bg-white"
                    />
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#5C4A4E] mb-1">
                  Email Address *
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder={portal === 'creator' ? 'creator@yourbrand.com' : 'you@example.com'}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-[#1C1618] outline-none border border-[#E2D5BE] focus:border-[#4A0E17] transition bg-white"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#5C4A4E]">
                    {mode === 'reset' ? 'New Password *' : 'Password *'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset')
                        setMsg('')
                      }}
                      className="text-[11px] font-semibold text-[#4A0E17] hover:underline"
                    >
                      Forgot / Set new password?
                    </button>
                  )}
                </div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-[#1C1618] outline-none border border-[#E2D5BE] focus:border-[#4A0E17] transition bg-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="mt-2 w-full bg-[#4A0E17] hover:bg-[#380b12] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                {busy
                  ? 'Connecting...'
                  : mode === 'signup'
                  ? `Create ${portal === 'creator' ? 'Creator' : 'Buyer'} Account`
                  : mode === 'reset'
                  ? `Set Password & Sign In as ${portal === 'creator' ? 'Creator' : 'Buyer'}`
                  : `Log in to ${portal === 'creator' ? 'Creator Studio' : 'Vessli'}`}{' '}
                <span className="text-[#D4AF37]">→</span>
              </button>

              {/* Feedback Message */}
              {msg && (
                <div
                  className={`mt-3 text-xs p-3.5 rounded-xl leading-relaxed border ${
                    msgType === 'error'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : msgType === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
                      : 'bg-[#FAF6EE] text-[#5C4A4E] border-[#E2D5BE]'
                  }`}
                >
                  <p>{msg}</p>
                  {msgType === 'error' && mode === 'login' && (
                    <div className="mt-2 pt-2 border-t border-rose-200 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('reset')
                          setMsg('Enter your desired password above, then click Set Password & Sign In.')
                          setMsgType('info')
                        }}
                        className="font-bold text-[#4A0E17] underline text-xs cursor-pointer"
                      >
                        Click here to set a new password for this email →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Account Reset / Wipe Help for testing */}
            <div className="mt-6 pt-4 border-t border-[#E2D5BE]/60 text-center space-y-2">
              <p className="text-[11px] text-[#8A767A] leading-snug">
                🔒 <strong>Account Isolation</strong>: Buyer dashboards and Creator dashboards are kept strictly segregated for data security and privacy.
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-[11px] text-stone-500 hover:text-stone-700 underline block mx-auto cursor-pointer"
                >
                  Need to completely delete an email from Supabase to start fresh?
                </button>
              ) : (
                <div className="p-3 bg-stone-100 border border-stone-300 rounded-xl text-left space-y-2">
                  <p className="text-xs font-bold text-stone-800">
                    Wipe account from Supabase:
                  </p>
                  <p className="text-[11px] text-stone-600">
                    This permanently removes the email entered above from Supabase Authentication and all linked database profiles so you can register completely fresh.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy || !email.trim()}
                      onClick={handleDeleteAccount}
                      className="px-3 py-1.5 bg-rose-700 text-white rounded-lg text-xs font-bold hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Delete {email.trim() ? `(${email.trim()})` : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-stone-200 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
