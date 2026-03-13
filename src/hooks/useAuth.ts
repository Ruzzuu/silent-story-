import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../types'

function looksLikeEmail(value: string): boolean {
  return value.includes('@')
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isBanned, setIsBanned] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfileAndBan = useCallback(async (authUser: User) => {
    const userId = authUser.id
    const [profileRes, banRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('bans').select('id').eq('user_id', userId).limit(1),
    ])
    if (profileRes.status === 401 || banRes.status === 401) {
      await supabase.auth.signOut()
      return
    }
    if (profileRes.data) {
      setProfile(profileRes.data as Profile)
    } else {
      // Trigger didn't fire — create profile now using metadata
      const username =
        authUser.user_metadata?.username ??
        authUser.email?.split('@')[0] ??
        'user'
      const { data } = await supabase
        .from('profiles')
        .upsert({ id: userId, username }, { onConflict: 'id' })
        .select()
        .maybeSingle()
      if (data) setProfile(data as Profile)
    }
    if (banRes.data && banRes.data.length > 0) setIsBanned(true)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      let activeSession = session
      if (session?.expires_at && Date.now() / 1000 > session.expires_at - 60) {
        const { data, error } = await supabase.auth.refreshSession()
        if (error || !data.session) {
          setLoading(false)
          return
        }
        activeSession = data.session
      }
      setSession(activeSession)
      setUser(activeSession?.user ?? null)
      if (activeSession?.user) {
        fetchProfileAndBan(activeSession.user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfileAndBan(session.user)
      } else {
        setProfile(null)
        setIsBanned(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfileAndBan])

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async (identifier: string, password: string) => {
    const normalizedIdentifier = identifier.trim()
    let email = normalizedIdentifier

    if (!looksLikeEmail(normalizedIdentifier)) {
      const { data: resolvedEmail, error: resolveError } = await supabase.rpc('resolve_login_email', {
        p_username: normalizedIdentifier,
      })

      if (resolveError || !resolvedEmail || typeof resolvedEmail !== 'string') {
        throw new Error('Invalid login credentials')
      }

      email = resolvedEmail
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const updateUsername = useCallback(async (username: string) => {
    if (!user) throw new Error('Not signed in')
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id)
    if (error) throw error
    setProfile((prev) => prev ? { ...prev, username } : prev)
  }, [user])

  return { user, session, profile, isBanned, loading, signUp, signIn, signOut, updateUsername }
}
