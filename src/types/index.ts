export interface Profile {
  id: string
  username: string | null
  role: 'user' | 'admin'
  created_at: string
}

export interface Story {
  id: string
  user_id: string
  title: string
  content: string
  latitude: number
  longitude: number
  mood: Mood
  tags: string[]
  image_url: string | null
  moderation_status: 'safe' | 'flagged' | 'blocked'
  views: number
  ai_quality_score: number
  is_anonymous: boolean
  created_at: string
  profiles?: Pick<Profile, 'username'>
}

export interface Report {
  id: string
  story_id: string
  reporter_id: string
  reason: string
  created_at: string
  resolved: boolean
  stories?: Pick<Story, 'title'>
}

export interface Ban {
  id: string
  user_id: string
  reason: string
  created_at: string
}

export type Mood = 'joy' | 'love' | 'nostalgia' | 'adventure' | 'loss' | 'wonder'

export type ReactionType = 'like' | 'love' | 'wow' | 'sad' | 'fire'

export interface Reaction {
  id: string
  story_id: string
  user_id: string
  type: ReactionType
  created_at: string
}

export interface ReactionCounts {
  like: number
  love: number
  wow: number
  sad: number
  fire: number
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}
