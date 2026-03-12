import { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

interface LoginPageProps {
  onSuccess: () => void
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Blurred photo background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url('/baground.webp')`, filter: 'blur(6px)' }}
      />
      {/* Dark sepia overlay */}
      <div className="absolute inset-0 bg-stone-900/60" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-700 shadow-lg shadow-amber-900/60 mb-2 border border-amber-500/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-amber-100 tracking-widest uppercase">
            A Map Of Us
          </h1>
          <p className="text-sm text-amber-200/80 max-w-xs mx-auto leading-relaxed italic">
            The world remembers everything.<br />Now it can remember you.
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-stone-900/70 backdrop-blur-xl border border-amber-700/30 rounded-2xl p-8 shadow-2xl">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-stone-800/60 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-amber-700 text-amber-50 shadow-sm'
                  : 'text-stone-400 hover:text-amber-200'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-amber-700 text-amber-50 shadow-sm'
                  : 'text-stone-400 hover:text-amber-200'
              }`}
            >
              Create account
            </button>
          </div>

          {mode === 'login' ? (
            <LoginForm onSuccess={onSuccess} onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSuccess={onSuccess} onSwitchToLogin={() => setMode('login')} />
          )}
        </div>

        <p className="text-center text-xs text-stone-500 italic">
          Your stories are yours. Post anonymously — no one has to know it's you.
        </p>
      </div>
    </div>
  )
}
