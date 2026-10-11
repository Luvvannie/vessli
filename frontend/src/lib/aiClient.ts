// Client-side API caller for server-side Gemini endpoints

export interface ChatMessage {
  id: string
  role: 'user' | 'model'
  text: string
  timestamp: number
  recommendedIds?: string[]
}

export interface GeneratedListing {
  title: string
  description: string
  category: 'Ebooks' | 'Templates' | 'Planners' | 'Design'
  format: 'PDF' | 'Notion' | 'Figma' | 'Canva' | 'Sheets' | 'ZIP'
  price_kobo: number
  price: string
  highlights: string[]
  tags: string[]
}

export interface ListingAudit {
  quality_score: number
  verdict: 'approved_recommended' | 'needs_improvement' | 'caution'
  readability: 'high' | 'medium' | 'low'
  pricing_analysis: string
  strengths: string[]
  recommendations: string[]
  copyright_risk: 'low' | 'moderate' | 'high'
  copyright_notes?: string
}

export interface RecommendedBundle {
  bundle_title: string
  complementary_ids: string[]
  discount_percent: number
  rationale: string
}

export async function sendAIChatMessage(
  message: string,
  history: { role: string; text: string }[] = [],
  catalog?: any[]
): Promise<{ reply: string; recommendedIds: string[]; model?: string }> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, catalog }),
  })
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.statusText}`)
  }
  return res.json()
}

export async function requestAIGenerateListing(params: {
  prompt: string
  category?: string
  format?: string
  targetAudience?: string
}): Promise<GeneratedListing> {
  const res = await fetch('/api/ai/generate-listing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    throw new Error(`Generate listing API error: ${res.statusText}`)
  }
  const data = await res.json()
  return data.listing
}

export async function requestAIAuditListing(params: {
  title: string
  description: string
  category: string
  price: string
  format?: string
}): Promise<ListingAudit> {
  const res = await fetch('/api/ai/audit-listing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    throw new Error(`Audit listing API error: ${res.statusText}`)
  }
  const data = await res.json()
  return data.audit
}

export async function requestAIRecommendBundles(
  productId: string,
  catalog?: any[]
): Promise<RecommendedBundle> {
  const res = await fetch('/api/ai/recommend-bundles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, catalog }),
  })
  if (!res.ok) {
    throw new Error(`Bundle recommendations API error: ${res.statusText}`)
  }
  const data = await res.json()
  return data.bundle
}
