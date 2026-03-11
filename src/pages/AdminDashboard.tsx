import { useState } from 'react'
import ReportQueue from '../components/admin/ReportQueue'
import StoryModeration from '../components/admin/StoryModeration'
import UserManagement from '../components/admin/UserManagement'
import { Shield, FileText, Users, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Tab = 'reports' | 'stories' | 'users'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('reports')
  const navigate = useNavigate()

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'reports', label: 'Reports', icon: <AlertTriangle size={18} /> },
    { id: 'stories', label: 'Stories', icon: <FileText size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700 transition"
        >
          ← Back to Map
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'reports' && <ReportQueue />}
        {activeTab === 'stories' && <StoryModeration />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  )
}
