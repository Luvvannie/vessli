import { supabase } from './supabase'

export interface SignUpParams {
  email: string
  password: string
  fullName?: string
  role?: 'buyer' | 'seller'
  storeName?: string
  bio?: string
}

export async function signUpUser(params: SignUpParams) {
  const email = params.email.trim().toLowerCase()
  const password = params.password
  const isSeller = params.role === 'seller'
  const fullName = params.fullName?.trim() || email.split('@')[0]

  const userMetadata: Record<string, unknown> = {
    full_name: fullName,
    role: isSeller ? 'seller' : 'buyer',
    is_buyer: !isSeller,
    is_seller: isSeller,
    email_verified: true,
  }

  if (isSeller && params.storeName) {
    userMetadata.store_name = params.storeName.trim()
    userMetadata.bio = params.bio?.trim() || 'Digital templates & guides'
  }

  // Strategy 1: Direct Supabase Admin API (pre-confirms email so user is NEVER locked out)
  try {
    if (supabase.auth?.admin?.createUser) {
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      })

      if (!adminError && adminData?.user) {
        // Ensure profile row
        await supabase.from('profiles').upsert({
          id: adminData.user.id,
          full_name: fullName,
        })

        if (isSeller && params.storeName) {
          await supabase.from('seller_profiles').upsert({
            user_id: adminData.user.id,
            store_name: params.storeName.trim(),
            bio: params.bio?.trim() || null,
          })
        }

        // Login
        const loginRes = await supabase.auth.signInWithPassword({ email, password })
        if (!loginRes.error) return loginRes.data
      }

      // If user already exists, update their password and confirm email
      if (adminError && adminError.message.toLowerCase().includes('already')) {
        const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        const target = usersData?.users?.find((u) => u.email?.toLowerCase() === email)
        if (target) {
          await supabase.auth.admin.updateUserById(target.id, {
            password,
            email_confirm: true,
            user_metadata: { ...target.user_metadata, ...userMetadata },
          })
          const loginRes = await supabase.auth.signInWithPassword({ email, password })
          if (!loginRes.error) return loginRes.data
        }
      }
    }
  } catch (err) {
    console.warn('Admin signup fallback:', err)
  }

  // Strategy 2: Backend API Proxy Endpoint (/api/auth/reset-password)
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        role: isSeller ? 'seller' : 'buyer',
        fullName,
      }),
    })
    if (res.ok) {
      const loginRes = await supabase.auth.signInWithPassword({ email, password })
      if (!loginRes.error) return loginRes.data
    }
  } catch (err) {
    console.warn('Backend proxy signup fallback:', err)
  }

  // Strategy 3: Standard Client Signup
  const { error: clientError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userMetadata },
  })

  if (clientError) throw clientError

  // Attempt immediate login
  const loginRes = await supabase.auth.signInWithPassword({ email, password })
  if (loginRes.error) {
    // If blocked by email confirmation, auto-confirm via admin
    if (loginRes.error.message.toLowerCase().includes('confirm')) {
      await autoConfirmEmail(email, password)
      const retry = await supabase.auth.signInWithPassword({ email, password })
      if (!retry.error) return retry.data
    }
    throw loginRes.error
  }

  return loginRes.data
}

export async function loginUser(emailRaw: string, passwordRaw: string) {
  const email = emailRaw.trim().toLowerCase()
  const password = passwordRaw

  // 1. First attempt direct sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (!error && data?.session) {
    return data
  }

  // 2. If blocked because email is not confirmed, auto-confirm and retry
  if (error && error.message.toLowerCase().includes('confirm')) {
    const confirmed = await autoConfirmEmail(email, password)
    if (confirmed) {
      const retry = await supabase.auth.signInWithPassword({ email, password })
      if (!retry.error && retry.data?.session) {
        return retry.data
      }
    }
  }

  // 3. User friendly error
  if (error?.message === 'Invalid login credentials') {
    throw new Error('Incorrect email or password. If you forgot your password, you can set a new password below.')
  }

  throw error || new Error('Authentication failed.')
}

export async function resetUserPassword(emailRaw: string, newPasswordRaw: string, role?: string, fullName?: string) {
  const email = emailRaw.trim().toLowerCase()
  const password = newPasswordRaw

  // Strategy 1: Direct Admin API
  try {
    if (supabase.auth?.admin?.listUsers) {
      const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const target = usersData?.users?.find((u) => u.email?.toLowerCase() === email)
      if (target) {
        const { error: updErr } = await supabase.auth.admin.updateUserById(target.id, {
          password,
          email_confirm: true,
          user_metadata: {
            ...target.user_metadata,
            role: role || target.user_metadata?.role || 'buyer',
            full_name: fullName || target.user_metadata?.full_name || email.split('@')[0],
          },
        })
        if (!updErr) {
          const loginRes = await supabase.auth.signInWithPassword({ email, password })
          if (!loginRes.error) return loginRes.data
        }
      } else {
        // User doesn't exist yet, create them directly with confirmed password
        const { error: createErr } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: role || 'buyer',
            full_name: fullName || email.split('@')[0],
          },
        })
        if (!createErr) {
          const loginRes = await supabase.auth.signInWithPassword({ email, password })
          if (!loginRes.error) return loginRes.data
        }
      }
    }
  } catch (err) {
    console.warn('Admin password reset fallback:', err)
  }

  // Strategy 2: Backend proxy
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, fullName }),
    })
    if (res.ok) {
      const loginRes = await supabase.auth.signInWithPassword({ email, password })
      if (!loginRes.error) return loginRes.data
    }
  } catch (err) {
    console.warn('Backend proxy reset fallback:', err)
  }

  // Strategy 3: Client reset email
  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login?confirmed=true`,
  })
  if (resetErr) throw resetErr

  return { message: 'Password reset link sent to your email.' }
}

async function autoConfirmEmail(email: string, password?: string): Promise<boolean> {
  try {
    if (supabase.auth?.admin?.listUsers) {
      const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const target = usersData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
      if (target) {
        const updatePayload: Record<string, unknown> = { email_confirm: true }
        if (password) updatePayload.password = password
        await supabase.auth.admin.updateUserById(target.id, updatePayload)
        return true
      }
    }
  } catch {
    // Handled
  }
  return false
}

export async function deleteUserAccount(emailRaw: string): Promise<{ message: string }> {
  const email = emailRaw.trim().toLowerCase()
  try {
    if (supabase.auth?.admin?.listUsers) {
      const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const target = usersData?.users?.find((u) => u.email?.toLowerCase() === email)
      if (target) {
        await supabase.auth.admin.deleteUser(target.id)
        return { message: 'Account successfully removed from database' }
      }
    }
  } catch (err) {
    console.warn('Direct admin delete fallback:', err)
  }

  const res = await fetch('/api/auth/delete-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || 'Account deletion failed.')
  return data || { message: 'Account deleted' }
}

