import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Trash2, EyeOff } from 'lucide-react'
import type { Story } from '../../types'

export default function StoryModeration() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlaggedStories()
  }, [])

  const fetchFlaggedStories = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .in('moderation_status', ['flagged', 'safe'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setStories(data as Story[])
    }
    setLoading(false)
  }

  const hideStory = async (id: string) => {
    await supabase.from('stories').update({ moderation_status: 'blocked' }).eq('id', id)
    setStories((prev) => prev.filter((s) => s.id !== id))
  }

  const deleteStory = async (id: string) => {
    await supabase.from('stories').delete().eq('id', id)
    setStories((prev) => prev.filter((s) => s.id !== id))
  }

  if (loading) return <p className="text-gray-500">Loading stories...</p>

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Stories ({stories.length})</h3>
      {stories.map((story) => (
        <div key={story.id} className="p-4 border rounded-xl flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{story.title}</p>
            <p className="text-xs text-gray-500 truncate">{story.content.slice(0, 100)}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              story.moderation_status === 'flagged' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
            }`}>
              {story.moderation_status}
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => hideStory(story.id)}
              className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition"
              title="Hide story"
            >
              <EyeOff size={16} />
            </button>
            <button
              onClick={() => deleteStory(story.id)}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
              title="Delete story"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
