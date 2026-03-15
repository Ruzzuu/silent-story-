import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Story, MapBounds } from '../types'
import type { RealtimeChannel } from '@supabase/supabase-js'

const RANDOM_SEEN_STORAGE_KEY = 'random_seen_story_ids'
const RANDOM_POOL_SIZE = 300
const SEEN_STORY_WEIGHT = 0.15
const VIEWPORT_STORY_LIMIT = 120

function readSeenStoryIds(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(RANDOM_SEEN_STORAGE_KEY)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set<string>()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set<string>()
  }
}

function writeSeenStoryIds(ids: Set<string>) {
  try {
    window.sessionStorage.setItem(RANDOM_SEEN_STORAGE_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    // Ignore storage errors; random feature should continue working.
  }
}

function pickWeightedStory(storyPool: Story[], seenStoryIds: Set<string>): Story | null {
  if (storyPool.length === 0) return null

  const weightedPool = storyPool.map((story) => {
    const isSeen = seenStoryIds.has(story.id)
    return {
      story,
      weight: isSeen ? SEEN_STORY_WEIGHT : 1,
    }
  })

  const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight <= 0) return storyPool[Math.floor(Math.random() * storyPool.length)]

  let threshold = Math.random() * totalWeight
  for (const item of weightedPool) {
    threshold -= item.weight
    if (threshold <= 0) return item.story
  }

  return weightedPool[weightedPool.length - 1].story
}

export function useStories() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(false)
  const boundsRef = useRef<MapBounds | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const seenRandomStoryIdsRef = useRef<Set<string>>(new Set())
  const fetchSeqRef = useRef(0)

  useEffect(() => {
    seenRandomStoryIdsRef.current = readSeenStoryIds()
  }, [])

  // Set up realtime subscription once
  useEffect(() => {
    const channel = supabase
      .channel('stories-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stories' },
        (payload) => {
          const newStory = payload.new as Story
          const b = boundsRef.current
          if (
            b &&
            newStory.latitude >= b.south &&
            newStory.latitude <= b.north &&
            newStory.longitude >= b.west &&
            newStory.longitude <= b.east &&
            newStory.moderation_status === 'safe'
          ) {
            setStories((prev) => [newStory, ...prev])
          }
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const fetchStoriesInBounds = useCallback(async (bounds: MapBounds, options?: { replace?: boolean }) => {
    const shouldReplace = options?.replace ?? true
    const requestSeq = ++fetchSeqRef.current
    boundsRef.current = bounds
    setLoading(true)
    const { data, error } = await supabase
      .from('stories')
      .select('*, profiles(username)')
      .gte('latitude', bounds.south)
      .lte('latitude', bounds.north)
      .gte('longitude', bounds.west)
      .lte('longitude', bounds.east)
      .eq('moderation_status', 'safe')
      .order('created_at', { ascending: false })
      .limit(VIEWPORT_STORY_LIMIT)

    if (requestSeq !== fetchSeqRef.current) {
      return [] as Story[]
    }

    if (error) {
      console.error('Error fetching stories:', error)
      setLoading(false)
      return [] as Story[]
    } else {
      const nextStories = data as Story[]
      if (shouldReplace) {
        setStories(nextStories)
      }
      setLoading(false)
      return nextStories
    }

    setLoading(false)
    return [] as Story[]
  }, [])

  const createStory = useCallback(async (story: Omit<Story, 'id' | 'views' | 'ai_quality_score' | 'created_at' | 'moderation_status' | 'tags' | 'profiles'>) => {
    const { data, error } = await supabase
      .from('stories')
      .insert(story)
      .select()
      .single()

    if (error) throw error
    return data as Story
  }, [])

  const incrementViews = useCallback(async (storyId: string) => {
    try {
      await supabase.rpc('increment_views', { story_id: storyId })
    } catch {
      // RPC may not exist yet, silently fail
    }
  }, [])

  const fetchRandomStory = useCallback(async (): Promise<Story | null> => {
    const { count: totalStories, error: countError } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'safe')

    if (countError || !totalStories || totalStories <= 0) return null

    const maxStart = Math.max(0, totalStories - RANDOM_POOL_SIZE)
    const start = maxStart > 0 ? Math.floor(Math.random() * (maxStart + 1)) : 0
    const end = start + RANDOM_POOL_SIZE - 1

    const { data, error } = await supabase
      .from('stories')
      .select('*, profiles(username)')
      .eq('moderation_status', 'safe')
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error || !data || data.length === 0) return null

    const selectedStory = pickWeightedStory(data as Story[], seenRandomStoryIdsRef.current)
    if (!selectedStory) return null

    seenRandomStoryIdsRef.current.add(selectedStory.id)
    writeSeenStoryIds(seenRandomStoryIdsRef.current)

    return selectedStory
  }, [])

  return { stories, loading, fetchStoriesInBounds, createStory, incrementViews, fetchRandomStory }
}
