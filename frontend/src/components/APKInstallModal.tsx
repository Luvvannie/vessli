import React, { useState } from 'react'
import { usePWAInstall } from '../lib/usePWAInstall'

interface APKInstallModalProps {
  isOpen: boolean
  onClose: () => void
}

export const APKInstallModal: React.FC<APKInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall()
  const [activeTab, setActiveTab] = useState<'install' | 'export' | 'qr'>('install')
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)

  if (!isOpen) return null

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vessli.app'

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSnippet(id)
    setTimeout(() => setCopiedSnippet(null), 2500)
  }

  const bubblewrapCode = `# 1. Install Google Bubblewrap CLI
npm i -g @bubblewrap/cli

# 2. Initialize Android Project from WebAPK Manifest
bubblewrap init --manifest=${appUrl}/manifest.webmanifest

# 3. Build signed Android APK / AAB
bubblewrap build`

  const capacitorCode = `# 1. Install Capacitor Android runtime
npm install @capacitor/core @capacitor/android
npx cap init Vessli com.vessli.app --web-dir dist

# 2. Add Android platform & build APK
npx cap add android
npx cap copy
npx cap open android`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#FAF6EE] border-2 border-[#4A0E17] rounded-3xl shadow-2xl overflow-hidden text-[#1C1618] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Android APK branding */}
        <div className="bg-[#4A0E17] text-[#FAF6EE] px-6 py-4 flex items-center justify-between border-b border-[#D4AF37]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#4A0E17] flex items-center justify-center font-black text-xl shadow-md border border-[#D4AF37]">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight text-white">Vessli Mobile APK</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#4A0E17] uppercase tracking-wider">
                  v1.2.0
                </span>
              </div>
              <p className="text-xs text-[#E2D5BE]">Android WebAPK & Native Packaging Hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-[#E2D5BE] bg-white px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('install')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'install'
                ? 'border-[#4A0E17] text-[#4A0E17]'
                : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
            }`}
          >
            🚀 1-Tap Install (WebAPK)
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#4A0E17] text-[#4A0E17]'
                : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
            }`}
          >
            📦 Build Native .APK
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'qr'
                ? 'border-[#4A0E17] text-[#4A0E17]'
                : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
            }`}
          >
            📱 Scan QR on Phone
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E2D5BE] shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shrink-0">
                    🤖
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1C1618]">Instant Android WebAPK</h4>
                    <p className="text-[#6B5A5E] text-xs">
                      Installs directly into your Android app drawer with full offline mode, fullscreen standalone window, and zero browser address bar.
                    </p>
                  </div>
                </div>

                {isInstalled ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                    <span>✓</span> Vessli is already installed as a standalone APK on this device!
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={async () => {
                      const success = await install()
                      if (success) onClose()
                    }}
                    className="w-full py-3 bg-[#4A0E17] hover:bg-[#380A11] text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Install Vessli APK Now
                  </button>
                ) : isAndroid ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                    <p className="font-bold">Android Chrome / Edge detected:</p>
                    <p className="text-[11px]">
                      Tap the <strong>three dots menu (⋮)</strong> in your browser header and select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong> to generate the Android WebAPK.
                    </p>
                  </div>
                ) : isIOS ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                    <p className="font-bold">iOS Safari Installation:</p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                      <li>Tap the <strong>Share</strong> button (box with upward arrow) in Safari.</li>
                      <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                      <li>Tap <strong>Add</strong> to launch Vessli in full native view.</li>
                    </ol>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FAF6EE] border border-[#E2D5BE] rounded-xl text-[#5C4A4E] space-y-1">
                    <p className="font-bold text-[#1C1618]">Desktop / Laptop Browser:</p>
                    <p className="text-[11px]">
                      Click the <strong>Install App icon (⊕)</strong> in your browser address bar, or use the <strong>APK Mobile Mode</strong> toggle in the top bar to preview the mobile shell!
                    </p>
                  </div>
                )}
              </div>

              {/* Native APK Feature Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-white rounded-xl border border-[#E2D5BE]">
                  <div className="font-bold text-[#4A0E17]">⚡ Fast Startup</div>
                  <div className="text-[#8A767A]">Cached service worker shell for instant launch</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#E2D5BE]">
                  <div className="font-bold text-[#4A0E17]">📴 Offline Ready</div>
                  <div className="text-[#8A767A]">Browse cached products without network</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#E2D5BE]">
                  <div className="font-bold text-[#4A0E17]">📱 Fullscreen Mode</div>
                  <div className="text-[#8A767A]">Standalone window without browser tabs</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#E2D5BE]">
                  <div className="font-bold text-[#4A0E17]">🔒 Secure Storage</div>
                  <div className="text-[#8A767A]">Encrypted Supabase session tokens</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-3 bg-white rounded-2xl border border-[#E2D5BE] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1C1618]">Google Play TWA / Bubblewrap</h4>
                  <button
                    onClick={() => copyToClipboard(bubblewrapCode, 'bubblewrap')}
                    className="px-2.5 py-1 bg-[#4A0E17]/10 hover:bg-[#4A0E17]/20 text-[#4A0E17] font-bold rounded-lg text-[10px] transition cursor-pointer"
                  >
                    {copiedSnippet === 'bubblewrap' ? '✓ Copied' : 'Copy Commands'}
                  </button>
                </div>
                <p className="text-[#6B5A5E] text-[11px]">
                  Build an official Google Play Store ready APK or AAB bundle using Google's official Trusted Web Activity CLI tool.
                </p>
                <pre className="p-2.5 bg-[#1C1618] text-[#FAF6EE] rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed">
                  {bubblewrapCode}
                </pre>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-[#E2D5BE] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1C1618]">Capacitor Android Studio Export</h4>
                  <button
                    onClick={() => copyToClipboard(capacitorCode, 'capacitor')}
                    className="px-2.5 py-1 bg-[#4A0E17]/10 hover:bg-[#4A0E17]/20 text-[#4A0E17] font-bold rounded-lg text-[10px] transition cursor-pointer"
                  >
                    {copiedSnippet === 'capacitor' ? '✓ Copied' : 'Copy Commands'}
                  </button>
                </div>
                <p className="text-[#6B5A5E] text-[11px]">
                  Wrap this app into a standard Gradle Android project and compile an APK in Android Studio.
                </p>
                <pre className="p-2.5 bg-[#1C1618] text-[#FAF6EE] rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed">
                  {capacitorCode}
                </pre>
              </div>

              <div className="p-3 bg-[#FAF2E8] rounded-xl border border-[#D4AF37]/40 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#4A0E17]">Package Identifier</div>
                  <div className="text-[10px] text-[#6B5A5E]">com.vessli.app · Android SDK 34+</div>
                </div>
                <button
                  onClick={() => copyToClipboard('com.vessli.app', 'package')}
                  className="px-2.5 py-1 bg-white border border-[#E2D5BE] rounded-lg text-[10px] font-bold text-[#4A0E17] hover:bg-[#FAF6EE]"
                >
                  {copiedSnippet === 'package' ? 'Copied!' : 'Copy ID'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <div className="p-6 bg-white rounded-2xl border border-[#E2D5BE] flex flex-col items-center justify-center space-y-3">
                {/* Clean inline SVG QR code pattern representing current URL */}
                <div className="p-4 bg-white border-2 border-[#4A0E17] rounded-2xl shadow-inner inline-block">
                  <svg className="w-48 h-48" viewBox="0 0 200 200" fill="none">
                    {/* Background */}
                    <rect width="200" height="200" fill="#FAF6EE" rx="12" />
                    {/* Corner Squares */}
                    <rect x="20" y="20" width="45" height="45" fill="#4A0E17" rx="6" />
                    <rect x="28" y="28" width="29" height="29" fill="#FAF6EE" rx="4" />
                    <rect x="34" y="34" width="17" height="17" fill="#4A0E17" rx="2" />

                    <rect x="135" y="20" width="45" height="45" fill="#4A0E17" rx="6" />
                    <rect x="143" y="28" width="29" height="29" fill="#FAF6EE" rx="4" />
                    <rect x="149" y="34" width="17" height="17" fill="#4A0E17" rx="2" />

                    <rect x="20" y="135" width="45" height="45" fill="#4A0E17" rx="6" />
                    <rect x="28" y="143" width="29" height="29" fill="#FAF6EE" rx="4" />
                    <rect x="34" y="149" width="17" height="17" fill="#4A0E17" rx="2" />

                    {/* QR Matrix Bits */}
                    <rect x="75" y="25" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="95" y="25" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="115" y="25" width="10" height="10" fill="#4A0E17" rx="2" />

                    <rect x="75" y="45" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="105" y="45" width="10" height="10" fill="#D4AF37" rx="2" />
                    <rect x="85" y="65" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="115" y="65" width="10" height="10" fill="#4A0E17" rx="2" />

                    {/* Center Vessli Diamond Badge */}
                    <rect x="82" y="82" width="36" height="36" fill="#4A0E17" rx="8" />
                    <text x="100" y="106" fill="#D4AF37" fontSize="20" fontWeight="900" textAnchor="middle">V</text>

                    {/* Bottom bits */}
                    <rect x="75" y="135" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="95" y="135" width="10" height="10" fill="#D4AF37" rx="2" />
                    <rect x="115" y="135" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="135" y="135" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="155" y="135" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="85" y="155" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="105" y="155" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="135" y="155" width="10" height="10" fill="#D4AF37" rx="2" />
                    <rect x="165" y="155" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="75" y="175" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="115" y="175" width="10" height="10" fill="#4A0E17" rx="2" />
                    <rect x="145" y="175" width="10" height="10" fill="#4A0E17" rx="2" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1C1618]">Scan with Android Camera</h4>
                  <p className="text-[#6B5A5E] text-xs max-w-xs mt-1">
                    Open your smartphone camera app, point it here, and tap the link to load the APK interface immediately.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#FAF6EE] px-6 py-3 border-t border-[#E2D5BE] flex items-center justify-between">
          <span className="text-[11px] text-[#8A767A]">Vessli Mobile Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#4A0E17] text-white rounded-xl text-xs font-bold hover:bg-[#380A11] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
