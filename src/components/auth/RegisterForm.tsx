import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { UserPlus } from 'lucide-react'

interface RegisterFormProps {
  onSuccess: () => void
  onSwitchToLogin: () => void
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, username)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-300 bg-red-950/60 border border-red-800/50 rounded-lg">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          placeholder="Your display name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          placeholder="At least 6 characters"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
      >
        <UserPlus size={18} />
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
      <p className="text-sm text-center text-gray-500">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-violet-400 hover:text-violet-300 hover:underline">
          Sign in
        </button>
      </p>
    </form>
  )
}
