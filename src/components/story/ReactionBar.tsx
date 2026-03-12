import { HeartHandshake } from 'lucide-react'
import { useReactions } from '../../hooks/useReactions'

interface ReactionBarProps {
  storyId: string
  userId?: string
}

export default function ReactionBar({ storyId, userId }: ReactionBarProps) {
  const { userReaction, react } = useReactions(storyId, userId)
  const active = userReaction === 'like'

  return (
    <button
      type="button"
      onClick={() => react('like')}
      disabled={!userId}
      title={userId ? 'React' : 'Login to react'}
      className={`flex items-center transition
        ${userId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
      `}
      aria-label="React with warmth"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition
          ${active ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-stone-200 bg-stone-50 text-stone-400 hover:border-stone-400 hover:bg-stone-100'}
        `}
      >
        <HeartHandshake size={18} />
      </div>
    </button>
  )
}
