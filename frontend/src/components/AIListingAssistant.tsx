import { useState } from 'react'
import {
  requestAIGenerateListing,
  requestAIAuditListing,
  type GeneratedListing,
  type ListingAudit,
} from '../lib/aiClient'

interface AIListingAssistantProps {
  currentForm: {
    title: string
    description: string
    category: string
    price: string
    format?: string
  }
  onApplyGenerated: (data: Partial<GeneratedListing>) => void
}

export function AIListingAssistant({ currentForm, onApplyGenerated }: AIListingAssistantProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'audit'>('generate')

  // Generator state
  const [prompt, setPrompt] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<GeneratedListing | null>(null)
  const [genError, setGenError] = useState('')

  // Auditor state
  const [auditing, setAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState<ListingAudit | null>(null)
  const [auditError, setAuditError] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return
    setGenerating(true)
    setGenError('')
    try {
      const res = await requestAIGenerateListing({
        prompt: prompt.trim(),
        category: currentForm.category,
        format: currentForm.format,
        targetAudience: targetAudience.trim() || undefined,
      })
      setGeneratedResult(res)
    } catch (err: any) {
      setGenError(err?.message || 'Failed to generate listing with AI')
    } finally {
      setGenerating(false)
    }
  }

  const handleAudit = async () => {
    if (auditing) return
    setAuditing(true)
    setAuditError('')
    try {
      const res = await requestAIAuditListing({
        title: currentForm.title,
        description: currentForm.description,
        category: currentForm.category,
        price: currentForm.price,
        format: currentForm.format,
      })
      setAuditResult(res)
    } catch (err: any) {
      setAuditError(err?.message || 'Failed to audit listing')
    } finally {
      setAuditing(false)
    }
  }

  return (
    <div className="bg-[#FAF7F2] border border-[#E0D8CB] p-4 sm:p-5 mb-6 text-[#1C1618]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#E0D8CB] gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 bg-[#4A0E17] text-[#D4AF37] text-xs font-bold flex items-center justify-center">
            AI
          </span>
          <h3 className="font-serif font-bold text-sm tracking-tight text-[#4A0E17]">
            Vessli Creator AI Studio
          </h3>
          <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 bg-[#4A0E17]/10 text-[#4A0E17] border border-[#4A0E17]/20">
            Copilot
          </span>
        </div>

        {/* Tab switch */}
        <div className="flex border border-[#D9D0C3] bg-white text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`px-3 py-1 font-medium transition-colors ${
              activeTab === 'generate'
                ? 'bg-[#4A0E17] text-white'
                : 'text-stone-600 hover:text-black hover:bg-stone-50'
            }`}
          >
            Magic Listing Generator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 font-medium transition-colors ${
              activeTab === 'audit'
                ? 'bg-[#4A0E17] text-white'
                : 'text-stone-600 hover:text-black hover:bg-stone-50'
            }`}
          >
            Pre-flight Quality Audit
          </button>
        </div>
      </div>

      {activeTab === 'generate' ? (
        <div className="space-y-4">
          <p className="text-xs text-stone-600">
            Describe your digital product idea in a sentence or two. Gemini will generate an optimized title, high-converting description, recommended pricing in Naira, format, and bullet highlights.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Your Product Idea / Outline
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 50 modern aesthetic Instagram carousel templates for real estate agents in Canva"
                className="w-full bg-white border border-[#D9D0C3] focus:border-[#4A0E17] text-xs px-3 py-2 text-[#1C1618] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Target Audience (Optional)
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Realtors, freelancers"
                className="w-full bg-white border border-[#D9D0C3] focus:border-[#4A0E17] text-xs px-3 py-2 text-[#1C1618] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-stone-500">
              {genError && <span className="text-red-600">{genError}</span>}
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="bg-[#4A0E17] hover:bg-[#380b12] disabled:opacity-50 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5"
            >
              {generating ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent animate-spin inline-block"></span>
                  <span>Generating Listing...</span>
                </>
              ) : (
                <>
                  <span>Generate with AI</span>
                  <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Preview */}
          {generatedResult && (
            <div className="mt-4 p-4 bg-white border border-[#D9D0C3] animate-in fade-in space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A0E17] flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#D4AF37] inline-block"></span>
                  Generated Proposal
                </span>
                <button
                  type="button"
                  onClick={() => onApplyGenerated(generatedResult)}
                  className="bg-[#D4AF37] hover:bg-[#c49f27] text-[#1C1618] px-3 py-1 font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
                >
                  Apply to Product Form &darr;
                </button>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-700 uppercase">Title</span>
                <p className="font-serif font-bold text-sm text-[#1C1618]">{generatedResult.title}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-stone-700 uppercase">Category</span>
                  <p className="font-semibold">{generatedResult.category}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-700 uppercase">Format</span>
                  <p className="font-semibold">{generatedResult.format}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-700 uppercase">Suggested Price</span>
                  <p className="font-semibold text-[#4A0E17]">{generatedResult.price}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-700 uppercase">Description</span>
                <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line mt-0.5">
                  {generatedResult.description}
                </p>
              </div>

              {generatedResult.highlights && generatedResult.highlights.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-stone-700 uppercase">Key Deliverables</span>
                  <ul className="text-xs text-stone-700 list-disc list-inside mt-0.5 space-y-0.5">
                    {generatedResult.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Quality Audit Tab */
        <div className="space-y-4">
          <p className="text-xs text-stone-600">
            Verify your product's headline clarity, pricing viability, and policy compliance before submission. Our pre-flight auditor inspects the fields currently entered into the form.
          </p>

          <div className="flex items-center justify-between">
            <div className="text-xs text-stone-500">
              Current draft: <span className="font-semibold text-stone-800">"{currentForm.title || 'Untitled'}"</span> (
              {currentForm.price || 'No price'})
            </div>
            <button
              type="button"
              onClick={handleAudit}
              disabled={auditing || !currentForm.title}
              className="bg-[#1C1618] hover:bg-black disabled:opacity-50 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5"
            >
              {auditing ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent animate-spin inline-block"></span>
                  <span>Auditing Listing...</span>
                </>
              ) : (
                <>
                  <span>Run Pre-flight Audit</span>
                  <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {auditError && <p className="text-xs text-red-600">{auditError}</p>}

          {auditResult && (
            <div className="mt-4 p-4 bg-white border border-[#D9D0C3] animate-in fade-in space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4A0E17]">
                    Audit Score:
                  </span>
                  <span className="text-base font-serif font-bold text-[#4A0E17]">
                    {auditResult.quality_score}/100
                  </span>
                  <span
                    className={`text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 font-bold ${
                      auditResult.verdict === 'approved_recommended'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {auditResult.verdict.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-700">
                  Copyright Risk: <span className="font-bold text-stone-800 uppercase">{auditResult.copyright_risk}</span>
                </span>
              </div>

              <div className="text-xs">
                <span className="text-[10px] font-mono text-stone-700 uppercase">Pricing Assessment</span>
                <p className="text-stone-700 mt-0.5">{auditResult.pricing_analysis}</p>
              </div>

              {auditResult.strengths && auditResult.strengths.length > 0 && (
                <div className="text-xs">
                  <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold">Strengths</span>
                  <ul className="text-stone-700 list-disc list-inside mt-0.5 space-y-0.5">
                    {auditResult.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                <div className="text-xs">
                  <span className="text-[10px] font-mono text-amber-700 uppercase font-bold">Recommendations</span>
                  <ul className="text-stone-700 list-disc list-inside mt-0.5 space-y-0.5">
                    {auditResult.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
