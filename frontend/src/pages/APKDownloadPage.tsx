import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePWAInstall } from '../lib/usePWAInstall'

export default function APKDownloadPage() {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall()
  const [activeTab, setActiveTab] = useState<'install' | 'emulator' | 'qr' | 'export'>('emulator')
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vessli.app'
  const apkPageUrl = typeof window !== 'undefined' ? `${window.location.origin}/apk` : 'https://vessli.app/apk'

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
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#4A0E17] hover:underline"
          >
            ← Back to Vessli Marketplace
          </Link>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF2E8] border border-[#E2D5BE] text-[#4A0E17]">
            Private APK Hub
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-[#4A0E17] text-[#FAF6EE] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#D4AF37]/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-white text-[#4A0E17] flex items-center justify-center font-black text-3xl shadow-lg border-2 border-[#D4AF37] shrink-0">
              V
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Vessli Mobile APK
                </h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#4A0E17] uppercase tracking-wider">
                  v1.2.0
                </span>
              </div>
              <p className="text-xs text-[#E2D5BE] mt-1.5 leading-relaxed">
                Direct installation portal for Android WebAPK and mobile application packages. Installs with zero browser chrome, offline caching, and bottom navigation ergonomics.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-mono">
                  Package: com.vessli.app
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white font-mono">
                  Android 14+ / SDK 34
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl border border-[#E2D5BE] shadow-xs overflow-hidden">
          <div className="flex border-b border-[#E2D5BE] bg-[#FAF6EE]/50 px-6 pt-3 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('emulator')}
              className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'emulator'
                  ? 'border-[#4A0E17] text-[#4A0E17]'
                  : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
              }`}
            >
              📱 Test Drive Simulator
            </button>
            <button
              onClick={() => setActiveTab('install')}
              className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'install'
                  ? 'border-[#4A0E17] text-[#4A0E17]'
                  : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
              }`}
            >
              🚀 1-Tap Install (WebAPK)
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'qr'
                  ? 'border-[#4A0E17] text-[#4A0E17]'
                  : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
              }`}
            >
              📷 Scan QR
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'export'
                  ? 'border-[#4A0E17] text-[#4A0E17]'
                  : 'border-transparent text-[#8A767A] hover:text-[#1C1618]'
              }`}
            >
              📦 Compile .APK
            </button>
          </div>

          <div className="p-6 space-y-5 text-xs text-[#1C1618]">
            {activeTab === 'emulator' && (
              <div className="space-y-6">
                <div className="bg-[#FAF2E8] p-4 rounded-2xl border border-[#D4AF37]/50 flex items-start gap-3">
                  <span className="text-2xl">🎮</span>
                  <div>
                    <h3 className="font-bold text-sm text-[#4A0E17]">No Android Phone? Test Right Here!</h3>
                    <p className="text-[#6B5A5E] text-xs mt-0.5 leading-relaxed">
                      This interactive Google Pixel simulator runs the live Vessli APK mobile shell. You can tap through the marketplace, test the bottom dock navigation, chat with the Vessli AI shopping assistant, and test the checkout flow!
                    </p>
                  </div>
                </div>

                {/* Device Frame */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-[370px] h-[680px] bg-[#1C1618] rounded-[48px] p-2 shadow-2xl border-[3px] border-[#383133]">
                    {/* Volume & Power buttons */}
                    <div className="absolute -left-[5px] top-[120px] w-[2.5px] h-[40px] bg-[#4E4447] rounded-l-md" />
                    <div className="absolute -left-[5px] top-[170px] w-[2.5px] h-[40px] bg-[#4E4447] rounded-l-md" />
                    <div className="absolute -right-[5px] top-[140px] w-[2.5px] h-[48px] bg-[#4E4447] rounded-r-md" />

                    {/* Phone Screen */}
                    <div className="w-full h-full bg-[#FAF6EE] rounded-[40px] overflow-hidden flex flex-col relative shadow-inner">
                      {/* Punch Hole Camera */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-3.5 h-3.5 rounded-full bg-black/90 border border-neutral-700 flex items-center justify-center pointer-events-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A24]" />
                      </div>

                      {/* Live App Frame */}
                      <iframe
                        src="/"
                        className="w-full h-full border-0 bg-[#FAF7F2]"
                        title="Vessli Android APK Live Preview"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-[#8A767A] text-center mt-3">
                    💡 <strong>Pro Tip:</strong> You can also press <kbd className="px-1.5 py-0.5 bg-neutral-200 text-neutral-800 rounded font-mono text-[10px]">F12</kbd> (or Right Click → <strong>Inspect</strong>) and click the <strong>Mobile Toggle</strong> icon (<span className="text-[#4A0E17]">📱</span>) in your browser to test any device size!
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'install' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#FAF6EE]/70 border border-[#E2D5BE] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shrink-0">
                      🤖
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1C1618]">Android WebAPK Installation</h3>
                      <p className="text-[#6B5A5E] text-xs">
                        Installs into your Android phone app drawer as an APK managed by Android system services.
                      </p>
                    </div>
                  </div>

                  {isInstalled ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                      <span>✓</span> Vessli is already installed as a standalone APK on this device!
                    </div>
                  ) : isInstallable ? (
                    <button
                      onClick={install}
                      className="w-full py-3.5 bg-[#4A0E17] hover:bg-[#380A11] text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Install Vessli APK Directly
                    </button>
                  ) : isAndroid ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                      <p className="font-bold">Android Chrome / Samsung Internet Instructions:</p>
                      <p className="text-[11px] leading-relaxed">
                        Tap the <strong>three dots menu (⋮)</strong> in your browser header and select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong> to generate and install the Android WebAPK.
                      </p>
                    </div>
                  ) : isIOS ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1.5">
                      <p className="font-bold">iOS Safari Instructions:</p>
                      <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                        <li>Tap the <strong>Share</strong> button (square with arrow) at bottom of Safari.</li>
                        <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
                        <li>Tap <strong>Add</strong> at top right.</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#FAF6EE] border border-[#E2D5BE] rounded-xl text-[#5C4A4E] space-y-2">
                      <p className="font-bold text-[#1C1618]">Desktop / Laptop Browser:</p>
                      <p className="text-[11px] leading-relaxed">
                        To install this APK on your physical Android phone, open the <strong>"Scan QR on Phone"</strong> tab above, or open this page URL directly in Chrome on your phone.
                      </p>
                      <div className="pt-1">
                        <button
                          onClick={() => copyToClipboard(apkPageUrl, 'apk-url')}
                          className="px-3 py-1.5 bg-white border border-[#E2D5BE] text-[#4A0E17] font-bold rounded-lg text-xs hover:bg-[#FAF6EE] cursor-pointer"
                        >
                          {copiedSnippet === 'apk-url' ? '✓ Link Copied to Clipboard!' : 'Copy Accessible Link to Share'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#FAF6EE]/50 rounded-xl border border-[#E2D5BE]">
                    <div className="font-bold text-[#4A0E17]">⚡ Instant Launch</div>
                    <div className="text-[#8A767A] text-[11px] mt-0.5">Precached assets and lightning boot</div>
                  </div>
                  <div className="p-3 bg-[#FAF6EE]/50 rounded-xl border border-[#E2D5BE]">
                    <div className="font-bold text-[#4A0E17]">📴 Offline Ready</div>
                    <div className="text-[#8A767A] text-[11px] mt-0.5">Browse cached catalog without signal</div>
                  </div>
                  <div className="p-3 bg-[#FAF6EE]/50 rounded-xl border border-[#E2D5BE]">
                    <div className="font-bold text-[#4A0E17]">📱 Full Native Shell</div>
                    <div className="text-[#8A767A] text-[11px] mt-0.5">Bottom dock ergonomics, no URL bar</div>
                  </div>
                  <div className="p-3 bg-[#FAF6EE]/50 rounded-xl border border-[#E2D5BE]">
                    <div className="font-bold text-[#4A0E17]">🔒 Encrypted Auth</div>
                    <div className="text-[#8A767A] text-[11px] mt-0.5">Secure Supabase token storage</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="p-4 text-center space-y-4">
                <div className="p-4 bg-white border-2 border-[#4A0E17] rounded-2xl shadow-inner inline-block">
                  <svg className="w-56 h-56 mx-auto" viewBox="0 0 200 200" fill="none">
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
                  <h3 className="font-bold text-sm text-[#1C1618]">Scan with Android Camera</h3>
                  <p className="text-[#6B5A5E] text-xs max-w-sm mx-auto mt-1">
                    Point your smartphone camera at this code to open the installer on your phone.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => copyToClipboard(apkPageUrl, 'apk-url-tab')}
                    className="px-4 py-2 bg-[#4A0E17] text-white font-bold rounded-xl text-xs hover:bg-[#380A11] transition cursor-pointer"
                  >
                    {copiedSnippet === 'apk-url-tab' ? '✓ Link Copied!' : 'Copy Direct Link to Share'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950">Direct Android Package (.zip)</h4>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      Contains preconfigured AndroidManifest.xml, Bubblewrap TWA manifest, and app launcher icons ready for production compilation.
                    </p>
                  </div>
                  <a
                    href="/vessli-android-package.zip"
                    download="vessli-android-package.zip"
                    className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition shrink-0 cursor-pointer"
                  >
                    <span>⬇️</span> Download Package
                  </a>
                </div>

                <div className="p-4 bg-[#FAF6EE]/50 rounded-2xl border border-[#E2D5BE] space-y-2">
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
                  <pre className="p-3 bg-[#1C1618] text-[#FAF6EE] rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed">
                    {bubblewrapCode}
                  </pre>
                </div>

                <div className="p-4 bg-[#FAF6EE]/50 rounded-2xl border border-[#E2D5BE] space-y-2">
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
                    Wrap into standard Gradle Android project and compile an APK in Android Studio.
                  </p>
                  <pre className="p-3 bg-[#1C1618] text-[#FAF6EE] rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed">
                    {capacitorCode}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="p-4 bg-white rounded-2xl border border-[#E2D5BE] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#8A767A] block">
              Accessible APK Link
            </span>
            <span className="font-mono text-xs text-[#4A0E17] break-all">
              {apkPageUrl}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(apkPageUrl, 'box-url')}
            className="px-4 py-2 bg-[#FAF2E8] hover:bg-[#F3E7D3] border border-[#D4AF37]/60 text-[#4A0E17] rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
          >
            {copiedSnippet === 'box-url' ? '✓ Copied' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  )
}
