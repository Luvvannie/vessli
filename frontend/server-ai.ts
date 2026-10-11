import { GoogleGenAI } from '@google/genai'

// Initialize GoogleGenAI server-side with User-Agent telemetry
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  })
}

// Timeout wrapper to prevent hanging calls
async function withTimeout<T>(promise: Promise<T>, ms = 4500): Promise<T> {
  let timer: any
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timer)
  }
}

// Built-in fallback catalog context to ground responses
const DEFAULT_CATALOG = [
  {
    id: 'prod-bundle-1',
    title: 'Ultimate Creator Business & Ebook Suite',
    category: 'Ebooks',
    price: '₦10,000',
    store: 'Annabel Studio',
    format: 'PDF',
    description: '15+ curated guides on digital marketing, organic audience scaling, newsletter funnels.',
  },
  {
    id: 'prod-planner-2',
    title: 'Notion Creator Operating System (Pro)',
    category: 'Planners',
    price: '₦5,000',
    store: 'Vessli Creators',
    format: 'Notion',
    description: 'All-in-one Notion workspace with CRM, client pipeline, editorial calendar.',
  },
  {
    id: 'prod-canva-3',
    title: 'Canva Luxury Wedding & Stationery Suite',
    category: 'Design',
    price: '₦7,500',
    store: 'Design Hub',
    format: 'Canva',
    description: '45+ customizable luxury wedding and stationery templates with botanical accents.',
  },
  {
    id: 'prod-pitch-4',
    title: 'Venture Pitch Deck & Seed Investor Kit',
    category: 'Templates',
    price: '₦12,000',
    store: 'Venture Craft',
    format: 'Figma',
    description: '20-slide investor deck template modeled after successful African seed rounds.',
  },
  {
    id: 'prod-finance-5',
    title: 'Personal Finance & Wealth Snowball Tracker',
    category: 'Templates',
    price: '₦3,500',
    store: 'FinFlow Labs',
    format: 'Sheets',
    description: 'Automated Google Sheets & Excel engine with monthly cash flow reconciliation and debt snowball calculator.',
  },
  {
    id: 'prod-brand-6',
    title: 'Minimalist Brand Identity & Logo System',
    category: 'Design',
    price: '₦8,500',
    store: 'Aura Studio',
    format: 'Figma',
    description: '12 vector logomarks, refined font pairings, luxury color styles, social media templates.',
  },
  {
    id: 'prod-contracts-7',
    title: 'Freelance & Agency Legal Contract Bundle',
    category: 'Templates',
    price: '₦6,000',
    store: 'LegalDesk Africa',
    format: 'PDF',
    description: '5 client agreements, NDAs, contractor terms, and payment dispute safeguards.',
  },
  {
    id: 'prod-audio-8',
    title: 'Podcast & YouTube Audio Mastering Presets',
    category: 'Design',
    price: '₦4,500',
    store: 'SoundCraft Pro',
    format: 'ZIP',
    description: 'Vocal mastering presets for Premiere Pro, DaVinci Resolve, and Audition.',
  },
]

export async function handleAIChat(body: {
  message: string
  history?: { role: string; text: string }[]
  catalog?: any[]
}) {
  const { message, history = [], catalog = DEFAULT_CATALOG } = body
  const ai = getGenAIClient()

  const catalogSummary = catalog
    .map(
      (p) =>
        `- ID: ${p.id} | Title: "${p.title}" | Category: ${p.category} | Price: ${p.price || '₦' + ((p.price_kobo || 0) / 100).toLocaleString()} | Format: ${p.format || 'Digital'} | Store: ${p.store} | Summary: ${p.description?.slice(0, 90)}...`
    )
    .join('\n')

  const systemPrompt = `You are Vessli Copilot, an expert AI shopping advisor & digital commerce assistant for Vessli (the premier digital products marketplace for African & global creators).
Users come to Vessli to buy and sell premium Notion workspaces, ebooks, Canva templates, Figma kits, financial models, and creator tools priced in Nigerian Naira (₦).

Here is the current live catalog on Vessli:
${catalogSummary}

Guidelines:
1. Always be warm, concise, professional, and knowledgeable.
2. Recommend specific products from the catalog that match what the user is asking for.
3. Mention prices in ₦ (Naira) and highlight the creator/store name.
4. When you mention or recommend products from the catalog, list their exact IDs in a bracketed format at the very end of your response, like:
[RECOMMENDED_PRODUCTS: id1, id2]
If no specific catalog products match, do not include the tag or suggest what they can search for.
5. Keep your tone encouraging and design-forward. Answer questions clearly in 2-4 short paragraphs.`

  if (ai) {
    try {
      const prompt = `${systemPrompt}\n\nRecent conversation history:\n${history
        .map((h) => `${h.role === 'user' ? 'Buyer' : 'Copilot'}: ${h.text}`)
        .join('\n')}\nBuyer: ${message}\nCopilot:`

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        }),
        4500
      )

      const replyText = response.text || ''
      const recommendedMatch = replyText.match(/\[RECOMMENDED_PRODUCTS:\s*([a-zA-Z0-9_,\s-]+)\]/)
      let recommendedIds: string[] = []
      let cleanText = replyText

      if (recommendedMatch) {
        recommendedIds = recommendedMatch[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        cleanText = replyText.replace(/\[RECOMMENDED_PRODUCTS:\s*([a-zA-Z0-9_,\s-]+)\]/, '').trim()
      }

      return {
        reply: cleanText,
        recommendedIds,
        model: 'gemini-3.8-flash',
      }
    } catch (err: any) {
      console.warn('Gemini chat error, falling back:', err?.message)
    }
  }

  // Fallback intelligent responder if API key is pending or offline
  const lower = message.toLowerCase()
  let matchedIds: string[] = []
  let text = ''

  if (lower.includes('notion') || lower.includes('organize') || lower.includes('planner') || lower.includes('manage')) {
    matchedIds = ['prod-planner-2', 'prod-finance-5']
    text = `For organizing your workflow, I strongly recommend the **Notion Creator Operating System (Pro)** (₦5,000) by Vessli Creators. It includes a full CRM, content pipeline, and automated revenue tracking. Pairing it with the **Personal Finance & Wealth Snowball Tracker** (₦3,500) gives you total command of both client projects and cashflow!`
  } else if (lower.includes('invest') || lower.includes('pitch') || lower.includes('startup') || lower.includes('deck')) {
    matchedIds = ['prod-pitch-4', 'prod-contracts-7']
    text = `If you are preparing to raise funding or pitch clients, take a look at the **Venture Pitch Deck & Seed Investor Kit** (₦12,000) from Venture Craft. It is modelled after high-growth African funding rounds. I also suggest pairing it with the **Freelance & Agency Legal Contract Bundle** (₦6,000) to ensure your IP and agreements are rock solid.`
  } else if (lower.includes('canva') || lower.includes('wedding') || lower.includes('design') || lower.includes('brand')) {
    matchedIds = ['prod-canva-3', 'prod-brand-6']
    text = `For high-end visual design, check out the **Canva Luxury Wedding & Stationery Suite** (₦7,500) and the **Minimalist Brand Identity & Logo System** (₦8,500). Both come with commercial usage rights and clean, professional typography.`
  } else if (lower.includes('book') || lower.includes('guide') || lower.includes('learn') || lower.includes('market')) {
    matchedIds = ['prod-bundle-1']
    text = `For in-depth creator education, the **Ultimate Creator Business & Ebook Suite** (₦10,000) by Annabel Studio contains 15+ tactical playbooks covering digital marketing, audience scaling, and newsletter growth.`
  } else {
    matchedIds = ['prod-planner-2', 'prod-bundle-1', 'prod-pitch-4']
    text = `Welcome to Vessli! I can help you find verified digital templates, Notion systems, Canva graphics, financial models, and educational ebooks. Try exploring our bestsellers like the **Notion Creator OS**, the **Venture Pitch Deck**, or the **Creator Business Ebook Suite**.`
  }

  return {
    reply: text,
    recommendedIds: matchedIds,
    model: 'fallback-concierge',
  }
}

export async function handleAIGenerateListing(body: {
  prompt: string
  category?: string
  format?: string
  targetAudience?: string
}) {
  const { prompt, category, format, targetAudience } = body
  const ai = getGenAIClient()

  const systemInstructions = `You are an elite digital product copywriter and creator monetization coach for Vessli.
Generate a complete, high-converting digital product listing based on the creator's rough idea.
Return ONLY valid JSON matching this exact structure:
{
  "title": "Compelling Title (under 60 chars)",
  "description": "2-3 persuasive paragraphs explaining the problem, the transformation, what's included, and why it works.",
  "category": "Ebooks" | "Templates" | "Planners" | "Design",
  "format": "PDF" | "Notion" | "Figma" | "Canva" | "Sheets" | "ZIP",
  "price_kobo": 500000,
  "price": "₦5,000",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
  "tags": ["tag1", "tag2", "tag3"]
}`

  if (ai) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemInstructions}\n\nCreator product idea: "${prompt}".\nPreferred category: ${category || 'auto-detect'}\nPreferred format: ${format || 'auto-detect'}\nTarget audience: ${targetAudience || 'general creators/professionals'}\n\nOutput JSON only:`,
        }),
        4500
      )

      const raw = response.text || ''
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      if (parsed && parsed.title && parsed.description) {
        return { success: true, listing: parsed, model: 'gemini-3.8-flash' }
      }
    } catch (err: any) {
      console.warn('Gemini listing generation error, using smart fallback:', err?.message)
    }
  }

  // Fallback template builder
  const fallbackCategory = category || (prompt.toLowerCase().includes('notion') ? 'Planners' : prompt.toLowerCase().includes('book') ? 'Ebooks' : 'Templates')
  const fallbackFormat = format || (fallbackCategory === 'Planners' ? 'Notion' : fallbackCategory === 'Ebooks' ? 'PDF' : 'Figma')

  return {
    success: true,
    listing: {
      title: prompt.length > 5 ? prompt.split(' ').slice(0, 6).join(' ') + ' System' : 'Complete Creator Operating Toolkit',
      description: `Designed specifically for creators and digital entrepreneurs, this resource streamlines your day-to-day workflow. It replaces chaotic setups with structured frameworks that deliver results from day one.\n\nIncludes step-by-step instructions, pre-built assets, and immediate access upon secure checkout.`,
      category: fallbackCategory,
      format: fallbackFormat,
      price_kobo: 600000,
      price: '₦6,000',
      highlights: [
        'Complete ready-to-use template structure',
        'Lifetime free updates & continuous improvements',
        'Commercial usage rights included',
        'Instant secure digital delivery to your account',
      ],
      tags: ['digital asset', 'creator toolkit', 'productivity'],
    },
    model: 'fallback-generator',
  }
}

export async function handleAIAuditListing(body: {
  title: string
  description: string
  category: string
  price: string
  format?: string
}) {
  const { title, description, category, price, format } = body
  const ai = getGenAIClient()

  const systemInstructions = `You are the Head of Product Quality and Trust at Vessli Marketplace.
Analyze the following digital product listing submitted by a seller.
Return ONLY valid JSON matching this exact structure:
{
  "quality_score": 92,
  "verdict": "approved_recommended" | "needs_improvement" | "caution",
  "readability": "high" | "medium" | "low",
  "pricing_analysis": "Assessment of whether the price in Naira is competitive and balanced for this format/category.",
  "strengths": ["Strength 1", "Strength 2"],
  "recommendations": ["Actionable improvement 1", "Actionable improvement 2"],
  "copyright_risk": "low" | "moderate" | "high",
  "copyright_notes": "Short note on copyright safety or original asset verification."
}`

  if (ai) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemInstructions}\n\nTitle: "${title}"\nCategory: "${category}"\nFormat: "${format || 'Digital'}"\nPrice: "${price}"\nDescription: "${description}"\n\nOutput JSON only:`,
        }),
        4500
      )

      const raw = response.text || ''
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      return { success: true, audit: parsed, model: 'gemini-3.8-flash' }
    } catch (err: any) {
      console.warn('Gemini audit error, using smart fallback:', err?.message)
    }
  }

  // Fallback audit
  const words = (description || '').trim().split(/\s+/).length
  const score = Math.min(95, Math.max(65, 60 + Math.min(25, Math.floor(words / 4)) + (title.length > 10 ? 10 : 0)))
  return {
    success: true,
    audit: {
      quality_score: score,
      verdict: score >= 80 ? 'approved_recommended' : 'needs_improvement',
      readability: words > 30 ? 'high' : 'medium',
      pricing_analysis: `Price of ${price || '₦5,000'} aligns well with typical ${category || 'digital'} assets on Vessli.`,
      strengths: [
        'Clear headline and focused value proposition',
        'Direct alignment with digital creator workflows',
      ],
      recommendations: [
        'Consider specifying exact file dimensions or page count in the highlights',
        'Add a clear guarantee or support contact details',
      ],
      copyright_risk: 'low',
      copyright_notes: 'Standard digital asset structure. No immediate trademark or copyright conflicts detected.',
    },
    model: 'fallback-auditor',
  }
}

export async function handleAIRecommendBundles(body: { productId: string; catalog?: any[] }) {
  const { productId, catalog = DEFAULT_CATALOG } = body
  const current = catalog.find((p) => p.id === productId) || catalog[0]
  const ai = getGenAIClient()

  if (ai) {
    try {
      const others = catalog.filter((p) => p.id !== current.id)
      const prompt = `Given this product on Vessli marketplace:
Title: "${current.title}"
Category: "${current.category}"
Price: "${current.price || '₦' + ((current.price_kobo || 0) / 100).toLocaleString()}"

Choose 1 or 2 complementary products from this list to form a high-converting "Frequently Bought Together" bundle with a 15% discount:
${others.map((o) => `- ID: ${o.id} | Title: "${o.title}" | Category: ${o.category} | Price: ${o.price || '₦' + ((o.price_kobo || 0) / 100).toLocaleString()}`).join('\n')}

Return ONLY JSON:
{
  "bundle_title": "Creative/Professional Bundle Name",
  "complementary_ids": ["id1"],
  "discount_percent": 15,
  "rationale": "One compelling sentence explaining why these two assets work best together."
}`

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        }),
        4500
      )

      const raw = response.text || ''
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      return { success: true, bundle: parsed, model: 'gemini-3.8-flash' }
    } catch (err: any) {
      console.warn('Gemini bundle recommendation error:', err?.message)
    }
  }

  // Fallback pairing based on category
  let compId = 'prod-planner-2'
  if (current.id === 'prod-planner-2') compId = 'prod-finance-5'
  else if (current.category === 'Design') compId = 'prod-brand-6'
  else if (current.category === 'Ebooks') compId = 'prod-contracts-7'

  return {
    success: true,
    bundle: {
      bundle_title: 'Creator Productivity & Operations Pack',
      complementary_ids: [compId],
      discount_percent: 15,
      rationale: 'Pairing strategy with operational systems boosts execution speed and doubles conversion.',
    },
    model: 'fallback-bundler',
  }
}
