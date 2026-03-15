import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Bookmark, Heart, MoreHorizontal, Lock } from 'lucide-react'
import ReportButton from './ReportButton'
import ReactionBar from './ReactionBar'
import { useReactions } from '../../hooks/useReactions'
import { moodConfig } from '../../utils/moodConfig'
import type { Story } from '../../types'

interface StoryCardProps {
  story: Story
  onClose: () => void
  userId?: string
  anchorPoint?: { x: number; y: number } | null
}

export default function StoryCard({ story, onClose, userId, anchorPoint }: StoryCardProps) {
  const { counts, userReaction, react } = useReactions(story.id, userId)
  const mood = moodConfig[story.mood]
  const [saved, setSaved] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [clampedAnchor, setClampedAnchor] = useState<{
    left: number
    top: number
    pointerSide: 'top' | 'bottom' | 'left' | 'right'
    pointerOffset: number
  } | null>(null)
  const storyText = story.content?.trim() || story.title
  const storyTitle = story.title?.trim() || 'Untitled memory'
  const authorText = story.is_anonymous ? 'a wanderer' : story.profiles?.username || 'Unknown author'
  const date = new Date(story.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
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

  const anchored = !!anchorPoint

  useLayoutEffect(() => {
    if (!anchorPoint) {
      setClampedAnchor(null)
      return
    }

    const pointerHeight = 14
    const margin = 12

    const updatePosition = () => {
      const cardEl = cardRef.current
      if (!cardEl) return

      const rect = cardEl.getBoundingClientRect()
      const cardWidth = rect.width
      const cardHeight = rect.height

      const maxLeft = Math.max(margin, window.innerWidth - margin - cardWidth)
      const maxTop = Math.max(margin, window.innerHeight - margin - cardHeight)

      const preferredLeft = anchorPoint.x - cardWidth / 2
      const spaceAbove = anchorPoint.y - margin
      const spaceBelow = window.innerHeight - anchorPoint.y - margin
      const placeAbove = spaceAbove >= cardHeight + pointerHeight || spaceAbove >= spaceBelow

      const preferredTop = placeAbove
        ? anchorPoint.y - cardHeight - pointerHeight
        : anchorPoint.y + pointerHeight

      const left = Math.min(maxLeft, Math.max(margin, preferredLeft))
      const top = Math.min(maxTop, Math.max(margin, preferredTop))
      const anchorRelativeX = anchorPoint.x - left
      const anchorRelativeY = anchorPoint.y - top
      const pinnedLeft = preferredLeft < margin
      const pinnedRight = preferredLeft > maxLeft

      let pointerSide: 'top' | 'bottom' | 'left' | 'right' = placeAbove ? 'bottom' : 'top'
      if (pinnedLeft && anchorRelativeX <= 24) pointerSide = 'left'
      if (pinnedRight && anchorRelativeX >= cardWidth - 24) pointerSide = 'right'

      const pointerOffset =
        pointerSide === 'top' || pointerSide === 'bottom'
          ? Math.min(cardWidth - 14, Math.max(14, anchorRelativeX))
          : Math.min(cardHeight - 14, Math.max(14, anchorRelativeY))

      setClampedAnchor({ left, top, pointerSide, pointerOffset })
    }

    updatePosition()

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined' && cardRef.current) {
      resizeObserver = new ResizeObserver(updatePosition)
      resizeObserver.observe(cardRef.current)
    }

    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('resize', updatePosition)
      resizeObserver?.disconnect()
    }
  }, [anchorPoint, storyText, story.image_url, menuOpen, showReport])

  return (
    <div
      className={anchored ? 'absolute z-30 pointer-events-auto transition-[left,top,transform] duration-100 ease-out' : 'fixed left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-auto'}
      style={anchored
        ? clampedAnchor
          ? { left: clampedAnchor.left, top: clampedAnchor.top, transform: 'translateZ(0)' }
          : { left: anchorPoint.x, top: anchorPoint.y, transform: 'translate(-50%, calc(-100% - 14px))' }
        : undefined}
    >
      <motion.div
        ref={cardRef}
        className="w-[92vw] max-w-md max-h-[82vh] overflow-hidden rounded-2xl border border-stone-500 bg-stone-100 shadow-2xl"
        initial={{ opacity: 0, scale: anchored ? 1 : 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: anchored ? 1 : 0.96 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      >
      <div className="relative max-h-[82vh] overflow-y-auto px-5 py-5">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-stone-500 transition hover:bg-stone-200 hover:text-stone-700"
          aria-label="Close story"
        >
          <X size={18} />
        </button>

        <h2
          className="pr-8 text-[1.32rem] leading-[1.2] text-stone-900 tracking-tight"
          style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
        >
          {storyTitle}
        </h2>

        <p
          className="mt-2 pr-8 text-[0.82rem] leading-[1.18] text-stone-800 tracking-tight whitespace-pre-wrap"
          style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}
        >
          {storyText}
        </p>

        <div className="mt-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${mood.bgColor} ${mood.textColor}`}>
            {mood.label}
          </span>
        </div>

        {story.image_url && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowImageViewer(true)}
              className="group flex items-center gap-2"
              aria-label="Open image"
            >
              <img
                src={story.image_url}
                alt={story.title}
                className="h-14 w-14 rounded-lg border border-stone-300 object-cover transition group-hover:opacity-90"
              />
              <span className="text-xs text-stone-500">Tap image to expand</span>
            </button>
          </div>
        )}

        <div className="mt-4 border-t border-stone-300 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="mb-1">
              <p className="text-[0.82rem] leading-[1.18] tracking-tight text-stone-700">{authorText}</p>
              <p className="text-[0.82rem] leading-[1.18] italic text-stone-500">{date}</p>
            </div>

            <div className="flex items-center gap-3">
            <div className="flex min-w-13 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSaved((current) => !current)}
                className="flex items-center transition-all duration-200"
                aria-label={saved ? 'Remove bookmark' : 'Bookmark story'}
              >
                <Bookmark
                  size={22}
                  fill={saved ? 'currentColor' : 'none'}
                  strokeWidth={2.1}
                  className={`transition-transform duration-200 ${saved ? 'scale-105 text-amber-600' : 'text-stone-900 hover:text-stone-700'}`}
                />
              </button>
              <span className="text-xs leading-none tabular-nums text-stone-700">{saved ? 1 : 0}</span>
            </div>

            <div className="flex min-w-13 items-center gap-1.5">
              <ReactionBar
                active={userReaction === 'like'}
                disabled={!userId}
                onReact={() => react('like')}
                size={22}
              />
              <span className="text-xs leading-none tabular-nums text-stone-700">{counts.like}</span>
            </div>

            <div className="flex min-w-13 items-center gap-1.5">
              <button
                type="button"
                onClick={() => react('love')}
                disabled={!userId}
                title={userId ? 'Love' : 'Login to react'}
                className={`flex items-center transition-all duration-200 ${userId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                aria-label="Love"
              >
                <Heart
                  size={22}
                  fill={userReaction === 'love' ? 'currentColor' : 'none'}
                  strokeWidth={2.2}
                  className={`transition-transform duration-200 ${userReaction === 'love' ? 'scale-110 text-rose-500' : 'text-stone-900 hover:text-stone-700'}`}
                />
              </button>
              <span className="text-xs leading-none tabular-nums text-stone-700">{counts.love}</span>
            </div>

            <div ref={menuRef} className="relative flex items-center">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="flex items-center justify-center text-stone-500 transition hover:text-stone-700"
                aria-label="More actions"
              >
                <MoreHorizontal size={22} />
              </button>

              {menuOpen && (
                <div className="absolute bottom-8 right-0 z-20 min-w-28 overflow-hidden rounded-md border border-stone-300 bg-stone-50 shadow-lg">
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
          </div>

          {!userId && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-400 italic">
              <Lock size={11} />
              Sign in to react to this memory
            </p>
          )}

          {showReport && userId && userId !== story.user_id && (
            <ReportButton
              isOpen={showReport}
              onClose={() => setShowReport(false)}
              storyId={story.id}
              reporterId={userId}
            />
          )}
        </div>
      </div>
      </motion.div>

      {showImageViewer && story.image_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/65"
            aria-label="Close image"
            onClick={() => setShowImageViewer(false)}
          />
          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-stone-900 p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowImageViewer(false)}
              className="absolute right-3 top-3 rounded-full bg-stone-100/90 p-1 text-stone-700 transition hover:bg-stone-100"
              aria-label="Close image"
            >
              <X size={18} />
            </button>
            <img
              src={story.image_url}
              alt={story.title}
              className="max-h-[80vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {anchored && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute transition-[left,top,bottom,transform] duration-100 ease-out ${clampedAnchor?.pointerSide === 'bottom' || !clampedAnchor ? 'top-full -translate-x-1/2' : clampedAnchor.pointerSide === 'top' ? 'bottom-full -translate-x-1/2' : clampedAnchor.pointerSide === 'left' ? 'right-full -translate-y-1/2' : 'left-full -translate-y-1/2'}`}
          style={{
            ...(clampedAnchor?.pointerSide === 'left' || clampedAnchor?.pointerSide === 'right'
              ? { top: clampedAnchor.pointerOffset }
              : { left: clampedAnchor ? clampedAnchor.pointerOffset : '50%' }),
            width: 0,
            height: 0,
            ...(clampedAnchor?.pointerSide === 'left'
              ? { borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderRight: '12px solid #44403c' }
              : clampedAnchor?.pointerSide === 'right'
              ? { borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '12px solid #44403c' }
              : {
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  ...(clampedAnchor?.pointerSide === 'top'
                    ? { borderBottom: '12px solid #44403c' }
                    : { borderTop: '12px solid #44403c' }),
                }),
          }}
        />
      )}
    </div>
  )
}
