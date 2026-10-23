import React, { useState, useEffect } from 'react'

export const AndroidStatusBar: React.FC = () => {
  const [timeStr, setTimeStr] = useState('9:41')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setTimeStr(`${hours}:${minutes}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full bg-[#4A0E17] text-[#FAF6EE] px-4 py-1.5 flex items-center justify-between text-[11px] font-semibold tracking-tight select-none border-b border-[#FAF6EE]/10 z-50">
      {/* Left: Clock & App Indicator */}
      <div className="flex items-center gap-2">
        <span className="font-bold tracking-normal">{timeStr}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] inline-block" />
        <span className="text-[10px] text-[#FAF6EE]/80 uppercase tracking-widest font-mono">VESSLI APK</span>
      </div>

      {/* Center: Punch Hole Camera Pill (Device simulation) */}
      <div className="w-3.5 h-3.5 rounded-full bg-black/90 border border-neutral-700 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A24]" />
      </div>

      {/* Right: Network & Battery */}
      <div className="flex items-center gap-2 text-xs">
        {/* 5G icon */}
        <span className="text-[9px] font-extrabold px-1 rounded bg-[#D4AF37]/30 text-[#D4AF37] leading-tight">
          5G
        </span>

        {/* WiFi signal icon */}
        <svg className="w-3.5 h-3.5 text-[#FAF6EE]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.87 0 7.37 1.57 9.9 4.1L12 19.5 2.1 11.6C4.63 9.07 8.13 7.5 12 7.5z" />
        </svg>

        {/* Battery with percentage */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#FAF6EE]/90">98%</span>
          <div className="w-5 h-2.5 border border-[#FAF6EE] rounded-xs p-0.5 flex items-center relative">
            <div className="h-full bg-[#D4AF37] rounded-2xs w-[85%]" />
            <div className="absolute -right-1 top-0.5 w-0.5 h-1.5 bg-[#FAF6EE] rounded-r-2xs" />
          </div>
        </div>
      </div>
    </div>
  )
}
