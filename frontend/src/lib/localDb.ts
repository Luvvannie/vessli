// Local fallback storage for preview & development when Supabase keys are not configured.
// Persists in localStorage so auth, products, orders, and ledger behave like a real backend.

import type { Session, User } from '@supabase/supabase-js'
import { FALLBACK_PRODUCTS } from './products'

export const DEMO_SELLER_ID = '11111111-1111-4111-8111-111111111111'
export const DEMO_BUYER_ID = '22222222-2222-4222-8222-222222222222'
export const DEMO_ADMIN_ID = '00000000-0000-4000-8000-000000000001'

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function initStorage() {
  if (!localStorage.getItem('vessli_initialized')) {
    // Initial users
    const users: Record<string, { id: string; email: string; password?: string; full_name: string; is_admin?: boolean }> = {
      'annabel@vessli.shop': {
        id: DEMO_SELLER_ID,
        email: 'annabel@vessli.shop',
        password: 'password123',
        full_name: 'Annabel Ijeoma',
      },
      'buyer@vessli.shop': {
        id: DEMO_BUYER_ID,
        email: 'buyer@vessli.shop',
        password: 'password123',
        full_name: 'Kelechi Okafor',
      },
      'admin@vessli.shop': {
        id: DEMO_ADMIN_ID,
        email: 'admin@vessli.shop',
        password: 'password123',
        full_name: 'Vessli Admin',
        is_admin: true,
      },
    }

    // Initial sellers
    const sellers: Record<string, any> = {
      [DEMO_SELLER_ID]: {
        id: 'seller-annabel',
        user_id: DEMO_SELLER_ID,
        store_name: 'Annabel Studio',
        bio: 'Bestselling author and template creator. Publishing high-converting Notion and design assets.',
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    }

    // Initial products
    const products = [
      ...FALLBACK_PRODUCTS.map((p) => ({
        id: p.id,
        seller_id: 'seller-annabel',
        title: p.title,
        description: p.description,
        category: p.category,
        price_kobo: p.price_kobo,
        currency: 'NGN',
        cover_s3_key: p.cover_s3_key || null,
        status: p.status,
        rejection_reason: null,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      })),
      {
        id: 'prod-pending-7',
        seller_id: 'seller-annabel',
        title: 'Freelance Contract & Invoice Toolkit',
        description: 'Comprehensive legal contract agreements, proposal templates, and client onboarding forms formatted for Google Docs and Microsoft Word.',
        category: 'Business Resources',
        price_kobo: 600000,
        currency: 'NGN',
        cover_s3_key: null,
        status: 'pending_review',
        rejection_reason: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 'prod-rejected-8',
        seller_id: 'seller-annabel',
        title: 'Crypto Trading Alpha Bot Signals',
        description: 'Automated Telegram signal notifications.',
        category: 'Business Resources',
        price_kobo: 5000000,
        currency: 'NGN',
        cover_s3_key: null,
        status: 'rejected',
        rejection_reason: 'Automated signal services and speculative trading software are prohibited by Vessli marketplace policy.',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ]

    // Initial orders
    const orders = [
      {
        id: 'ord-vessli-001',
        buyer_id: DEMO_BUYER_ID,
        seller_id: 'seller-annabel',
        total_kobo: 1000000,
        currency: 'NGN',
        status: 'paid',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ]

    const orderItems = [
      {
        id: 'item-001',
        order_id: 'ord-vessli-001',
        product_id: 'prod-bundle-1',
        unit_price_kobo: 1000000,
        quantity: 1,
      },
    ]

    // Initial ledger
    const ledger = [
      {
        id: 'led-001',
        order_id: 'ord-vessli-001',
        seller_id: 'seller-annabel',
        gross_kobo: 1000000,
        commission_rate: 0.1,
        commission_kobo: 100000,
        seller_net_kobo: 900000,
        status: 'recorded',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ]

    localStorage.setItem('vessli_users', JSON.stringify(users))
    localStorage.setItem('vessli_sellers', JSON.stringify(sellers))
    localStorage.setItem('vessli_products', JSON.stringify(products))
    localStorage.setItem('vessli_orders', JSON.stringify(orders))
    localStorage.setItem('vessli_order_items', JSON.stringify(orderItems))
    localStorage.setItem('vessli_ledger', JSON.stringify(ledger))
    localStorage.setItem('vessli_initialized', 'true')
  }
}

initStorage()

function makeSession(user: { id: string; email: string; full_name?: string; is_admin?: boolean }): Session {
  const u: User = {
    id: user.id,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: user.full_name || user.email.split('@')[0], is_admin: Boolean(user.is_admin) },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: user.email,
  }
  return {
    access_token: `mock_jwt_${user.id}_${Date.now()}`,
    refresh_token: `mock_refresh_${user.id}`,
    expires_in: 3600,
    token_type: 'bearer',
    user: u,
  }
}

type AuthCallback = (event: string, session: Session | null) => void
const authListeners: Set<AuthCallback> = new Set()

export const mockAuth = {
  async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
    initStorage()
    const stored = localStorage.getItem('vessli_active_session')
    if (stored) {
      try {
        return { data: { session: JSON.parse(stored) }, error: null }
      } catch {
        localStorage.removeItem('vessli_active_session')
      }
    }
    return { data: { session: null }, error: null }
  },

  onAuthStateChange(callback: AuthCallback) {
    authListeners.add(callback)
    mockAuth.getSession().then(({ data }) => callback('INITIAL_SESSION', data.session))
    return {
      data: {
        subscription: {
          unsubscribe() {
            authListeners.delete(callback)
          },
        },
      },
    }
  },

  async signUp({ email, password }: { email: string; password?: string }): Promise<{ data: { user: User; session: Session }; error: null }> {
    initStorage()
    const users = JSON.parse(localStorage.getItem('vessli_users') || '{}')
    let user = users[email.toLowerCase()]
    if (!user) {
      user = {
        id: generateUUID(),
        email: email.toLowerCase(),
        password: password || 'password123',
        full_name: email.split('@')[0].replace(/[._]/g, ' '),
      }
      users[email.toLowerCase()] = user
      localStorage.setItem('vessli_users', JSON.stringify(users))
    }
    const session = makeSession(user)
    localStorage.setItem('vessli_active_session', JSON.stringify(session))
    authListeners.forEach((cb) => cb('SIGNED_IN', session))
    return { data: { user: session.user, session }, error: null }
  },

  async signInWithPassword({ email }: { email: string; password?: string }): Promise<{ data: { user: User; session: Session }; error: null }> {
    initStorage()
    const users = JSON.parse(localStorage.getItem('vessli_users') || '{}')
    let user = users[email.toLowerCase()]
    if (!user) {
      // Create user automatically on first login for smooth demo testing
      user = {
        id: generateUUID(),
        email: email.toLowerCase(),
        full_name: email.split('@')[0].replace(/[._]/g, ' '),
      }
      users[email.toLowerCase()] = user
      localStorage.setItem('vessli_users', JSON.stringify(users))
    }
    const session = makeSession(user)
    localStorage.setItem('vessli_active_session', JSON.stringify(session))
    authListeners.forEach((cb) => cb('SIGNED_IN', session))
    return { data: { user: session.user, session }, error: null }
  },

  async signOut(): Promise<{ error: null }> {
    localStorage.removeItem('vessli_active_session')
    authListeners.forEach((cb) => cb('SIGNED_OUT', null))
    return { error: null }
  },

  setPreconfiguredUser(role: 'seller' | 'buyer' | 'admin') {
    initStorage()
    const users = JSON.parse(localStorage.getItem('vessli_users') || '{}')
    const email =
      role === 'seller' ? 'annabel@vessli.shop' : role === 'admin' ? 'admin@vessli.shop' : 'buyer@vessli.shop'
    const user = users[email]
    if (user) {
      const session = makeSession(user)
      localStorage.setItem('vessli_active_session', JSON.stringify(session))
      authListeners.forEach((cb) => cb('SIGNED_IN', session))
    }
  },
}

// Fluent mock query builder for localStorage
export function createMockQueryBuilder(table: string) {
  initStorage()

  function getStore(): any[] {
    const raw = localStorage.getItem(`vessli_${table}`)
    if (!raw) {
      if (table === 'seller_profiles') {
        const s = localStorage.getItem('vessli_sellers')
        return s ? Object.values(JSON.parse(s)) : []
      }
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : Object.values(parsed)
  }

  function setStore(data: any[]) {
    if (table === 'seller_profiles') {
      const obj: Record<string, any> = {}
      data.forEach((item) => {
        obj[item.user_id || item.id] = item
      })
      localStorage.setItem('vessli_sellers', JSON.stringify(obj))
    } else {
      localStorage.setItem(`vessli_${table}`, JSON.stringify(data))
    }
  }

  let filters: ((item: any) => boolean)[] = []
  let sortFn: ((a: any, b: any) => number) | null = null
  let limitN: number | null = null

  const builder = {
    select(_columns = '*') {
      return builder
    },

    eq(column: string, value: any) {
      filters.push((item) => {
        if (column === 'seller_id' && item.seller_id) {
          return item.seller_id === value
        }
        return item[column] === value
      })
      return builder
    },

    order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
      sortFn = (a, b) => {
        const valA = a[column]
        const valB = b[column]
        if (valA < valB) return ascending ? -1 : 1
        if (valA > valB) return ascending ? 1 : -1
        return 0
      }
      return builder
    },

    limit(n: number) {
      limitN = n
      return builder
    },

    async maybeSingle() {
      const items = getStore().filter((item) => filters.every((fn) => fn(item)))
      return { data: items[0] || null, error: null }
    },

    async single() {
      const items = getStore().filter((item) => filters.every((fn) => fn(item)))
      return { data: items[0] || null, error: items.length > 0 ? null : { message: 'Not found' } }
    },

    // Promise interface when awaited directly
    async then(resolve: (res: { data: any; error: any }) => void) {
      let items = getStore().filter((item) => filters.every((fn) => fn(item)))
      if (sortFn) items.sort(sortFn)
      if (limitN !== null) items = items.slice(0, limitN)

      // Attach seller_profiles relation if table is products
      if (table === 'products') {
        const sellers = Object.values(JSON.parse(localStorage.getItem('vessli_sellers') || '{}')) as any[]
        items = items.map((p) => {
          const s = sellers.find((seller) => seller.id === p.seller_id || seller.user_id === p.seller_id)
          return {
            ...p,
            seller_profiles: s ? { store_name: s.store_name, bio: s.bio } : { store_name: 'Annabel Studio' },
          }
        })
      }

      resolve({ data: items, error: null })
    },

    insert(rowOrRows: any) {
      const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows]
      const current = getStore()
      const newItems = rows.map((r) => ({
        id: r.id || generateUUID(),
        created_at: new Date().toISOString(),
        ...r,
      }))
      setStore([...newItems, ...current])
      return {
        select() {
          return {
            single: async () => ({ data: newItems[0], error: null }),
            maybeSingle: async () => ({ data: newItems[0], error: null }),
            then: async (res: any) => res({ data: newItems, error: null }),
          }
        },
        single: async () => ({ data: newItems[0], error: null }),
        then: async (res: any) => res({ data: newItems, error: null }),
      }
    },

    update(patch: any) {
      return {
        eq(col: string, val: any) {
          const current = getStore()
          let updatedItem: any = null
          const updated = current.map((item) => {
            if (item[col] === val) {
              updatedItem = { ...item, ...patch, updated_at: new Date().toISOString() }
              return updatedItem
            }
            return item
          })
          setStore(updated)
          return {
            select() {
              return {
                single: async () => ({ data: updatedItem, error: null }),
                then: async (res: any) => res({ data: [updatedItem], error: null }),
              }
            },
            single: async () => ({ data: updatedItem, error: null }),
            then: async (res: any) => res({ data: [updatedItem], error: null }),
          }
        },
      }
    },
  }

  return builder
}
