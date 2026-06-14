import { useState, useEffect } from 'react'
import { Plus, Search, Bug as BugIcon } from 'lucide-react'
import { bugService } from '../services/bugService'
import type { Bug, CreateBugData } from '../services/bugService'
import { useProject } from '../context/ProjectContext'

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
  const { selectedProject } = useProject()
  const [bugs, setBugs] = useState<Bug[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
    try {
      setLoading(true)
      const data = await bugService.getBugs({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        search: search || undefined,
      })
      setBugs(data)
    } catch (err) {
      console.error('Failed to fetch bugs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBugs() }, [statusFilter, severityFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBugs()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await bugService.createBug(form)
      setShowForm(false)
      setForm({ title: '', description: '', severity: 'MEDIUM', priority: 'MEDIUM', status: 'OPEN', environment: '', projectId: selectedProject?.id || '' })
      fetchBugs()
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bugs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{bugs.length} total bugs tracked</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          Report Bug
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
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
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading bugs...</div>
      ) : bugs.length === 0 ? (
        <div className="text-center py-12">
          <BugIcon size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No bugs found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Report your first bug to get started</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {bugs.map((bug, index) => (
            <div
              key={bug.id}
              className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                index !== bugs.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
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
              <div className="flex items-center gap-2 ml-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${severityColors[bug.severity]}`}>
                  {bug.severity.charAt(0) + bug.severity.slice(1).toLowerCase()}
                </span>
                <select
                  value={bug.status}
                  onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none ${statusColors[bug.status]}`}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="RETEST">Retest</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                  {bug.reporter?.name?.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6">
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
          </div>
        </div>
      )}
    </div>
  )
}

export default BugsPage