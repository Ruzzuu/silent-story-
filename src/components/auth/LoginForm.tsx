import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { LogIn } from 'lucide-react'

interface LoginFormProps {
  onSuccess: () => void
  onSwitchToRegister: () => void
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { signIn } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(identifier, password)
      onSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Email not confirmed. Please register a new account or confirm your email in the Supabase dashboard.')
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email/username or password. Please check your credentials or register a new account.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100/90 border border-red-300 rounded-lg">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Email or Username</label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white/75 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          placeholder="you@example.com or yourusername"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white/75 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 text-amber-50 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
      >
        <LogIn size={18} />
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <p className="text-sm text-center text-gray-700">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister} className="text-amber-500 hover:text-amber-400 hover:underline">
          Register
        </button>
      </p>
    </form>
  )
}
