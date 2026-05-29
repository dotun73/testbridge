import { useState, useEffect } from 'react'
import axios from 'axios'
import { authService } from '../services/authService'
import { Bug, PlayCircle, CheckCircle, TrendingUp } from 'lucide-react'

interface DashboardStats {
  openBugs: number
  criticalBugs: number
  activeTestRuns: number
  passRate: number
  recentBugs: any[]
  activeRuns: any[]
}

const severityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${authService.getToken()}` }
        })
        setStats(response.data)
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading dashboard...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Overview of your QA operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Open Bugs</p>
            <p className="text-3xl font-bold text-red-500">{stats?.openBugs ?? 0}</p>
          </div>
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <Bug size={20} className="text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Critical Bugs</p>
            <p className="text-3xl font-bold text-orange-500">{stats?.criticalBugs ?? 0}</p>
          </div>
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
            <Bug size={20} className="text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Active Test Runs</p>
            <p className="text-3xl font-bold text-blue-500">{stats?.activeTestRuns ?? 0}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <PlayCircle size={20} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Pass Rate</p>
            <p className="text-3xl font-bold text-green-500">{stats?.passRate ?? 0}%</p>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle size={20} className="text-green-500" />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Active Test Runs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Active Test Runs</h2>
            <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">View all</span>
          </div>

          {stats?.activeRuns?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No active test runs</p>
          ) : (
            <div className="space-y-4">
              {stats?.activeRuns?.map(run => {
                const total = run.testResults?.length || 0
                const passed = run.testResults?.filter((r: any) => r.status === 'PASS').length || 0
                const rate = total > 0 ? Math.round((passed / total) * 100) : 0
                return (
                  <div key={run.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">{run.name}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        In Progress
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{total} cases · {rate}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Bugs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Bugs</h2>
            <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">View all</span>
          </div>

          {stats?.recentBugs?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No bugs reported yet</p>
          ) : (
            <div className="space-y-3">
              {stats?.recentBugs?.map((bug: any) => (
                <div key={bug.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm text-gray-900 truncate">{bug.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {bug.reporter?.name} · {new Date(bug.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${severityColors[bug.severity]}`}>
                    {bug.severity.charAt(0) + bug.severity.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default DashboardPage