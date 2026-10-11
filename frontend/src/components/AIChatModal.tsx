import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { sendAIChatMessage, type ChatMessage } from '../lib/aiClient'
import { type Product, FALLBACK_PRODUCTS } from '../lib/products'

interface AIChatModalProps {
  isOpen: boolean
  onClose: () => void
  catalog?: Product[]
  onSelectProduct?: (product: Product) => void
}

const STARTER_PROMPTS = [
  'What templates do I need to launch a creator brand?',
  'Find me Notion workspaces under ₦6,000',
  'Best assets for pitching seed investors',
  'Compare Notion OS vs Personal Finance Tracker',
]

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'model',
    text: 'Hello! I am **Vessli Copilot**, your AI shopping concierge. Tell me what you are working on or what digital assets you need, and I will recommend the best curated tools, templates, or playbooks from our creator catalog.',
    timestamp: 0,
    recommendedIds: ['prod-planner-2', 'prod-bundle-1'],
  },
]

export function AIChatModal({ isOpen, onClose, catalog = FALLBACK_PRODUCTS, onSelectProduct }: AIChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const seqRef = useRef(1)

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  if (!isOpen) return null

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || loading) return

    const userMsg: ChatMessage = {
      id: `user-${seqRef.current++}`,
      role: 'user',
      text,
      timestamp: 0,
    }

    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setLoading(true)

    try {
      const historyPayload = newHistory.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }))

      const res = await sendAIChatMessage(text, historyPayload, catalog)
      const botMsg: ChatMessage = {
        id: `bot-${seqRef.current++}`,
        role: 'model',
        text: res.reply,
        timestamp: 0,
        recommendedIds: res.recommendedIds,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${seqRef.current++}`,
          role: 'model',
          text: 'I ran into a temporary hiccup connecting to the intelligence server. You can still browse our curated collections directly in the catalog!',
          timestamp: 0,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Helper to find products by ID
  const getProductsByIds = (ids?: string[]) => {
    if (!ids || ids.length === 0) return []
    return ids
      .map((id) => catalog.find((p) => p.id === id || p.id.toLowerCase().includes(id.toLowerCase())))
      .filter((p): p is Product => Boolean(p))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#FAF7F2] border border-[#E6E0D6] shadow-2xl flex flex-col h-[85vh] max-h-[720px] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="copilot-title"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#4A0E17] text-white flex items-center justify-between border-b border-[#3b0b12]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-none bg-[#D4AF37] text-[#1C1618] flex items-center justify-center font-bold text-xs tracking-wider shadow-inner">
              AI
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="copilot-title" className="font-serif font-bold text-base tracking-tight text-[#FAF7F2]">
                  Vessli Copilot
                </h3>
                <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-medium">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-[#E6E0D6]/80">Intelligent Shopping Advisor & Creator Concierge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white transition-colors"
            aria-label="Close Assistant"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-sm text-[#1C1618]">
          {messages.map((m) => {
            const isUser = m.role === 'user'
            const recProducts = !isUser ? getProductsByIds(m.recommendedIds) : []

            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] font-mono tracking-widest text-stone-700 uppercase mb-1">
                  {isUser ? 'You' : 'Vessli Copilot'}
                </div>
                <div
                  className={`p-3.5 max-w-[88%] sm:max-w-[80%] leading-relaxed ${
                    isUser
                      ? 'bg-[#4A0E17] text-[#FAF7F2] border border-[#4A0E17]'
                      : 'bg-[#F2ECE1] border border-[#E0D8CB] text-[#1C1618]'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>

                {/* Recommended Product Cards */}
                {recProducts.length > 0 && (
                  <div className="mt-3 w-full max-w-[92%] sm:max-w-[85%] space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#4A0E17] flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 bg-[#D4AF37]"></span>
                      Recommended Assets:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {recProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-white border border-[#E6E0D6] p-3 hover:border-[#4A0E17] transition-all flex flex-col justify-between group shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 bg-stone-100 text-stone-600 border border-stone-200">
                                {prod.category}
                              </span>
                              <span className="text-xs font-bold text-[#4A0E17]">
                                {prod.price || '₦' + ((prod.price_kobo || 0) / 100).toLocaleString()}
                              </span>
                            </div>
                            <h4 className="font-serif font-bold text-xs text-[#1C1618] line-clamp-1 group-hover:text-[#4A0E17] transition-colors">
                              {prod.title}
                            </h4>
                            <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                              {prod.description}
                            </p>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                            <span className="text-[10px] text-stone-700 truncate">by {prod.store}</span>
                            <div className="flex items-center gap-1.5">
                              {onSelectProduct && (
                                <button
                                  onClick={() => {
                                    onSelectProduct(prod)
                                    onClose()
                                  }}
                                  className="text-[10px] uppercase tracking-wider font-bold text-[#4A0E17] hover:underline"
                                >
                                  Quick View
                                </button>
                              )}
                              <Link
                                to={`/product/${prod.id}`}
                                onClick={onClose}
                                className="text-[10px] uppercase tracking-wider font-bold bg-[#4A0E17] text-white px-2 py-0.5 hover:bg-[#380b12]"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div className="flex flex-col items-start">
              <div className="text-[10px] font-mono tracking-widest text-stone-700 uppercase mb-1">
                Vessli Copilot
              </div>
              <div className="bg-[#F2ECE1] border border-[#E0D8CB] p-3 text-xs text-stone-600 flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#4A0E17] animate-ping"></span>
                <span>Synthesizing recommendations from catalog...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Starter Prompts */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-[#E6E0D6] bg-[#FAF7F2]">
            <div className="text-[11px] font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">
              Suggested Questions:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="text-xs bg-white hover:bg-[#F2ECE1] border border-[#E6E0D6] hover:border-[#4A0E17] text-stone-700 px-2.5 py-1 text-left transition-colors text-ellipsis"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#E6E0D6]">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot (e.g. 'I need a financial tracker for my agency')..."
              className="flex-1 bg-[#FAF7F2] border border-[#D9D0C3] focus:border-[#4A0E17] focus:bg-white text-sm px-3.5 py-2.5 text-[#1C1618] outline-none transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#4A0E17] hover:bg-[#380b12] disabled:opacity-50 text-white px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <span>Send</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-700 px-1">
            <span>Powered by Gemini 3.8 Flash server-side engine</span>
            <span>Instant delivery on all verified digital assets</span>
          </div>
        </div>
      </div>
    </div>
  )
}
