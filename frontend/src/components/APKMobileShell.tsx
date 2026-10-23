import React, { useState, useEffect } from 'react'
import { AndroidStatusBar } from './AndroidStatusBar'
import { AndroidBottomNav } from './AndroidBottomNav'
import { APKInstallModal } from './APKInstallModal'
import { OfflineIndicator } from './OfflineIndicator'
import { usePWAInstall } from '../lib/usePWAInstall'

interface APKMobileShellProps {
  children: React.ReactNode
}

export const APKMobileShell: React.FC<APKMobileShellProps> = ({ children }) => {
  // Check if saved preference or screen size
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(false)
  const [showAPKModal, setShowAPKModal] = useState<boolean>(false)
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false)
  const { isInstalled } = usePWAInstall()

  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 768
      setIsMobileScreen(mobile)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#1C1618] selection:bg-[#4A0E17] selection:text-white relative">
      <OfflineIndicator />

      {/* Desktop APK Control Header Bar (Only visible on non-mobile desktop viewports) */}
      {!isMobileScreen && !isInstalled && (
        <div className="bg-[#4A0E17] text-[#FAF6EE] px-4 py-2 border-b border-[#D4AF37]/30 flex items-center justify-between text-xs font-medium sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Vessli APK Mobile Mode</span>
            </span>
            <span className="hidden lg:inline text-[#E2D5BE]/80 text-[11px]">
              Android WebAPK runtime & native shell active
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Device Frame Mockup vs Fluid Fullscreen */}
            <button
              onClick={() => setDeviceFrameMode(!deviceFrameMode)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                deviceFrameMode
                  ? 'bg-[#D4AF37] text-[#4A0E17] shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span>📱</span>
              <span>{deviceFrameMode ? 'Exit Phone Frame' : 'Preview Phone Frame'}</span>
            </button>

            {/* Open APK Install / Export Center */}
            <button
              onClick={() => setShowAPKModal(true)}
              className="px-3 py-1 rounded-full bg-white text-[#4A0E17] hover:bg-[#FAF6EE] text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#4A0E17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Install / Download APK</span>
            </button>
          </div>
        </div>
      )}

      {/* Case 1: Desktop Phone Mockup View */}
      {deviceFrameMode && !isMobileScreen ? (
        <div className="py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-45px)] bg-radial from-[#3A0A12] via-[#24060B] to-[#120205]">
          <div className="text-center mb-4">
            <h2 className="text-white text-lg font-black tracking-tight flex items-center justify-center gap-2">
              <span>Android APK Native Interface</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#4A0E17] font-extrabold uppercase">
                Pixel 9 Pro Shell
              </span>
            </h2>
            <p className="text-xs text-[#E2D5BE]/70 mt-0.5">
              Experience touch ergonomics, bottom navigation dock, and standalone Android layout.
            </p>
          </div>

          {/* Android Smartphone Chassis Frame */}
          <div className="relative w-[390px] h-[830px] bg-[#1C1618] rounded-[52px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] border-[4px] border-[#383133]">
            {/* Volume Buttons & Power Button simulation on edge */}
            <div className="absolute -left-[7px] top-[140px] w-[3px] h-[45px] bg-[#4E4447] rounded-l-md" />
            <div className="absolute -left-[7px] top-[195px] w-[3px] h-[45px] bg-[#4E4447] rounded-l-md" />
            <div className="absolute -right-[7px] top-[160px] w-[3px] h-[55px] bg-[#4E4447] rounded-r-md" />

            {/* Inner Display Screen */}
            <div className="w-full h-full bg-[#FAF6EE] rounded-[42px] overflow-hidden flex flex-col relative shadow-inner">
              <AndroidStatusBar />
              <div className="flex-1 overflow-y-auto pb-20 custom-scroll">
                {children}
              </div>
              <AndroidBottomNav onOpenAPKModal={() => setShowAPKModal(true)} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setDeviceFrameMode(false)}
              className="text-xs text-[#E2D5BE] hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Switch back to Fullscreen Mode
            </button>
          </div>
        </div>
      ) : (
        /* Case 2: Fluid Responsive APK Shell (Active on Mobile, Tablet & Fullscreen Desktop) */
        <div className="min-h-screen flex flex-col">
          {/* Top Status Bar on Mobile devices */}
          {isMobileScreen && <AndroidStatusBar />}

          {/* Main Content Area */}
          <main className="flex-1 pb-24">
            {children}
          </main>

          {/* Docked Android Bottom Navigation Bar */}
          <AndroidBottomNav onOpenAPKModal={() => setShowAPKModal(true)} />
        </div>
      )}

      {/* APK Install / Export Dialog */}
      <APKInstallModal isOpen={showAPKModal} onClose={() => setShowAPKModal(false)} />
    </div>
  )
}
