import React, { useState, useEffect } from 'react'
import { AndroidStatusBar } from './AndroidStatusBar'
import { AndroidBottomNav } from './AndroidBottomNav'
import { OfflineIndicator } from './OfflineIndicator'

interface APKMobileShellProps {
  children: React.ReactNode
}

export const APKMobileShell: React.FC<APKMobileShellProps> = ({ children }) => {
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false)

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

      {/* Clean Native Shell */}
      <div className="min-h-screen flex flex-col">
        {/* Top Status Bar on Mobile devices */}
        {isMobileScreen && <AndroidStatusBar />}

        {/* Main Content Area */}
        <main className="flex-1 pb-20 md:pb-8">
          {children}
        </main>

        {/* Docked Android Bottom Navigation Bar (Active on Mobile devices) */}
        {isMobileScreen && <AndroidBottomNav />}
      </div>
    </div>
  )
}
