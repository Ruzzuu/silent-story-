import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Ban } from 'lucide-react'
import type { Profile } from '../../types'

export default function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setUsers(data as Profile[])
    }
    setLoading(false)
  }

  const banUser = async (userId: string) => {
    await supabase.from('bans').insert({ user_id: userId, reason: 'Banned by admin' })
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  if (loading) return <p className="text-gray-500">Loading users...</p>

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Users ({users.length})</h3>
      {users.map((user) => (
        <div key={user.id} className="p-4 border rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{user.username ?? 'No username'}</p>
            <p className="text-xs text-gray-400">{user.role} · {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          {user.role !== 'admin' && (
            <button
              onClick={() => banUser(user.id)}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
              title="Ban user"
            >
              <Ban size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
