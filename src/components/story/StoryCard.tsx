import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, MapPin, Calendar, Tag, Bookmark, Heart, MoreHorizontal, Lock } from 'lucide-react'
import { Sun, Waves, Compass, CloudRain, Sparkles } from 'lucide-react'
import { moodConfig } from '../../utils/moodConfig'
import ReportButton from './ReportButton'
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
  const { counts, userReaction, react } = useReactions(story.id, userId)
  const visibleTags = story.tags.filter((tag) => !tag.startsWith('trail:'))
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
      className="fixed left-1/2 top-1/2 z-30 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[82vh] overflow-hidden rounded-2xl border border-stone-500 bg-stone-100 shadow-2xl"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.96 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
    >
      <div className="sticky top-0 z-10 border-b border-stone-300 bg-stone-100/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 py-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.bgColor} ${config.textColor}`}>
            {moodIcons[story.mood]}
            {config.label}
          </span>
          <button onClick={onClose} className="rounded-full p-2 transition hover:bg-stone-200">
            <X size={20} className="text-stone-500" />
          </button>
        </div>
      </div>

      <div className="max-h-[calc(82vh-72px)] overflow-y-auto px-5 py-5 space-y-4">
        <h1 className="text-2xl font-semibold text-stone-800">{story.title}</h1>

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

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
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

        <div className="border-t border-stone-300 pt-4">
          <div className="flex items-end justify-between px-1">
            <div className="flex min-w-13 flex-col items-center">
              <button
                type="button"
                onClick={() => setSaved((current) => !current)}
                className="text-stone-700 transition hover:text-stone-900"
                aria-label={saved ? 'Remove bookmark' : 'Bookmark story'}
              >
                <Bookmark size={27} fill={saved ? 'currentColor' : 'none'} />
              </button>
              <span className="mt-1 text-sm text-stone-700">{story.views}</span>
            </div>

            <div className="flex min-w-13 flex-col items-center">
              <button
                type="button"
                onClick={() => react('like')}
                disabled={!userId}
                title={userId ? 'React' : 'Login to react'}
                className={`transition ${userId ? 'cursor-pointer text-stone-700 hover:text-stone-900' : 'cursor-not-allowed text-stone-400 opacity-50'}`}
                aria-label="React"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all
                    ${userReaction === 'like' ? 'bg-[radial-gradient(circle_at_center,_#b45309_15%,_#0369a1_90%)] shadow-sm' : ''}
                  `}
                >
                  <img
                    src="/emote.webp"
                    alt="React"
                    className={`h-7 w-7 object-contain transition-transform ${userReaction === 'like' ? 'scale-105' : ''}`}
                  />
                </span>
              </button>
              <span className="mt-1 text-sm text-stone-700">{counts.like}</span>
            </div>

            <div className="flex min-w-13 flex-col items-center">
              <button
                type="button"
                onClick={() => react('love')}
                disabled={!userId}
                title={userId ? 'Love' : 'Login to react'}
                className={`transition ${userId ? 'cursor-pointer text-stone-700 hover:text-stone-900' : 'cursor-not-allowed text-stone-400 opacity-50'}`}
                aria-label="Love"
              >
                <Heart size={27} fill={userReaction === 'love' ? 'currentColor' : 'none'} className={userReaction === 'love' ? 'text-rose-600' : ''} />
              </button>
              <span className="mt-1 text-sm text-stone-700">{counts.love}</span>
            </div>

            <div ref={menuRef} className="relative flex min-w-13 flex-col items-center">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="text-stone-700 transition hover:text-stone-900"
                aria-label="More actions"
              >
                <MoreHorizontal size={27} />
              </button>

              {menuOpen && (
                <div className="absolute bottom-9 right-0 z-20 min-w-28 overflow-hidden rounded-md border border-stone-300 bg-stone-50 shadow-lg">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="block w-full px-4 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-200"
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
                      className="block w-full border-t border-stone-300 px-4 py-2 text-left text-sm text-stone-700 transition hover:bg-stone-200"
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
