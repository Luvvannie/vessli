import React from 'react'
import { useOnlineStatus } from '../lib/useOnlineStatus'

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#4A0E17] text-[#FAF6EE] px-4 py-1.5 text-xs font-semibold shadow-xl border border-[#D4AF37]/50 animate-bounce">
      <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
      <span>Offline Mode — Running from cached APK shell</span>
    </div>
  )
}
