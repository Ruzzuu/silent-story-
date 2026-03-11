import emoteImage from '../../../emote.webp'
import { useReactions } from '../../hooks/useReactions'

interface ReactionBarProps {
  storyId: string
  userId?: string
}

export default function ReactionBar({ storyId, userId }: ReactionBarProps) {
  const { counts, userReaction, react } = useReactions(storyId, userId)
  const active = userReaction === 'like'
  const count = counts.like

  return (
    <button
      type="button"
      onClick={() => react('like')}
      disabled={!userId}
      title={userId ? 'React' : 'Login to react'}
      className={`flex flex-col items-center gap-1 transition
        ${userId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
      `}
      aria-label="React with hug"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition
          ${active ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}
        `}
      >
        <img
          src={emoteImage}
          alt="Hug reaction"
          className="h-[18px] w-[18px] object-contain"
        />
      </div>
      <span className={`text-xs font-semibold leading-none ${active ? 'text-orange-500' : 'text-gray-500'}`}>
        {count}
      </span>
    </button>
  )
}
