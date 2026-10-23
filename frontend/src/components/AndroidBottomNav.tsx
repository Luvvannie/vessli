import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useRole } from '../lib/roles'
import { useAI } from '../lib/aiContext'

interface AndroidBottomNavProps {
  onOpenSearch?: () => void
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({ onOpenSearch }) => {
  const location = useLocation()
  const { session } = useAuth()
  const { currentRole } = useRole()
  const { openChat } = useAI()

  const path = location.pathname

  const isHome = path === '/'
  const isStudio = path === '/seller'
  const isAccount = path === '/account'
  const isAuth = path === '/auth' || path === '/login'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6EE]/95 backdrop-blur-xl border-t border-[#E2D5BE] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,8px)] transition-all">
      <div className="max-w-md mx-auto px-2 pt-1.5 pb-1 flex items-center justify-around">
        {/* 1. Discover */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer group ${
            isHome ? 'text-[#4A0E17]' : 'text-[#8A767A] hover:text-[#4A0E17]'
          }`}
        >
          <div
            className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              isHome ? 'bg-[#4A0E17]/15 scale-105' : 'bg-transparent group-hover:bg-[#4A0E17]/5'
            }`}
          >
            <svg className="w-5 h-5" fill={isHome ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isHome ? '2.5' : '2'} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${isHome ? 'text-[#4A0E17]' : 'text-[#8A767A]'}`}>
            Discover
          </span>
        </Link>

        {/* 2. Search / Explore */}
        <button
          onClick={() => {
            if (onOpenSearch) {
              onOpenSearch()
            } else {
              const el = document.getElementById('search-section') || document.getElementById('categories')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer group text-[#8A767A] hover:text-[#4A0E17]"
        >
          <div className="w-10 h-6 rounded-full flex items-center justify-center transition-all group-hover:bg-[#4A0E17]/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="text-[10px] mt-0.5 font-bold tracking-tight text-[#8A767A]">
            Explore
          </span>
        </button>

        {/* 3. Vessli AI Advisor (Floating Center Action) */}
        <button
          onClick={openChat}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 -mt-3 cursor-pointer group"
          title="Ask Vessli AI Shopping Advisor"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4A0E17] to-[#7A1D2D] text-white flex items-center justify-center shadow-lg border-2 border-[#D4AF37] group-active:scale-95 transition-all">
            <svg className="w-6 h-6 text-[#D4AF37] animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
            </svg>
          </div>
          <span className="text-[10px] mt-1 font-black tracking-tight text-[#4A0E17]">
            Vessli AI
          </span>
        </button>

        {/* 4. Orders / Creator Studio */}
        {currentRole === 'seller' ? (
          <Link
            to="/seller"
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer group ${
              isStudio ? 'text-[#4A0E17]' : 'text-[#8A767A] hover:text-[#4A0E17]'
            }`}
          >
            <div
              className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
                isStudio ? 'bg-[#4A0E17]/15 scale-105' : 'bg-transparent group-hover:bg-[#4A0E17]/5'
              }`}
            >
              <svg className="w-5 h-5" fill={isStudio ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isStudio ? '2.5' : '2'} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${isStudio ? 'text-[#4A0E17]' : 'text-[#8A767A]'}`}>
              Studio
            </span>
          </Link>
        ) : (
          <Link
            to={session ? '/account' : '/login'}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer group ${
              isAccount ? 'text-[#4A0E17]' : 'text-[#8A767A] hover:text-[#4A0E17]'
            }`}
          >
            <div
              className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
                isAccount ? 'bg-[#4A0E17]/15 scale-105' : 'bg-transparent group-hover:bg-[#4A0E17]/5'
              }`}
            >
              <svg className="w-5 h-5" fill={isAccount ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isAccount ? '2.5' : '2'} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${isAccount ? 'text-[#4A0E17]' : 'text-[#8A767A]'}`}>
              Orders
            </span>
          </Link>
        )}

        {/* 5. Account / Sign In */}
        <Link
          to={session ? '/account' : '/login'}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer group ${
            isAccount || isAuth ? 'text-[#4A0E17]' : 'text-[#8A767A] hover:text-[#4A0E17]'
          }`}
        >
          <div
            className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              isAccount || isAuth ? 'bg-[#4A0E17]/15 scale-105' : 'bg-transparent group-hover:bg-[#4A0E17]/5'
            }`}
          >
            <svg className="w-5 h-5" fill={isAccount || isAuth ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isAccount || isAuth ? '2.5' : '2'} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className={`text-[10px] mt-0.5 font-bold tracking-tight ${isAccount || isAuth ? 'text-[#4A0E17]' : 'text-[#8A767A]'}`}>
            {session ? 'Account' : 'Sign In'}
          </span>
        </Link>
      </div>

      {/* Android Home Gesture Pill */}
      <div className="w-32 h-1 bg-[#4A0E17]/25 rounded-full mx-auto my-1 pointer-events-none" />
    </nav>
  )
}
