import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-sky-500', 'bg-pink-500', 'bg-teal-500',
]

function avatarColor(email: string) {
  const code = email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function Avatar({ email, size = 'sm' }: { email: string; size?: 'sm' | 'lg' }) {
  const letter = email[0].toUpperCase()
  const color = avatarColor(email)
  const dims = size === 'lg' ? 'h-10 w-10 text-base' : 'h-7 w-7 text-xs'
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${dims} ${color}`}>
      {letter}
    </div>
  )
}

export default function UserMenu({ onRequestAuth }: { onRequestAuth?: () => void }) {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleMouseDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handleMouseDown)
    return () => window.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  if (!user) {
    return (
      <button
        onClick={onRequestAuth}
        className="flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-violet-700 transition"
      >
        Sign in
      </button>
    )
  }

  const username = user.email?.split('@')[0] ?? user.email ?? ''
  const email = user.email ?? ''

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-3 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1"
      >
        <Avatar email={email} />
        <span className="max-w-[7rem] truncate text-sm font-medium text-gray-700">
          {username}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl z-50"
          >
            {/* Profile header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar email={email} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">{username}</p>
                <p className="truncate text-xs text-gray-400">{email}</p>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            <button
              onClick={async () => {
                await signOut()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-red-500"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
