import { motion } from 'framer-motion'
import { TrendingUp, Clock, MapPin } from 'lucide-react'
import { moodConfig } from '../../utils/moodConfig'
import { haversineDistance } from '../../utils/mapUtils'
import type { Story } from '../../types'

interface StoryFeedProps {
  stories: Story[]
  mapCenter: { lat: number; lng: number }
  onStoryClick: (story: Story) => void
  onClose: () => void
}

export default function StoryFeed({ stories, mapCenter, onStoryClick, onClose }: StoryFeedProps) {
  const trending = [...stories].sort((a, b) => b.views + b.ai_quality_score - (a.views + a.ai_quality_score)).slice(0, 10)
  const recent = [...stories].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)
  const nearby = [...stories]
    .map((s) => ({ ...s, _dist: haversineDistance(mapCenter.lat, mapCenter.lng, s.latitude, s.longitude) }))
    .sort((a, b) => a._dist - b._dist)
    .slice(0, 10)

  return (
    <motion.div
      className="fixed left-0 top-0 bottom-0 w-full max-w-sm bg-amber-50 shadow-2xl z-30 overflow-y-auto"
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
    >
      <div className="sticky top-0 bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 z-10 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">Discover Stories</h2>
        <button onClick={onClose} className="text-sm text-stone-400 hover:text-stone-600">Close</button>
      </div>

      <div className="p-6 space-y-6">
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            <MapPin size={16} /> Nearby
          </h3>
          <div className="space-y-2">
            {nearby.map((story) => (
              <StoryFeedItem key={story.id} story={story} onClick={() => onStoryClick(story)} distance={story._dist} />
            ))}
            {nearby.length === 0 && <p className="text-sm text-gray-400">No stories nearby</p>}
          </div>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            <TrendingUp size={16} /> Trending
          </h3>
          <div className="space-y-2">
            {trending.map((story) => (
              <StoryFeedItem key={story.id} story={story} onClick={() => onStoryClick(story)} />
            ))}
            {trending.length === 0 && <p className="text-sm text-gray-400">No stories yet</p>}
          </div>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            <Clock size={16} /> Recent
          </h3>
          <div className="space-y-2">
            {recent.map((story) => (
              <StoryFeedItem key={story.id} story={story} onClick={() => onStoryClick(story)} />
            ))}
            {recent.length === 0 && <p className="text-sm text-gray-400">No stories yet</p>}
          </div>
        </section>
      </div>
    </motion.div>
  )
}

function StoryFeedItem({ story, onClick, distance }: { story: Story; onClick: () => void; distance?: number }) {
  const config = moodConfig[story.mood]
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl hover:bg-amber-100 transition flex items-start gap-3"
    >
      <div
        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
        style={{ backgroundColor: config.color }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{story.title}</p>
        <p className="text-xs text-gray-500 truncate">{story.content.slice(0, 80)}...</p>
      </div>
      {distance != null && (
        <span className="text-xs text-gray-400 shrink-0 mt-1">
          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${Math.round(distance)}km`}
        </span>
      )}
    </button>
  )
}
