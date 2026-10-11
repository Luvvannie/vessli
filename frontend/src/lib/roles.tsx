import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'

export type UserRole = 'buyer' | 'seller' | 'admin'

interface RoleContextType {
  currentRole: UserRole
  setRole: (role: UserRole) => void
  hasAdminAccess: boolean
  hasSellerProfile: boolean
  hasBuyerProfile: boolean
  sellerProfile: { id: string; store_name: string; bio?: string } | null
  loading: boolean
  activateBuyerProfile: () => Promise<boolean>
  activateSellerProfile: (storeName: string, bio?: string) => Promise<boolean>
}

const RoleContext = createContext<RoleContextType>({
  currentRole: 'buyer',
  setRole: () => {},
  hasAdminAccess: false,
  hasSellerProfile: false,
  hasBuyerProfile: false,
  sellerProfile: null,
  loading: true,
  activateBuyerProfile: async () => false,
  activateSellerProfile: async () => false,
})

export function RoleProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const [hasSellerProfile, setHasSellerProfile] = useState(false)
  const [hasBuyerProfile, setHasBuyerProfile] = useState(false)
  const [sellerProfile, setSellerProfile] = useState<{ id: string; store_name: string; bio?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const email = session?.user?.email?.toLowerCase().trim() || ''
  
  // Platform Manager: Strictly restricted to platform operator alone
  const hasAdminAccess = Boolean(
    session?.user?.user_metadata?.is_admin === true ||
    session?.user?.user_metadata?.role === 'admin' ||
    email === 'annabelijeoma18@gmail.com' ||
    email === 'admin@vessli.shop'
  )

  const [currentRole, setCurrentRoleState] = useState<UserRole>('buyer')

  useEffect(() => {
    let isMounted = true

    if (authLoading) return

    if (!session) {
      setHasSellerProfile(false)
      setHasBuyerProfile(false)
      setSellerProfile(null)
      setCurrentRoleState('buyer')
      setLoading(false)
      return
    }

    async function evaluateProfiles() {
      try {
        const metadata = session?.user?.user_metadata || {}
        const isRegisteredBuyer = metadata.role === 'buyer' || metadata.is_buyer === true
        const isRegisteredSeller = metadata.role === 'seller' || metadata.is_seller === true

        // 1. Check seller profile in Supabase
        const { data: sData } = await supabase
          .from('seller_profiles')
          .select('id, store_name, bio')
          .eq('user_id', session!.user.id)
          .maybeSingle()

        if (!isMounted) return

        const sellerFound = Boolean(sData || isRegisteredSeller || (hasAdminAccess && email === 'annabelijeoma18@gmail.com'))
        setHasSellerProfile(sellerFound)
        if (sData) {
          setSellerProfile(sData)
        } else if (sellerFound) {
          setSellerProfile({
            id: 'seller-' + session!.user.id.slice(0, 8),
            store_name: metadata.store_name || 'Creator Studio',
            bio: metadata.bio || 'Digital creator storefront',
          })
        } else {
          setSellerProfile(null)
        }

        // 2. Check buyer profile capability:
        // A user has buyer access if they explicitly registered as a buyer OR
        // if they activated the buyer profile (`metadata.is_buyer === true`).
        // Pure creators who only registered as a creator do NOT have buyer access by default.
        const buyerFound = Boolean(
          isRegisteredBuyer ||
          metadata.has_buyer_profile === true ||
          (!isRegisteredSeller && !sData) // Regular users without seller record default to buyers
        )
        setHasBuyerProfile(buyerFound)

        // 3. Determine active role safely
        const savedRole = localStorage.getItem('vessli_active_role') as UserRole | null
        if (hasAdminAccess && savedRole === 'admin') {
          setCurrentRoleState('admin')
        } else if (sellerFound && (!buyerFound || savedRole === 'seller')) {
          setCurrentRoleState('seller')
        } else {
          setCurrentRoleState('buyer')
        }
      } catch {
        if (isMounted) {
          setHasSellerProfile(false)
          setHasBuyerProfile(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    evaluateProfiles()

    return () => {
      isMounted = false
    }
  }, [session, authLoading, hasAdminAccess, email])

  const setRole = (newRole: UserRole) => {
    // Strictly prevent unauthorized elevation
    if (newRole === 'admin' && !hasAdminAccess) {
      console.warn('Unauthorized attempt to switch to admin role blocked.')
      return
    }
    if (newRole === 'seller' && !hasSellerProfile) {
      console.warn('Buyer cannot switch to Creator mode without a registered seller profile.')
      return
    }
    if (newRole === 'buyer' && !hasBuyerProfile) {
      console.warn('Creator cannot switch to Buyer mode without activating a buyer profile.')
      return
    }

    setCurrentRoleState(newRole)
    localStorage.setItem('vessli_active_role', newRole)
  }

  // Allow a creator to activate a buyer profile so they can purchase items too
  const activateBuyerProfile = async (): Promise<boolean> => {
    if (!session) return false
    try {
      const updatedMeta = {
        ...(session.user.user_metadata || {}),
        is_buyer: true,
        has_buyer_profile: true,
      }
      await supabase.auth.updateUser({ data: updatedMeta })
      setHasBuyerProfile(true)
      return true
    } catch {
      setHasBuyerProfile(true)
      return true
    }
  }

  // Allow a buyer to register and open a seller profile
  const activateSellerProfile = async (storeName: string, bio?: string): Promise<boolean> => {
    if (!session) return false
    try {
      const { data, error } = await supabase
        .from('seller_profiles')
        .insert({
          user_id: session.user.id,
          store_name: storeName.trim(),
          bio: bio?.trim() || null,
        })
        .select('id, store_name, bio')
        .single()

      if (!error && data) {
        setSellerProfile(data)
        setHasSellerProfile(true)
        await supabase.auth.updateUser({
          data: {
            ...(session.user.user_metadata || {}),
            is_seller: true,
            store_name: storeName.trim(),
          },
        })
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setRole,
        hasAdminAccess,
        hasSellerProfile,
        hasBuyerProfile,
        sellerProfile,
        loading: authLoading || loading,
        activateBuyerProfile,
        activateSellerProfile,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}

