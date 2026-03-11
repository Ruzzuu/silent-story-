import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { ReactionType, ReactionCounts } from '../types'

const EMPTY_COUNTS: ReactionCounts = { like: 0, love: 0, wow: 0, sad: 0, fire: 0 }

export function useReactions(storyId: string, userId?: string) {
  const [counts, setCounts] = useState<ReactionCounts>(EMPTY_COUNTS)
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReactions = useCallback(async () => {
    const { data } = await supabase
      .from('reactions')
      .select('type, user_id')
      .eq('story_id', storyId)

    if (data) {
      const c = { ...EMPTY_COUNTS }
      for (const r of data) {
        c[r.type as ReactionType] = (c[r.type as ReactionType] || 0) + 1
        if (userId && r.user_id === userId) setUserReaction(r.type as ReactionType)
      }
      setCounts(c)
    }
    setLoading(false)
  }, [storyId, userId])

  useEffect(() => {
    fetchReactions()
  }, [fetchReactions])

  const react = useCallback(async (type: ReactionType) => {
    if (!userId) return

    if (userReaction === type) {
      // Toggle off
      await supabase.from('reactions').delete().eq('story_id', storyId).eq('user_id', userId)
      setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }))
      setUserReaction(null)
    } else {
      if (userReaction) {
        // Switch reaction
        await supabase
          .from('reactions')
          .update({ type })
          .eq('story_id', storyId)
          .eq('user_id', userId)
        setCounts((c) => ({
          ...c,
          [userReaction]: Math.max(0, c[userReaction] - 1),
          [type]: c[type] + 1,
        }))
      } else {
        // New reaction
        await supabase.from('reactions').insert({ story_id: storyId, user_id: userId, type })
        setCounts((c) => ({ ...c, [type]: c[type] + 1 }))
      }
      setUserReaction(type)
    }
  }, [storyId, userId, userReaction])

  return { counts, userReaction, loading, react }
}
