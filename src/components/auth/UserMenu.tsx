import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ChevronDown, Pencil, Check, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-sky-500', 'bg-pink-500', 'bg-teal-500',
]

function avatarColor(seed: string) {
  const code = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function Avatar({ seed, size = 'sm' }: { seed: string; size?: 'sm' | 'lg' }) {
  const letter = seed[0]?.toUpperCase() ?? '?'
  const color = avatarColor(seed)
  const dims = size === 'lg' ? 'h-10 w-10 text-base' : 'h-7 w-7 text-xs'
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${dims} ${color}`}>
      {letter}
    </div>
  )
}

export default function UserMenu({ onRequestAuth }: { onRequestAuth?: () => void }) {
  const { user, profile, signOut, updateUsername } = useAuth()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const handleMouseDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setEditing(false)
      }
    }
    window.addEventListener('mousedown', handleMouseDown)
    return () => window.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  useEffect(() => {
    if (editing) {
      setDraftName(profile?.username ?? '')
      setNameError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [editing, profile?.username])

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

  const username = profile?.username ?? user.email?.split('@')[0] ?? ''
  const email = user.email ?? ''

  const handleSaveName = async () => {
    const trimmed = draftName.trim()
    if (!trimmed) { setNameError('Name cannot be empty'); return }
    if (trimmed.length > 30) { setNameError('Max 30 characters'); return }
    setSaving(true)
    try {
      await updateUsername(trimmed)
      setEditing(false)
    } catch {
      setNameError('Failed to save — try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-3 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1"
      >
        <Avatar seed={username || email} />
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
            className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-xl z-50"
          >
            {/* Profile header */}
            <div className="flex items-start gap-3 px-4 py-3">
              <Avatar seed={username || email} size="lg" />
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="space-y-1">
                    <input
                      ref={inputRef}
                      value={draftName}
                      onChange={(e) => { setDraftName(e.target.value); setNameError('') }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditing(false) }}
                      maxLength={30}
                      className="w-full text-sm border border-amber-300 rounded-md px-2 py-0.5 outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="Your username"
                    />
                    {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                    <div className="flex gap-1">
                      <button
                        onClick={handleSaveName}
                        disabled={saving}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 transition"
                      >
                        <Check size={11} />{saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition"
                      >
                        <X size={11} />Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">{username}</p>
                    <button
                      onClick={() => setEditing(true)}
                      className="shrink-0 p-0.5 rounded hover:bg-amber-100 text-gray-400 hover:text-amber-700 transition"
                      title="Edit username"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                )}
                {!editing && <p className="truncate text-xs text-gray-400">{email}</p>}
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
