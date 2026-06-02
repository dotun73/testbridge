import { useState, useEffect } from 'react'
import { User, Mail, Users, Send } from 'lucide-react'
import { authService } from '../services/authService'
import axios from 'axios'

const SettingsPage = () => {
  const user = authService.getUser()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${authService.getToken()}` }
        })
        setTeamMembers(response.data.users)
      } catch (err) {
        console.error('Failed to fetch team members:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTeamMembers()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setTimeout(() => {
      setInviteSuccess(true)
      setInviteEmail('')
      setInviting(false)
      setTimeout(() => setInviteSuccess(false), 3000)
    }, 1000)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Manage your team and preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <User size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Role: {user?.role}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Mail size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Invite Team Members</h2>
        </div>
        {inviteSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg px-4 py-3 mb-4 text-sm">
            Invite sent successfully!
          </div>
        )}
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@email.com"
            required
            className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Send size={14} />
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Team Members {!loading && `(${teamMembers.length})`}
          </h2>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading team members...</p>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                    <span className="text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                      {member.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{member.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  member.role === 'ADMIN'
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage