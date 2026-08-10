import { useState, useEffect } from 'react'
import axios from 'axios'
import { authService } from '../services/authService'
import { Bug, PlayCircle, CheckCircle } from 'lucide-react'
import { useProject } from '../context/ProjectContext'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  openBugs: number
  criticalBugs: number
  activeTestRuns: number
  passRate: number
  recentBugs: any[]
  activeRuns: any[]
}

const severityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { selectedProject } = useProject()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedProject) return
      try {
        const response = await axios.get(`http://localhost:5000/api/dashboard/stats?projectId=${selectedProject.id}`, {
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
  }, [selectedProject])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        Loading dashboard...
      </div>
    )
  }

  const activeRuns = (stats?.activeRuns || []).slice(0, 10)
  const recentBugs = (stats?.recentBugs || []).slice(0, 10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Overview of your QA operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open Bugs', value: stats?.openBugs ?? 0, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', icon: <Bug size={20} className="text-red-500" /> },
          { label: 'Critical Bugs', value: stats?.criticalBugs ?? 0, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: <Bug size={20} className="text-orange-500" /> },
          { label: 'Active Test Runs', value: stats?.activeTestRuns ?? 0, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: <PlayCircle size={20} className="text-blue-500" /> },
          { label: 'Pass Rate', value: `${stats?.passRate ?? 0}%`, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', icon: <CheckCircle size={20} className="text-green-500" /> },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Active Test Runs</h2>
            <button
              onClick={() => navigate('/test-runs?status=IN_PROGRESS')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              View all
            </button>
          </div>
          {activeRuns.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No active test runs</p>
          ) : (
            <div className="space-y-4">
              {activeRuns.map((run, i) => {
                const total = run.testResults?.length || 0
                const passed = run.testResults?.filter((r: any) => r.status === 'PASS').length || 0
                const rate = total > 0 ? Math.round((passed / total) * 100) : 0
                return (
                  <motion.div
                    key={run.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05, duration: 0.25 }}
                    onClick={() => navigate(`/test-runs/${run.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition">{run.name}</span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        In Progress
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{total} cases · {rate}%</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Bugs</h2>
            <button
              onClick={() => navigate('/bugs')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              View all
            </button>
          </div>
          {recentBugs.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No bugs reported yet</p>
          ) : (
            <div className="space-y-3">
              {recentBugs.map((bug: any, i: number) => (
                <motion.div
                  key={bug.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.25 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{bug.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {bug.reporter?.name} · {new Date(bug.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${severityColors[bug.severity]}`}>
                    {bug.severity.charAt(0) + bug.severity.slice(1).toLowerCase()}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default DashboardPage