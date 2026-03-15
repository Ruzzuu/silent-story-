import { useState } from 'react'
import { Send, EyeOff, Eye } from 'lucide-react'
import MoodSelector from '../ui/MoodSelector'
import type { Mood } from '../../types'

const ANONYMOUS_ALIASES = [
  'a wanderer', 'a dreamer', 'a stranger', 'someone', 'a soul',
  'a memory', 'a traveler', 'a ghost', 'a voice', 'a passerby',
]

function randomAlias() {
  return ANONYMOUS_ALIASES[Math.floor(Math.random() * ANONYMOUS_ALIASES.length)]
}

interface StoryFormProps {
  latitude: number
  longitude: number
  onSubmit: (data: { title: string; content: string; mood: Mood; latitude: number; longitude: number; image_url: string | null; is_anonymous: boolean }) => Promise<void>
  onCancel: () => void
}

export default function StoryForm({ latitude, longitude, onSubmit, onCancel }: StoryFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<Mood | ''>('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [alias] = useState(randomAlias)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mood) {
      setError('Please select a mood')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onSubmit({ title, content, mood, latitude, longitude, image_url: null, is_anonymous: isAnonymous })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create story')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>
      )}

      {/* Anonymous toggle */}
      <button
        type="button"
        onClick={() => setIsAnonymous((a) => !a)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left hover:scale-[1.01] ${
          isAnonymous
            ? 'border-amber-300 bg-amber-50 text-stone-700 hover:bg-amber-100'
            : 'border-transparent bg-amber-50 text-stone-600 hover:bg-amber-100'
        }`}
      >
        {isAnonymous
          ? <EyeOff size={18} className="text-amber-700 shrink-0" />
          : <Eye size={18} className="text-stone-500 shrink-0" />
        }
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {isAnonymous ? `Posting as "${alias}"` : 'Posting with your username'}
          </p>
          <p className="text-xs opacity-70">
            {isAnonymous ? "No one will know it's you" : 'Tap to post anonymously instead'}
          </p>
        </div>
        <span className={`ml-auto shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
          isAnonymous ? 'bg-amber-200 text-amber-800' : 'bg-stone-200 text-stone-600'
        }`}>
          {isAnonymous ? 'ON' : 'OFF'}
        </span>
      </button>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none"
          placeholder="Give your memory a title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Story</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          maxLength={5000}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none resize-none"
          placeholder="Write freely. No one has to know it's you…"
        />
        <p className="text-right text-xs text-gray-400 mt-1">{content.length} / 5000</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">How does this memory feel?</label>
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 text-amber-50 rounded-lg hover:bg-amber-800 disabled:opacity-50 transition"
        >
          <Send size={16} />
          {loading ? 'Posting…' : 'Leave this memory'}
        </button>
      </div>
    </form>
  )
}
