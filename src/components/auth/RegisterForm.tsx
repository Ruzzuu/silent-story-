import { useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { UserPlus, Mail, ShieldCheck } from 'lucide-react'

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
  const [registered, setRegistered] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, username)
      setRegistered(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 7) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (pasted.length === 8) {
      setOtp(pasted.split(''))
      inputRefs.current[7]?.focus()
    }
  }

  const handleVerify = async () => {
    const token = otp.join('')
    if (token.length < 8) { setError('Enter the full 8-digit code'); return }
    setError('')
    setVerifying(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })
      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code, please try again')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <>
      {registered ? (
        <div className="space-y-5">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-4 bg-amber-900/40 rounded-full">
                <ShieldCheck size={32} className="text-amber-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-amber-50">Enter verification code</h3>
            <p className="text-sm text-stone-400">
              We sent a 6-digit code to <span className="text-amber-300 font-medium">{email}</span>
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-300 bg-red-950/60 border border-red-800/50 rounded-lg">{error}</div>
          )}

          <div className="flex gap-1.5 justify-center" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-9 h-11 text-center text-lg font-bold bg-stone-800/60 border border-amber-700/40 text-amber-50 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || otp.join('').length < 6}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 text-amber-50 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
          >
            <Mail size={18} />
            {verifying ? 'Verifying...' : 'Verify Email'}
          </button>

          <p className="text-sm text-center text-stone-500">
            Didn't get a code?{' '}
            <button type="button" onClick={() => { setRegistered(false); setOtp(['','','','','','']); setError('') }} className="text-amber-500 hover:text-amber-400 hover:underline">
              Try again
            </button>
            {' · '}
            <button type="button" onClick={onSwitchToLogin} className="text-amber-500 hover:text-amber-400 hover:underline">
              Back to sign in
            </button>
          </p>
        </div>
      ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-300 bg-red-950/60 border border-red-800/50 rounded-lg">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-3 py-2 bg-stone-800/60 border border-amber-700/40 text-amber-50 placeholder-stone-500 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
          placeholder="Your display name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-stone-800/60 border border-amber-700/40 text-amber-50 placeholder-stone-500 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 bg-stone-800/60 border border-amber-700/40 text-amber-50 placeholder-stone-500 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none"
          placeholder="At least 6 characters"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 text-amber-50 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
      >
        <UserPlus size={18} />
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
      <p className="text-sm text-center text-stone-500">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-amber-500 hover:text-amber-400 hover:underline">
          Sign in
        </button>
      </p>
    </form>
      )}
    </>
  )
}
