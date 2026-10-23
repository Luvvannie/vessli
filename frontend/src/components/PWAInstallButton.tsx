import React, { useState } from 'react'
import { usePWAInstall } from '../lib/usePWAInstall'
import { APKInstallModal } from './APKInstallModal'

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const [showModal, setShowModal] = useState(false)

  // If already running as an installed standalone APK / PWA, suppress the button
  if (isInstalled) {
    return null
  }
  return (
    <>
      <button
        onClick={() => {
          if (isInstallable) {
            install()
          } else {
            setShowModal(true)
          }
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF2E8] hover:bg-[#F3E7D3] border border-[#D4AF37]/60 text-[#4A0E17] text-xs font-bold transition shadow-xs cursor-pointer group"
        title="Install Vessli Android APK / Web App"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform inline-block" />
        <svg className="w-3.5 h-3.5 text-[#4A0E17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="hidden sm:inline">Install APK</span>
        <span className="sm:hidden">APK</span>
      </button>

      <APKInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
