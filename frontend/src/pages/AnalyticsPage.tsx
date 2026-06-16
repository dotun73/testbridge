import { useState, useEffect } from 'react'
import axios from 'axios'
import { authService } from '../services/authService'
import { useProject } from '../context/ProjectContext'

const AnalyticsPage = () => {
  const { selectedProject } = useProject()
  const [bugs, setBugs] = useState<any[]>([])
  const [testRuns, setTestRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedProject?.id) {
        setBugs([])
        setTestRuns([])
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const headers = { Authorization: `Bearer ${authService.getToken()}` }
        const [bugsRes, runsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/bugs?projectId=${selectedProject.id}`, { headers }),
          axios.get(`http://localhost:5000/api/test-runs?projectId=${selectedProject.id}`, { headers }),
        ])
        setBugs(bugsRes.data.bugs)
        setTestRuns(runsRes.data.testRuns)
      } catch (err) {
        console.error('Failed to fetch analytics data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedProject])

  const severityData = [
    { label: 'Critical', value: bugs.filter(b => b.severity === 'CRITICAL').length, color: 'bg-red-500' },
    { label: 'High', value: bugs.filter(b => b.severity === 'HIGH').length, color: 'bg-orange-500' },
    { label: 'Medium', value: bugs.filter(b => b.severity === 'MEDIUM').length, color: 'bg-yellow-500' },
    { label: 'Low', value: bugs.filter(b => b.severity === 'LOW').length, color: 'bg-green-500' },
  ]

  const statusData = [
    { label: 'Open', value: bugs.filter(b => b.status === 'OPEN').length, color: 'bg-red-400' },
    { label: 'In Progress', value: bugs.filter(b => b.status === 'IN_PROGRESS').length, color: 'bg-blue-400' },
    { label: 'In Review', value: bugs.filter(b => b.status === 'IN_REVIEW').length, color: 'bg-purple-400' },
    { label: 'Retest', value: bugs.filter(b => b.status === 'RETEST').length, color: 'bg-yellow-400' },
    { label: 'Closed', value: bugs.filter(b => b.status === 'CLOSED').length, color: 'bg-green-400' },
  ]

  const passRateData = testRuns.map(run => {
    const total = run.testResults?.length || 0
    const passed = run.testResults?.filter((r: any) => r.status === 'PASS').length || 0
    const rate = total > 0 ? Math.round((passed / total) * 100) : 0
    return { name: run.name, rate }
  })

  const donutTotal = severityData.reduce((sum, d) => sum + d.value, 0)
  const maxStatus = Math.max(...statusData.map(d => d.value), 1)
  let cumulativePercent = 0
  const circumference = 2 * Math.PI * 60
  const donutSegments = severityData
    .filter(d => d.value > 0)
    .map(d => {
      const percent = (d.value / donutTotal) * 100
      const segment = { ...d, percent, offset: cumulativePercent }
      cumulativePercent += percent
      return segment
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        Loading analytics...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">QA metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bug Severity Distribution</h2>
          {donutTotal === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">No data yet</div>
          ) : (
            <div className="flex items-center justify-center gap-8">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="60" fill="none" stroke="#f3f4f6" strokeWidth="20" />
                {donutSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="80" cy="80" r="60"
                    fill="none"
                    stroke={['#ef4444', '#f97316', '#eab308', '#22c55e'][i]}
                    strokeWidth="20"
                    strokeDasharray={`${(seg.percent / 100) * circumference} ${circumference}`}
                    strokeDashoffset={-((seg.offset / 100) * circumference)}
                    transform="rotate(-90 80 80)"
                  />
                ))}
                <text x="80" y="75" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#111827">{donutTotal}</text>
                <text x="80" y="95" textAnchor="middle" fontSize="11" fill="#6b7280">total</text>
              </svg>
              <div className="space-y-2">
                {severityData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${d.color}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{d.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white ml-auto pl-4">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bug Status Overview</h2>
          {bugs.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">No data yet</div>
          ) : (
            <div className="space-y-3 pt-2">
              {statusData.filter(d => d.value > 0).map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{d.label}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{d.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className={`${d.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${(d.value / maxStatus) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bug Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Bugs', value: bugs.length, color: 'text-gray-900 dark:text-white' },
              { label: 'Open', value: bugs.filter(b => b.status === 'OPEN').length, color: 'text-red-500' },
              { label: 'Closed', value: bugs.filter(b => b.status === 'CLOSED').length, color: 'text-green-500' },
              { label: 'Critical', value: bugs.filter(b => b.severity === 'CRITICAL').length, color: 'text-red-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Test Run Pass Rates</h2>
          {passRateData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">No data yet</div>
          ) : (
            <div className="space-y-3 pt-2">
              {passRateData.map((run, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span className="truncate flex-1 mr-2">{run.name}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{run.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${run.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage