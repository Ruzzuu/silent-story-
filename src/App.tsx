import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import MapPage from './pages/MapPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { ShieldX } from 'lucide-react'

function BannedScreen() {
  const { signOut } = useAuth()
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <ShieldX size={48} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Banned</h1>
        <p className="text-gray-500 mb-6">Your account has been banned for violating our community guidelines.</p>
        <button onClick={signOut} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition">
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { user, profile, isBanned, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (user && isBanned) {
    return <BannedScreen />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<MapPage />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <LoginPage onSuccess={() => window.location.reload()} />}
        />
        <Route
          path="/admin"
          element={
            user && profile?.role === 'admin'
              ? <AdminDashboard />
              : <Navigate to="/" />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
