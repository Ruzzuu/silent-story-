import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isBanned, setIsBanned] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfileAndBan = useCallback(async (userId: string) => {
    const [profileRes, banRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('bans').select('id').eq('user_id', userId).limit(1),
    ])
    if (profileRes.data) setProfile(profileRes.data as Profile)
    if (banRes.data && banRes.data.length > 0) setIsBanned(true)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfileAndBan(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfileAndBan(session.user.id)
      } else {
        setProfile(null)
        setIsBanned(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfileAndBan])

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      // Insert profile — ignore duplicate key (user may already exist)
      await supabase
        .from('profiles')
        .upsert({ id: data.user.id, username }, { onConflict: 'id' })
    }
    return data
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return { user, session, profile, isBanned, loading, signUp, signIn, signOut }
}
