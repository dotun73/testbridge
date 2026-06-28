import { useState, useEffect, useRef } from 'react'
import { User, Mail, Users, Send, Camera, Pencil, Check, X } from 'lucide-react'
import { authService } from '../services/authService'
import { motion } from 'framer-motion'
import axios from 'axios'

const SettingsPage = () => {
  const [user, setUser] = useState(() => authService.getUser())
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  // Profile editing state
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(user?.name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSaveName = async () => {
    if (!newName.trim() || newName === user?.name) {
      setEditingName(false)
      return
    }
    setSavingProfile(true)
    setProfileError('')
    try {
      const updatedUser = await authService.updateProfile({ name: newName.trim() })
      setUser(updatedUser)
      setEditingName(false)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      setProfileError('Failed to update name')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Image must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      setSavingProfile(true)
      setProfileError('')
      try {
        const updatedUser = await authService.updateProfile({ avatar: base64 })
        setUser(updatedUser)
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 3000)
      } catch (err: any) {
        setProfileError('Failed to upload avatar')
      } finally {
        setSavingProfile(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = async () => {
    setSavingProfile(true)
    setProfileError('')
    try {
      const updatedUser = await authService.updateProfile({ avatar: '' })
      setUser(updatedUser)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      setProfileError('Failed to remove avatar')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Manage your team and preferences</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-4"
      >
        <div className="flex items-center gap-3 mb-5">
          <User size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Profile</h2>
        </div>

        {profileSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg px-4 py-3 mb-4 text-sm">
            Profile updated successfully!
          </div>
        )}

        {profileError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
            {profileError}
          </div>
        )}

        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-900 flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-xl font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={savingProfile}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50"
              title="Upload photo"
            >
              <Camera size={12} className="text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Name and email */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <div className="flex items-center gap-2 mb-1">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') { setEditingName(false); setNewName(user?.name || '') }
                    }}
                    autoFocus
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingProfile}
                    className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 transition disabled:opacity-50"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNewName(user?.name || '') }}
                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <button
                    onClick={() => { setEditingName(true); setNewName(user?.name || '') }}
                    className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    title="Edit name"
                  >
                    <Pencil size={13} />
                  </button>
                </>
              )}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className="inline-block text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium mt-1">
              {user?.role}
            </span>

            {/* Avatar actions */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={savingProfile}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Upload photo'}
              </button>
              {user?.avatar && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">·</span>
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={savingProfile}
                    className="text-xs text-red-500 dark:text-red-400 hover:underline font-medium disabled:opacity-50"
                  >
                    Remove photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Invite Team Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-4"
      >
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
      </motion.div>

      {/* Team Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
      >
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
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                        {member.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
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
      </motion.div>
    </motion.div>
  )
}

export default SettingsPage