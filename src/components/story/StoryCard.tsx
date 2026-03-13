import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, MapPin, Calendar, Tag, Bookmark, Heart, MoreHorizontal, Lock } from 'lucide-react'
import { Sun, Waves, Compass, CloudRain, Sparkles } from 'lucide-react'
import { moodConfig } from '../../utils/moodConfig'
import ReportButton from './ReportButton'
import ReactionBar from './ReactionBar'
import { useReactions } from '../../hooks/useReactions'
import type { Mood, Story } from '../../types'

interface StoryCardProps {
  story: Story
  onClose: () => void
  userId?: string
}

const moodIcons: Record<Mood, React.ReactNode> = {
  joy: <Sun size={14} />,
  love: <Heart size={14} />,
  nostalgia: <Waves size={14} />,
  adventure: <Compass size={14} />,
  loss: <CloudRain size={14} />,
  wonder: <Sparkles size={14} />,
}

export default function StoryCard({ story, onClose, userId }: StoryCardProps) {
  const config = moodConfig[story.mood]
  const { userReaction, react } = useReactions(story.id, userId)
  const [saved, setSaved] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const date = new Date(story.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareData = {
      title: story.title,
      text: story.content,
      url: shareUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareUrl)
      }
    } catch {
      return
    } finally {
      setMenuOpen(false)
    }
  }

  return (
    <motion.div
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-amber-50 shadow-2xl z-30 overflow-y-auto"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
    >
      <div className="sticky top-0 bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
            {moodIcons[story.mood]}
            {config.label}
          </span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-amber-100 transition">
            <X size={20} className="text-stone-500" />
          </button>
        </div>
        <div className={`h-1 w-full bg-gradient-to-r ${config.gradient}`} />
      </div>

      <div className="px-6 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">{story.title}</h1>

        <div className="flex items-center gap-4 text-sm text-stone-500">
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {story.latitude.toFixed(2)}, {story.longitude.toFixed(2)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {date}
          </span>
        </div>

        <p className="text-sm text-stone-400 italic">
          {story.is_anonymous
            ? '— a wanderer'
            : story.profiles?.username
            ? `by ${story.profiles.username}`
            : null}
        </p>

        <div className="text-stone-700 leading-relaxed whitespace-pre-wrap">{story.content}</div>

        {story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {story.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full text-xs text-amber-800">
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {story.image_url && (
          <img
            src={story.image_url}
            alt={story.title}
            className="w-full rounded-xl object-cover max-h-64"
          />
        )}

        <div className="border-t border-amber-200 pt-4">
          <div className="flex items-center justify-around">
            <button
              type="button"
              onClick={() => setSaved((current) => !current)}
              className="flex items-center transition"
              aria-label={saved ? 'Remove bookmark' : 'Bookmark story'}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition
                ${saved ? 'border-amber-600 bg-amber-100 text-amber-700' : 'border-stone-200 bg-stone-50 text-stone-400 hover:border-stone-400 hover:bg-stone-100'}`}>
                <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
              </div>
            </button>

            <ReactionBar storyId={story.id} userId={userId} />

            <button
              type="button"
              onClick={() => react('love')}
              disabled={!userId}
              title={userId ? 'Love' : 'Login to react'}
              className={`flex items-center transition ${userId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              aria-label="Love"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition
                ${userReaction === 'love' ? 'border-rose-400 bg-rose-50 text-rose-500' : 'border-stone-200 bg-stone-50 text-stone-400 hover:border-stone-400 hover:bg-stone-100'}`}>
                <Heart size={18} fill={userReaction === 'love' ? 'currentColor' : 'none'} />
              </div>
            </button>

            <div ref={menuRef} className="relative flex items-center">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50 text-stone-400 transition hover:border-stone-400 hover:bg-stone-100"
                aria-label="More actions"
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && (
                <div className="absolute bottom-8 right-0 z-20 min-w-28 overflow-hidden rounded-md border border-amber-200 bg-amber-50 shadow-lg">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="block w-full px-4 py-2 text-left text-sm text-stone-700 transition hover:bg-amber-100"
                  >
                    Share
                  </button>
                  {userId && userId !== story.user_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowReport((current) => !current)
                        setMenuOpen(false)
                      }}
                      className="block w-full border-t border-amber-200 px-4 py-2 text-left text-sm text-stone-700 transition hover:bg-amber-100"
                    >
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {!userId && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-400 italic">
              <Lock size={11} />
              Sign in to react to this memory
            </p>
          )}

          {showReport && userId && userId !== story.user_id && (
            <div className="pt-3">
              <ReportButton storyId={story.id} reporterId={userId} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
