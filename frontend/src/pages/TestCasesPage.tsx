import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, CheckCircle, XCircle, Clock, Ban, ChevronRight, ClipboardList, Trash2, Pencil, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { authService } from '../services/authService'
import { useProject } from '../context/ProjectContext'

const API_URL = 'http://localhost:5000/api'

const statusColors: Record<string, string> = {
  PASS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  FAIL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  BLOCKED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PENDING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const statusIcons: Record<string, any> = {
  PASS: CheckCircle,
  FAIL: XCircle,
  BLOCKED: Ban,
  PENDING: Clock,
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TestCasesPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedProject } = useProject()
  const [testRun, setTestRun] = useState<any>(null)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [availableTestCases, setAvailableTestCases] = useState<any[]>([])

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    steps: '',
    expectedResult: '',
    priority: 'MEDIUM',
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    steps: '',
    expectedResult: '',
    priority: 'MEDIUM',
  })

  const resultRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const handledSelectKey = useRef<string | null>(null)

  const headers = { Authorization: `Bearer ${authService.getToken()}` }

  const fetchTestRun = async () => {
    try {
      const response = await axios.get(`${API_URL}/test-runs/${id}`, { headers })
      setTestRun(response.data.testRun)
      // Refresh selected result if one is selected
      if (selectedResult) {
        const updated = response.data.testRun.testResults?.find(
          (r: any) => r.id === selectedResult.id
        )
        if (updated) setSelectedResult(updated)
      }
    } catch (err) {
      console.error('Failed to fetch test run:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTestCases = async () => {
    if (!selectedProject?.id) return
    try {
      const response = await axios.get(
        `${API_URL}/test-cases?projectId=${selectedProject.id}`,
        { headers }
      )
      setAvailableTestCases(response.data.testCases || [])
    } catch (err) {
      console.error('Failed to fetch test cases:', err)
    }
  }

  useEffect(() => {
    fetchTestRun()
    fetchAvailableTestCases()
  }, [id])

  const prevProjectIdRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const currentId = selectedProject?.id
    if (
      prevProjectIdRef.current !== undefined &&
      currentId !== undefined &&
      currentId !== prevProjectIdRef.current
    ) {
      navigate('/test-runs')
    }
    if (currentId !== undefined) {
      prevProjectIdRef.current = currentId
    }
  }, [selectedProject, navigate])

  useEffect(() => {
    const state = location.state as { selectedResultId?: string } | null
    if (!state?.selectedResultId || !testRun || handledSelectKey.current === location.key) return
    const result = (testRun.testResults || []).find((r: any) => r.id === state.selectedResultId)
    if (!result) return
    setSelectedResult(result)
    setEditing(false)
    handledSelectKey.current = location.key
    setTimeout(() => {
      resultRefs.current[result.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [testRun, location])

  const handleAddTestCase = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const tcResponse = await axios.post(`${API_URL}/test-cases`, {
        ...form,
        projectId: selectedProject?.id,
        status: 'ACTIVE',
      }, { headers })

      const newTestCase = tcResponse.data.testCase

      await axios.post(`${API_URL}/test-runs/${id}/results`, {
        testCaseId: newTestCase.id,
        status: 'PENDING',
      }, { headers })

      setShowAddForm(false)
      setForm({ title: '', description: '', steps: '', expectedResult: '', priority: 'MEDIUM' })
      fetchTestRun()
    } catch (err) {
      console.error('Failed to add test case:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddExistingTestCase = async (testCaseId: string) => {
    try {
      await axios.post(`${API_URL}/test-runs/${id}/results`, {
        testCaseId,
        status: 'PENDING',
      }, { headers })
      fetchTestRun()
    } catch (err) {
      console.error('Failed to add existing test case:', err)
    }
  }

  const handleUpdateStatus = async (resultId: string, status: string) => {
    try {
      await axios.put(`${API_URL}/test-runs/${id}/results/${resultId}`, { status }, { headers })
      setSelectedResult((prev: any) => prev ? { ...prev, status } : prev)
      fetchTestRun()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleDeleteTestCase = async (result: any) => {
    if (!confirm('Are you sure you want to remove this test case from the run?')) return
    try {
      await axios.delete(`${API_URL}/test-cases/${result.testCase.id}`, { headers })
      setSelectedResult(null)
      fetchTestRun()
    } catch (err) {
      console.error('Failed to delete test case:', err)
    }
  }

  const handleStartEdit = (result: any) => {
    setEditForm({
      title: result.testCase?.title || '',
      description: result.testCase?.description || '',
      steps: result.testCase?.steps || '',
      expectedResult: result.testCase?.expectedResult || '',
      priority: result.testCase?.priority || 'MEDIUM',
    })
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedResult?.testCase?.id) return
    setSavingEdit(true)
    try {
      await axios.put(
        `${API_URL}/test-cases/${selectedResult.testCase.id}`,
        editForm,
        { headers }
      )
      setEditing(false)
      fetchTestRun()
    } catch (err) {
      console.error('Failed to update test case:', err)
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        Loading test run...
      </div>
    )
  }

  if (!testRun) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        Test run not found
      </div>
    )
  }

  const results = testRun.testResults || []
  const passCount = results.filter((r: any) => r.status === 'PASS').length
  const failCount = results.filter((r: any) => r.status === 'FAIL').length
  const blockedCount = results.filter((r: any) => r.status === 'BLOCKED').length
  const pendingCount = results.filter((r: any) => r.status === 'PENDING').length
  const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 0

  const alreadyAddedIds = results.map((r: any) => r.testCaseId)
  const filteredAvailable = availableTestCases.filter(
    (tc: any) => !alreadyAddedIds.includes(tc.id)
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/test-runs')}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition mt-0.5"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{testRun.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {testRun.project?.name} · {results.length} test cases · {passRate}% pass rate
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          Add Test Case
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
        <div className="flex items-center gap-6 mb-3">
          <span className="text-xs font-medium text-green-600 dark:text-green-400">{passCount} Pass</span>
          <span className="text-xs font-medium text-red-600 dark:text-red-400">{failCount} Fail</span>
          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">{blockedCount} Blocked</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{pendingCount} Pending</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 flex overflow-hidden">
          {passCount > 0 && (
            <div className="bg-green-500 h-2" style={{ width: `${(passCount / results.length) * 100}%` }} />
          )}
          {failCount > 0 && (
            <div className="bg-red-500 h-2" style={{ width: `${(failCount / results.length) * 100}%` }} />
          )}
          {blockedCount > 0 && (
            <div className="bg-yellow-500 h-2" style={{ width: `${(blockedCount / results.length) * 100}%` }} />
          )}
          {pendingCount > 0 && (
            <div className="bg-gray-300 dark:bg-gray-600 h-2" style={{ width: `${(pendingCount / results.length) * 100}%` }} />
          )}
        </div>
      </div>

      {/* Main content - master detail */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* Left panel - test cases list */}
        <motion.div
          animate={{ width: selectedResult ? '40%' : '100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
        >
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <ClipboardList size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No test cases yet</p>
              <p className="text-xs mt-1">Click "Add Test Case" to get started</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {results.map((result: any, index: number) => {
                const StatusIcon = statusIcons[result.status]
                const isSelected = selectedResult?.id === result.id
                return (
                  <motion.button
                    key={result.id}
                    ref={(el) => { resultRefs.current[result.id] = el }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.25 }}
                    onClick={() => {
                      setSelectedResult(isSelected ? null : result)
                      setEditing(false)
                    }}
                    className={`w-full flex items-center gap-3 px-5 py-4 text-left transition border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <StatusIcon
                      size={16}
                      className={
                        result.status === 'PASS' ? 'text-green-500 flex-shrink-0' :
                        result.status === 'FAIL' ? 'text-red-500 flex-shrink-0' :
                        result.status === 'BLOCKED' ? 'text-yellow-500 flex-shrink-0' :
                        'text-gray-400 flex-shrink-0'
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.testCase?.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {result.testCase?.priority} priority
                      </p>
                    </div>
                    <ChevronRight
                      size={14}
                      className={`text-gray-400 flex-shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                    />
                  </motion.button>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Right panel - detail view */}
        <AnimatePresence>
          {selectedResult && (
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
                      {selectedResult.testCase?.title}
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
                          onClick={() => handleStartEdit(selectedResult)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTestCase(selectedResult)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => setSelectedResult(null)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition"
                          title="Close"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editing ? (
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="mt-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                ) : (
                  selectedResult.testCase?.priority && (
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-2 ${priorityColors[selectedResult.testCase.priority]}`}>
                      {selectedResult.testCase.priority}
                    </span>
                  )
                )}
              </div>

              {/* Status controls */}
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Status</p>
                <div className="flex gap-2 flex-wrap">
                  {['PASS', 'FAIL', 'BLOCKED', 'PENDING'].map(status => {
                    const Icon = statusIcons[status]
                    const isActive = selectedResult.status === status
                    return (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedResult.id, status)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                          isActive
                            ? statusColors[status] + ' border-current'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon size={12} />
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Detail content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Description */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Description</p>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Brief overview..."
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedResult.testCase?.description || <span className="text-gray-400 italic">No description</span>}
                    </p>
                  )}
                </div>

                {/* Steps */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Steps</p>
                  {editing ? (
                    <textarea
                      value={editForm.steps}
                      onChange={(e) => setEditForm({ ...editForm, steps: e.target.value })}
                      rows={5}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  ) : (
                    <div className="space-y-1.5">
                      {selectedResult.testCase?.steps?.split('\n').map((step: string, i: number) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5 flex-shrink-0">{i + 1}.</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{step.replace(/^\d+\.\s*/, '')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expected Result */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Expected Result</p>
                  {editing ? (
                    <textarea
                      value={editForm.expectedResult}
                      onChange={(e) => setEditForm({ ...editForm, expectedResult: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedResult.testCase?.expectedResult}</p>
                  )}
                </div>

                {selectedResult.notes && !editing && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedResult.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Test Case Modal */}
      <AnimatePresence>
        {showAddForm && (
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
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Add Test Case</h2>

              {filteredAvailable.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Add Existing</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    {filteredAvailable.map((tc: any) => (
                      <button
                        key={tc.id}
                        onClick={() => {
                          handleAddExistingTestCase(tc.id)
                          setShowAddForm(false)
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{tc.title}</span>
                        <Plus size={14} className="text-indigo-500 flex-shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">or create new</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              )}

              <form onSubmit={handleAddTestCase} className="space-y-4">
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
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Test Case'}
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

export default TestCasesPage