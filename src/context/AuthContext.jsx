import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [userRoles, setUserRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else {
          setProfile(null)
          setUserRoles([])
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const [{ data: profileData, error: profileError }, { data: rolesData, error: rolesError }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('*, roles(*)').eq('user_id', userId)
      ])

      console.log('Profile:', profileData, profileError)
      console.log('Roles:', rolesData, rolesError)

      setProfile(profileData)
      setUserRoles(rolesData?.map(ur => ur.roles) ?? [])
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const roleLevel = userRoles.length > 0
    ? Math.max(...userRoles.map(r => r.level))
    : 0

  const isEboard = roleLevel >= 80
  const isStaffOrAbove = roleLevel >= 70
  const isMemberOrAbove = roleLevel >= 50
  const isApproved = profile?.status === 'approved'
  const isPending = profile?.status === 'pending'

  async function signUp(email, password, firstName, lastName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    })
    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://eraumun.com/update-password'
    })
    return { data, error }
  }

  async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  const value = {
    user,
    profile,
    userRoles,
    roleLevel,
    isEboard,
    isStaffOrAbove,
    isMemberOrAbove,
    isApproved,
    isPending,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)