import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  contextHint?: string
  storyCount?: number
}

export default function AuthModal({ isOpen, onClose, onSuccess, contextHint, storyCount }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const handleSuccess = () => {
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
            onClick={onClose}
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
                <div className="px-4 py-2.5 bg-violet-600 text-white text-sm text-center rounded-xl font-medium shadow-lg">
                  {contextHint}
                </div>
              )}

              <div className="bg-gray-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">A Map Of Us</h2>
                    {storyCount !== undefined && storyCount > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Join {storyCount.toLocaleString()} {storyCount === 1 ? 'memory' : 'memories'} already on the map
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="px-6 pb-6 space-y-4">
                  {/* Tab switcher */}
                  <div className="flex rounded-xl bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        mode === 'login'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-400 hover:text-white'
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
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Create account
                    </button>
                  </div>

                  {mode === 'login' ? (
                    <LoginForm onSuccess={handleSuccess} onSwitchToRegister={() => setMode('register')} />
                  ) : (
                    <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={() => setMode('login')} />
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full text-center text-xs text-gray-600 hover:text-gray-400 transition pt-1"
                  >
                    Just browsing — continue without account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
