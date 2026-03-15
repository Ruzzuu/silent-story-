import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { ReactionType, ReactionCounts } from '../types'

const EMPTY_COUNTS: ReactionCounts = { like: 0, love: 0, wow: 0, sad: 0, fire: 0 }

export function useReactions(storyId: string, userId?: string) {
  const [counts, setCounts] = useState<ReactionCounts>(EMPTY_COUNTS)
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
  const [loading, setLoading] = useState(true)
  const reactingRef = useRef(false)

  const fetchReactions = useCallback(async () => {
    const { data } = await supabase
      .from('reactions')
      .select('type')
      .eq('story_id', storyId)

    let nextUserReaction: ReactionType | null = null
    if (userId) {
      const { data: userReactionRow } = await supabase
        .from('reactions')
        .select('type')
        .eq('story_id', storyId)
        .eq('user_id', userId)
        .maybeSingle()

      nextUserReaction = (userReactionRow?.type as ReactionType | undefined) ?? null
    }

    if (data) {
      const c = { ...EMPTY_COUNTS }
      for (const r of data) {
        c[r.type as ReactionType] = (c[r.type as ReactionType] || 0) + 1
      }
      setCounts(c)
    }

    setUserReaction(nextUserReaction)
    setLoading(false)
  }, [storyId, userId])

  useEffect(() => {
    fetchReactions()
  }, [fetchReactions])

  const react = useCallback(async (type: ReactionType) => {
    if (!userId) return
    if (reactingRef.current) return

    reactingRef.current = true
    const previousReaction = userReaction

    // Optimistic state so user immediately sees active/inactive and number changes.
    if (previousReaction === type) {
      setUserReaction(null)
      setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }))
    } else {
      setUserReaction(type)
      setCounts((c) => ({
        ...c,
        ...(previousReaction ? { [previousReaction]: Math.max(0, c[previousReaction] - 1) } : {}),
        [type]: c[type] + 1,
      }))
    }

    try {
      if (previousReaction === type) {
        // Toggle off
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', userId)

        if (error) throw error
      } else {
        // Use one conflict-safe write to avoid duplicate-key 409 spam in console.
        const { error: upsertError } = await supabase
          .from('reactions')
          .upsert({ story_id: storyId, user_id: userId, type }, { onConflict: 'story_id,user_id' })

        if (upsertError?.code === '42501') {
          // Some RLS policies expect user_id to come from auth context/default.
          const { error: fallbackUpsertError } = await supabase
            .from('reactions')
            .upsert({ story_id: storyId, type }, { onConflict: 'story_id,user_id' })

          if (fallbackUpsertError) throw fallbackUpsertError
        } else if (upsertError) {
          throw upsertError
        }
      }
    } catch (error) {
      console.error('Failed to update reaction:', error)
      // Roll back optimistic state from fresh source of truth.
      await fetchReactions()
    } finally {
      reactingRef.current = false
    }
  }, [storyId, userId, userReaction, fetchReactions])

  return { counts, userReaction, loading, react }
}
