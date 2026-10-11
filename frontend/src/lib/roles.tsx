import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'

export type UserRole = 'buyer' | 'seller' | 'admin'

interface RoleContextType {
  currentRole: UserRole
  setRole: (role: UserRole) => void
  hasAdminAccess: boolean
  hasSellerProfile: boolean
  sellerProfile: { id: string; store_name: string; bio?: string } | null
  loading: boolean
}

const RoleContext = createContext<RoleContextType>({
  currentRole: 'buyer',
  setRole: () => {},
  hasAdminAccess: false,
  hasSellerProfile: false,
  sellerProfile: null,
  loading: true,
})

export function RoleProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('vessli_active_role') as UserRole | null
    return saved === 'admin' || saved === 'seller' || saved === 'buyer' ? saved : 'buyer'
  })
  const [hasSellerProfile, setHasSellerProfile] = useState(false)
  const [sellerProfile, setSellerProfile] = useState<{ id: string; store_name: string; bio?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const email = session?.user?.email || ''
  const hasAdminAccess = Boolean(
    session?.user?.user_metadata?.is_admin ||
    email === 'annabelijeoma18@gmail.com' ||
    email === 'admin@vessli.shop'
  )

  useEffect(() => {
    let isMounted = true

    if (authLoading || !session) {
      return
    }

    async function checkSeller() {
      try {
        const { data } = await supabase
          .from('seller_profiles')
          .select('id, store_name, bio')
          .eq('user_id', session!.user.id)
          .maybeSingle()

        if (isMounted) {
          if (data) {
            setHasSellerProfile(true)
            setSellerProfile(data)
          } else {
            setHasSellerProfile(false)
            setSellerProfile(null)
          }
        }
      } catch {
        if (isMounted) {
          setHasSellerProfile(false)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkSeller()

    return () => {
      isMounted = false
    }
  }, [session, authLoading])

  const setRole = (newRole: UserRole) => {
    setCurrentRoleState(newRole)
    localStorage.setItem('vessli_active_role', newRole)
  }

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setRole,
        hasAdminAccess,
        hasSellerProfile,
        sellerProfile,
        loading: authLoading || loading,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
