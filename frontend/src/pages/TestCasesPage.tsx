import { useState, useEffect } from 'react'
import { Plus, Search, ClipboardList, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { testCaseService } from '../services/testCaseService'
import type { TestCase, CreateTestCaseData } from '../services/testCaseService'
import { useProject } from '../context/ProjectContext'


const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DEPRECATED: 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400',
}

const TestCasesPage = () => {
  const { selectedProject } = useProject()
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [form, setForm] = useState<CreateTestCaseData>({
    title: '',
    description: '',
    steps: '',
    expectedResult: '',
    priority: 'MEDIUM',
    status: 'DRAFT',
    projectId: selectedProject?.id || '',
  })

  const fetchTestCases = async () => {
    if (!selectedProject?.id) {
      setTestCases([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await testCaseService.getTestCases({
        projectId: selectedProject.id,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
      })
      setTestCases(data)
    } catch (err) {
      console.error('Failed to fetch test cases:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestCases()
  }, [selectedProject, statusFilter, priorityFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTestCases()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await testCaseService.createTestCase({
        ...form,
        projectId: selectedProject?.id || ''
      })
      setShowForm(false)
      setForm({
        title: '',
        description: '',
        steps: '',
        expectedResult: '',
        priority: 'MEDIUM',
        status: 'DRAFT',
        projectId: selectedProject?.id || '',
      })
      fetchTestCases()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create test case')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await testCaseService.updateTestCase(id, { status })
      fetchTestCases()
    } catch (err) {
      console.error('Failed to update test case:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test case?')) return
    try {
      await testCaseService.deleteTestCase(id)
      fetchTestCases()
    } catch (err) {
      console.error('Failed to delete test case:', err)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test Cases</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {testCases.length} test cases
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          New Test Case
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search test cases..."
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
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="DEPRECATED">Deprecated</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: testCases.length, color: 'text-gray-900 dark:text-white' },
          { label: 'Active', value: testCases.filter(t => t.status === 'ACTIVE').length, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Draft', value: testCases.filter(t => t.status === 'DRAFT').length, color: 'text-gray-500 dark:text-gray-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Test Case List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading test cases...</div>
      ) : testCases.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No test cases found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create your first test case to get started</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {testCases.map((tc, index) => (
            <div
              key={tc.id}
              className={`${index !== testCases.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
            >
              {/* Test case row */}
              <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-gray-400 dark:text-gray-600 text-sm font-mono flex-shrink-0">
                    TC-{String(index + 1).padStart(3, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {tc.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {tc.project?.name} · {new Date(tc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColors[tc.priority]}`}>
                    {tc.priority.charAt(0) + tc.priority.slice(1).toLowerCase()}
                  </span>

                  <select
                    value={tc.status}
                    onChange={(e) => handleStatusChange(tc.id, e.target.value)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none ${statusColors[tc.status]}`}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DEPRECATED">Deprecated</option>
                  </select>

                  <button
                    onClick={() => toggleExpand(tc.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  >
                    {expandedId === tc.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>

                  <button
                    onClick={() => handleDelete(tc.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === tc.id && (
                <div className="px-5 pb-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                  {tc.description && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{tc.description}</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Steps</p>
                    <div className="space-y-1">
                      {tc.steps.split('\n').map((step, i) => (
                        <p key={i} className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Expected Result</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{tc.expectedResult}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Test Case Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">New Test Case</h2>

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
                  placeholder="e.g. Verify user can login with valid credentials"
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief overview of what this test case covers"
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Steps *</label>
                <textarea
                  required
                  value={form.steps}
                  onChange={(e) => setForm({ ...form, steps: e.target.value })}
                  placeholder={"1. Navigate to login page\n2. Enter valid email\n3. Click Sign In"}
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Result *</label>
                <textarea
                  required
                  value={form.expectedResult}
                  onChange={(e) => setForm({ ...form, expectedResult: e.target.value })}
                  placeholder="What should happen when the steps are followed correctly"
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DEPRECATED">Deprecated</option>
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
                  {submitting ? 'Creating...' : 'Create Test Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestCasesPage