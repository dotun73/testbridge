import { useState, useEffect } from 'react'
import { Plus, PlayCircle, CheckCircle, XCircle, GitBranch } from 'lucide-react'
import { testRunService } from '../services/testRunService'
import type { TestRun, CreateTestRunData } from '../services/testRunService'

const DEFAULT_PROJECT_ID = '53f0a7a7-981b-467b-abf4-bfc16b78bc22'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: PlayCircle },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  ABORTED: { label: 'Aborted', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const tabs = ['All', 'In Progress', 'Completed', 'Aborted']

const getPassRate = (testRun: TestRun) => {
  const results = testRun.testResults
  if (!results || results.length === 0) return 0
  const passed = results.filter(r => r.status === 'PASS').length
  return Math.round((passed / results.length) * 100)
}

const getResultCounts = (testRun: TestRun) => {
  const results = testRun.testResults || []
  return {
    pass: results.filter(r => r.status === 'PASS').length,
    fail: results.filter(r => r.status === 'FAIL').length,
    blocked: results.filter(r => r.status === 'BLOCKED').length,
    pending: results.filter(r => r.status === 'PENDING').length,
  }
}

const TestRunsPage = () => {
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<CreateTestRunData>({
    name: '',
    projectId: DEFAULT_PROJECT_ID,
    githubRef: '',
  })

  const fetchTestRuns = async () => {
    try {
      setLoading(true)
      const statusMap: Record<string, string> = {
        'In Progress': 'IN_PROGRESS',
        'Completed': 'COMPLETED',
        'Aborted': 'ABORTED',
      }
      const data = await testRunService.getTestRuns({
        status: activeTab !== 'All' ? statusMap[activeTab] : undefined,
      })
      setTestRuns(data)
    } catch (err) {
      console.error('Failed to fetch test runs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestRuns()
  }, [activeTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await testRunService.createTestRun(form)
      setShowForm(false)
      setForm({ name: '', projectId: DEFAULT_PROJECT_ID, githubRef: '' })
      fetchTestRuns()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create test run')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await testRunService.updateTestRun(id, { status })
      fetchTestRuns()
    } catch (err) {
      console.error('Failed to update test run:', err)
    }
  }

  const filteredRuns = testRuns

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Runs</h1>
          <p className="text-gray-500 text-sm mt-0.5">{testRuns.length} test runs</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          New Test Run
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Test Run Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading test runs...</div>
      ) : filteredRuns.length === 0 ? (
        <div className="text-center py-12">
          <PlayCircle size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No test runs found</p>
          <p className="text-gray-400 text-sm mt-1">Create your first test run to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRuns.map(run => {
            const config = statusConfig[run.status]
            const StatusIcon = config.icon
            const passRate = getPassRate(run)
            const counts = getResultCounts(run)
            const total = run.testResults?.length || 0

            return (
              <div key={run.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">

                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-indigo-600 leading-snug flex-1 mr-2">
                    {run.name}
                  </h3>
                  <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${config.color}`}>
                    <StatusIcon size={11} />
                    {config.label}
                  </span>
                </div>

                <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                  {run.project?.name}
                </p>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{total} cases · {passRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  {run.githubRef && (
                    <span className="flex items-center gap-1">
                      <GitBranch size={11} />
                      {run.githubRef}
                    </span>
                  )}
                  <span>· {run.executor?.name?.split(' ')[0]}</span>
                  <span>· {new Date(run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>

                {/* Result counts */}
                <div className="flex gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {counts.pass} Pass
                  </span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {counts.fail} Fail
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    {counts.blocked} Block
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    {counts.pending} Pending
                  </span>
                </div>

                {/* Status change */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <select
                    value={run.status}
                    onChange={(e) => handleStatusChange(run.id, e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ABORTED">Aborted</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Test Run Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">New Test Run</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Run Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sprint 25 - Regression Suite"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Ref / Version
                </label>
                <input
                  type="text"
                  value={form.githubRef}
                  onChange={(e) => setForm({ ...form, githubRef: e.target.value })}
                  placeholder="e.g. v2.5.0 or main"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Test Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestRunsPage