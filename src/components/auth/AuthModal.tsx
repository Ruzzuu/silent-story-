import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

const PENDING_VERIFICATION_KEY = 'pending_email_verification_v1'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  contextHint?: string
  storyCount?: number
}

export default function AuthModal({ isOpen, onClose, onSuccess, contextHint, storyCount }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [hasPendingVerification, setHasPendingVerification] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem(PENDING_VERIFICATION_KEY) !== null
  })

  const clearPendingVerification = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(PENDING_VERIFICATION_KEY)
    }
    setHasPendingVerification(false)
  }

  const requestClose = (source: 'header' | 'backdrop' | 'continue') => {
    // Keep verification flow open unless user explicitly closes from the X button.
    if (hasPendingVerification && source !== 'header') return
    if (source === 'header' && hasPendingVerification) {
      clearPendingVerification()
    }
    onClose()
  }

  const handleSuccess = () => {
    clearPendingVerification()
    onSuccess()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-950/70 backdrop-blur-sm z-40"
            onClick={() => requestClose('backdrop')}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-sm pointer-events-auto space-y-3">
              {/* Context hint banner */}
              {contextHint && (
                <div className="px-4 py-2.5 bg-white/70 text-gray-800 text-sm text-center rounded-xl font-medium shadow-md border border-white/60 backdrop-blur-sm">
                  {contextHint}
                </div>
              )}

              <div className="relative bg-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('/baground.webp')" }}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 bg-slate-100/25 backdrop-blur-md"
                  aria-hidden="true"
                />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pt-5 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Stories Between Us</h2>
                      {storyCount !== undefined && storyCount > 0 && (
                        <p className="text-xs text-gray-700 mt-0.5">
                          Join {storyCount.toLocaleString()} {storyCount === 1 ? 'memory' : 'memories'} already on the map
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => requestClose('header')}
                      className="p-1.5 rounded-full text-gray-700 hover:bg-white/40 hover:text-gray-900 transition"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="px-6 pb-6 space-y-4">
                    {/* Tab switcher */}
                    <div className="flex rounded-xl bg-white/35 p-1 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                          mode === 'login'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Sign in
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                          mode === 'register'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Create account
                      </button>
                    </div>

                    {mode === 'login' ? (
                      <LoginForm onSuccess={handleSuccess} onSwitchToRegister={() => setMode('register')} />
                    ) : (
                      <RegisterForm
                        onSuccess={handleSuccess}
                        onSwitchToLogin={() => setMode('login')}
                        onVerificationPendingChange={setHasPendingVerification}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => requestClose('continue')}
                      className="w-full text-center text-xs text-gray-700 hover:text-gray-900 transition pt-1"
                    >
                      Just browsing - continue without account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
