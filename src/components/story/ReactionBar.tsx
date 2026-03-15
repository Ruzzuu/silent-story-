interface ReactionBarProps {
  active: boolean
  disabled?: boolean
  onReact: () => void
  size?: number
}

function ReactPeopleBadge({ active, size = 22 }: { active: boolean; size?: number }) {
  const iconSize = `${size}px`

  if (!active) {
    return (
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        <circle cx="19" cy="19" r="11" fill="none" stroke="#111111" strokeWidth="3.6" />
        <circle cx="37" cy="14" r="11" fill="none" stroke="#111111" strokeWidth="3.6" />
        <path d="M11 52l2-18c1-7 7-11 14-11h9c5 0 8 2 10 4" fill="none" stroke="#111111" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 25c4 0 7 3 7 7 0 3-2 5-5 6l-15 5c-4 1-7-1-8-4s1-7 5-8l12-4c1-1 3-2 4-2z" fill="none" stroke="#111111" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 56h30" fill="none" stroke="#111111" strokeWidth="3.6" strokeLinecap="round" />
        <circle cx="13" cy="38" r="4" fill="none" stroke="#111111" strokeWidth="3.6" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="shrink-0"
      style={{ width: iconSize, height: iconSize }}
    >
      <circle cx="19" cy="19" r="11" fill="#ffd2a8" stroke="#2b4f5a" strokeWidth="3.4" />
      <circle cx="37" cy="14" r="11" fill="#ffbf80" stroke="#2b4f5a" strokeWidth="3.4" />
      <path d="M11 52l2-18c1-7 7-11 14-11h9c7 0 12 5 13 12l2 17H11z" fill="#d7ebf2" stroke="#2b4f5a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 25c4 0 7 3 7 7 0 3-2 5-5 6l-15 5c-4 1-7-1-8-4s1-7 5-8l12-4c1-1 3-2 4-2z" fill="#d7ebf2" stroke="#2b4f5a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 56h30" fill="none" stroke="#2b4f5a" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="13" cy="38" r="4" fill="#d7ebf2" stroke="#2b4f5a" strokeWidth="3.4" />
    </svg>
  )
}

export default function ReactionBar({ active, disabled, onReact, size = 22 }: ReactionBarProps) {

  return (
    <button
      type="button"
      onClick={onReact}
      disabled={disabled}
      title={disabled ? 'Login to react' : 'React'}
      className={`flex items-center justify-center transition-all duration-200
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
      aria-label="React with warmth"
    >
      <ReactPeopleBadge active={active} size={size} />
    </button>
  )
}
