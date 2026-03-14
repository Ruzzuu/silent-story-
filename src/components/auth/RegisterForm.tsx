import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { UserPlus, Mail, ShieldCheck } from 'lucide-react'

const PENDING_VERIFICATION_KEY = 'pending_email_verification_v1'

interface RegisterFormProps {
  onSuccess: () => void
  onSwitchToLogin: () => void
  onVerificationPendingChange?: (pending: boolean) => void
}

export default function RegisterForm({ onSuccess, onSwitchToLogin, onVerificationPendingChange }: RegisterFormProps) {
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.sessionStorage.getItem(PENDING_VERIFICATION_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { email?: string }
      if (parsed?.email) {
        setEmail(parsed.email)
        setRegistered(true)
        onVerificationPendingChange?.(true)
      }
    } catch {
      window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
    }
  }, [onVerificationPendingChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, username)
      setRegistered(true)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify({ email: email.trim().toLowerCase() }))
      }
      onVerificationPendingChange?.(true)
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
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
      }
      onVerificationPendingChange?.(false)
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
            <h3 className="text-lg font-semibold text-gray-900">Enter verification code</h3>
            <p className="text-sm text-gray-700">
              We sent a verification code to <span className="text-amber-300 font-medium">{email}</span>
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100/90 border border-red-300 rounded-lg">{error}</div>
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
                className="w-9 h-11 text-center text-lg font-bold bg-white/75 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || otp.join('').length < 8}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 text-amber-50 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
          >
            <Mail size={18} />
            {verifying ? 'Verifying...' : 'Verify Email'}
          </button>

          <p className="text-sm text-center text-gray-700">
            Didn't get a code?{' '}
            <button
              type="button"
              onClick={() => {
                setRegistered(false)
                setOtp(['', '', '', '', '', '', '', ''])
                setError('')
                onVerificationPendingChange?.(false)
                if (typeof window !== 'undefined') {
                  window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
                }
              }}
              className="text-amber-500 hover:text-amber-400 hover:underline"
            >
              Try again
            </button>
            {' · '}
            <button
              type="button"
              onClick={() => {
                onVerificationPendingChange?.(false)
                if (typeof window !== 'undefined') {
                  window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
                }
                onSwitchToLogin()
              }}
              className="text-amber-500 hover:text-amber-400 hover:underline"
            >
              Back to sign in
            </button>
          </p>
        </div>
      ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100/90 border border-red-300 rounded-lg">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white/75 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          placeholder="Your display name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white/75 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 bg-white/75 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
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
      <p className="text-sm text-center text-gray-700">
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
