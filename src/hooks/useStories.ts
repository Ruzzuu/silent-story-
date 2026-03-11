import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Story, MapBounds } from '../types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useStories() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(false)
  const boundsRef = useRef<MapBounds | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

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

  const fetchStoriesInBounds = useCallback(async (bounds: MapBounds) => {
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
      .limit(200)

    if (error) {
      console.error('Error fetching stories:', error)
    } else {
      setStories(data as Story[])
    }
    setLoading(false)
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
    const { data, error } = await supabase
      .from('stories')
      .select('*, profiles(username)')
      .eq('moderation_status', 'safe')
      .limit(1)
      .order('created_at', { ascending: Math.random() > 0.5 })
      .range(0, 0)
    if (error || !data || data.length === 0) return null
    return data[0] as Story
  }, [])

  return { stories, loading, fetchStoriesInBounds, createStory, incrementViews, fetchRandomStory }
}
