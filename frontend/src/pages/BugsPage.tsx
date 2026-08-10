import { useState, useEffect } from 'react'
import { Plus, Search, Bug as BugIcon, Trash2, Pencil, Check, X, ChevronRight } from 'lucide-react'
import { bugService } from '../services/bugService'
import type { Bug, CreateBugData } from '../services/bugService'
import { useProject } from '../context/ProjectContext'
import { motion, AnimatePresence } from 'framer-motion'

const severityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CLOSED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  RETEST: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const BugsPage = () => {
  const { selectedProject, refreshProjects } = useProject()
  const [bugs, setBugs] = useState<Bug[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null)
  const [editing, setEditing] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    priority: 'MEDIUM',
    status: 'OPEN',
    environment: '',
  })

  const [form, setForm] = useState<CreateBugData>({
    title: '',
    description: '',
    severity: 'MEDIUM',
    priority: 'MEDIUM',
    status: 'OPEN',
    environment: '',
    projectId: selectedProject?.id || '',
  })

  const fetchBugs = async () => {
    if (!selectedProject?.id) {
      setBugs([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await bugService.getBugs({
        projectId: selectedProject.id,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        search: search || undefined,
      })
      setBugs(data)
      // Refresh selected bug if one is selected
      if (selectedBug) {
        const updated = data.find((b: Bug) => b.id === selectedBug.id)
        if (updated) setSelectedBug(updated)
      }
    } catch (err) {
      console.error('Failed to fetch bugs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBugs()
  }, [selectedProject, statusFilter, severityFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBugs()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await bugService.createBug({ ...form, projectId: selectedProject?.id || '' })
      setShowForm(false)
      setForm({ title: '', description: '', severity: 'MEDIUM', priority: 'MEDIUM', status: 'OPEN', environment: '', projectId: selectedProject?.id || '' })
      fetchBugs()
      refreshProjects()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bug')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (bugId: string, newStatus: string) => {
    try {
      await bugService.updateBug(bugId, { status: newStatus })
      fetchBugs()
    } catch (err) {
      console.error('Failed to update bug:', err)
    }
  }

  const handleDelete = async (bugId: string) => {
    if (!confirm('Are you sure you want to delete this bug?')) return
    try {
      await bugService.deleteBug(bugId)
      if (selectedBug?.id === bugId) setSelectedBug(null)
      fetchBugs()
      refreshProjects()
    } catch (err) {
      console.error('Failed to delete bug:', err)
    }
  }

  const handleStartEdit = (bug: Bug) => {
    setEditForm({
      title: bug.title,
      description: bug.description || '',
      severity: bug.severity,
      priority: bug.priority,
      status: bug.status,
      environment: bug.environment || '',
    })
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedBug?.id) return
    setSavingEdit(true)
    try {
      await bugService.updateBug(selectedBug.id, editForm)
      setEditing(false)
      fetchBugs()
    } catch (err) {
      console.error('Failed to update bug:', err)
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bugs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{bugs.length} total bugs tracked</p>
        </motion.div>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          Report Bug
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex flex-wrap gap-3 mb-6"
      >
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bugs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="RETEST">Retest</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Severity</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </motion.div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading bugs...</div>
      ) : bugs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-center py-12"
        >
          <BugIcon size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No bugs found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Report your first bug to get started</p>
        </motion.div>
      ) : (
        <div className="flex flex-1 gap-4 min-h-0">

          {/* Left panel - bugs list */}
          <motion.div
            animate={{ width: selectedBug ? '40%' : '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
          >
            <div className="overflow-y-auto flex-1">
              <AnimatePresence>
                {bugs.map((bug, index) => {
                  const isSelected = selectedBug?.id === bug.id
                  return (
                    <motion.div
                      key={bug.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.25 }}
                      onClick={() => {
                        setSelectedBug(isSelected ? null : bug)
                        setEditing(false)
                      }}
                      className={`flex items-center justify-between px-5 py-4 cursor-pointer transition ${
                        index !== bugs.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                      } ${isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <span className="text-gray-400 dark:text-gray-600 text-sm font-mono mt-0.5">#{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{bug.title}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {bug.project?.name} · {new Date(bug.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${severityColors[bug.severity]}`}>
                          {bug.severity.charAt(0) + bug.severity.slice(1).toLowerCase()}
                        </span>
                        <ChevronRight
                          size={14}
                          className={`text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right panel - bug detail */}
          <AnimatePresence>
            {selectedBug && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-[60%] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
              >
                {/* Detail header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug flex-1">
                        {selectedBug.title}
                      </h2>
                    )}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {editing ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            disabled={savingEdit}
                            className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 transition disabled:opacity-50"
                            title="Save"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditing(false)}
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 transition"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(selectedBug)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(selectedBug.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => setSelectedBug(null)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition"
                            title="Close"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Severity + Status badges */}
                  {!editing && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[selectedBug.severity]}`}>
                        {selectedBug.severity.charAt(0) + selectedBug.severity.slice(1).toLowerCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[selectedBug.status]}`}>
                        {selectedBug.status.replace('_', ' ').charAt(0) + selectedBug.status.replace('_', ' ').slice(1).toLowerCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status controls */}
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Status</p>
                  {editing ? (
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="RETEST">Retest</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'RETEST', 'CLOSED'].map(status => {
                        const isActive = selectedBug.status === status
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(selectedBug.id, status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                              isActive
                                ? statusColors[status] + ' border-current'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {status.replace('_', ' ').charAt(0) + status.replace('_', ' ').slice(1).toLowerCase()}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Detail content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                  {/* Severity & Priority */}
                  {editing && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Severity</p>
                        <select
                          value={editForm.severity}
                          onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}
                          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Priority</p>
                        <select
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Description</p>
                    {editing ? (
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Steps to reproduce, expected vs actual behaviour..."
                        rows={4}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedBug.description || <span className="text-gray-400 italic">No description</span>}
                      </p>
                    )}
                  </div>

                  {/* Environment */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Environment</p>
                    {editing ? (
                      <select
                        value={editForm.environment}
                        onChange={(e) => setEditForm({ ...editForm, environment: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select...</option>
                        <option value="Production">Production</option>
                        <option value="Staging">Staging</option>
                        <option value="Development">Development</option>
                        <option value="Qa">QA</option>
                      </select>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedBug.environment || <span className="text-gray-400 italic">Not specified</span>}
                      </p>
                    )}
                  </div>

                  {/* Reporter */}
                  {!editing && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Reported By</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedBug.reporter?.name}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Report Bug Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Report a Bug</h2>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Brief description of the bug"
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Steps to reproduce, expected vs actual behaviour..."
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                    <select
                      value={form.severity}
                      onChange={(e) => setForm({ ...form, severity: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="RETEST">Retest</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Environment</label>
                    <select
                      value={form.environment}
                      onChange={(e) => setForm({ ...form, environment: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select...</option>
                      <option value="Production">Production</option>
                      <option value="Staging">Staging</option>
                      <option value="Development">Development</option>
                      <option value="Qa">QA</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Reporting...' : 'Report Bug'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default BugsPage