import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProject } from '../context/ProjectContext'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../services/notificationService'
import {
  LayoutDashboard,
  Bug,
  PlayCircle,
  BarChart2,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Folder,
  Search,
  ClipboardList,
} from 'lucide-react'
import { authService } from '../services/authService'
import axios from 'axios'

interface Props {
  children: React.ReactNode
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Bugs', icon: Bug, path: '/bugs' },
  { label: 'Test Runs', icon: PlayCircle, path: '/test-runs' },
  { label: 'Analytics', icon: BarChart2, path: '/analytics' },
]

const API_URL = 'http://localhost:5000/api'

const Layout = ({ children }: Props) => {
  const { projects, selectedProject, setSelectedProject } = useProject()
  const navigate = useNavigate()
  const location = useLocation()
  const user = authService.getUser()
  const [collapsed, setCollapsed] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ bugs: any[], testRuns: any[], testCases: any[] }>({ bugs: [], testRuns: [], testCases: [] })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getNotifications()
        setNotifications(data)
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      }
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !selectedProject?.id) {
      setSearchResults({ bugs: [], testRuns: [], testCases: [] })
      setShowSearchResults(false)
      return
    }

    setSearching(true)
    const headers = { Authorization: `Bearer ${authService.getToken()}` }
    const projectId = selectedProject.id

    try {
      const [bugsRes, testRunsRes, testCasesRes] = await Promise.all([
        axios.get(`${API_URL}/bugs?projectId=${projectId}&search=${query}`, { headers }),
        axios.get(`${API_URL}/test-runs?projectId=${projectId}`, { headers }),
        axios.get(`${API_URL}/test-cases?projectId=${projectId}`, { headers }),
      ])

      const bugs = bugsRes.data.bugs || []
      const allTestRuns = testRunsRes.data.testRuns || []
      const allTestCases = testCasesRes.data.testCases || []

      const testRuns = allTestRuns.filter((r: any) =>
        r.name.toLowerCase().includes(query.toLowerCase())
      )

      const matchedTestCases = allTestCases.filter((tc: any) =>
        tc.title.toLowerCase().includes(query.toLowerCase())
      )

      const testCases = matchedTestCases
        .map((tc: any) => {
          const runsContainingCase = allTestRuns
            .map((run: any) => {
              const result = (run.testResults || []).find((r: any) => r.testCaseId === tc.id)
              return result ? { run, result } : null
            })
            .filter(Boolean) as { run: any; result: any }[]

          if (runsContainingCase.length === 0) return null

          const mostRecent = runsContainingCase.sort(
            (a, b) => new Date(b.run.createdAt).getTime() - new Date(a.run.createdAt).getTime()
          )[0]

          return {
            ...tc,
            runId: mostRecent.run.id,
            runName: mostRecent.run.name,
            resultId: mostRecent.result.id,
          }
        })
        .filter(Boolean)

      setSearchResults({
        bugs: bugs.slice(0, 3),
        testRuns: testRuns.slice(0, 3),
        testCases: testCases.slice(0, 3),
      })
      setShowSearchResults(true)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setSearching(false)
    }
  }, [selectedProject])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!search.trim()) {
      setSearchResults({ bugs: [], testRuns: [], testCases: [] })
      setShowSearchResults(false)
      return
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(search)
    }, 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [search, performSearch])

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev)
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  // Optimistically mark a single notification as read when the row is clicked.
  // If the API call fails the UI stays marked read (acceptable trade-off —
  // it will correct itself on the next 30s poll).
  const handleMarkOneRead = async (notification: Notification) => {
    if (notification.read) return
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
    try {
      await notificationService.markAsRead(notification.id)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleSearchResultClick = (path: string, state?: Record<string, any>) => {
    setSearch('')
    setShowSearchResults(false)
    navigate(path, state ? { state } : undefined)
  }

  const hasUnread = notifications.some(n => !n.read)
  const previewNotifications = notifications.slice(0, 5)
  const hasMore = notifications.length > 5
  const hasSearchResults = searchResults.bugs.length > 0 || searchResults.testRuns.length > 0 || searchResults.testCases.length > 0

  return (
    <div className={darkMode ? 'dark' : ''} style={{ colorScheme: darkMode ? 'dark' : 'light' }}>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">

        {/* Top Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-4 flex-shrink-0 z-10">

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">TB</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">TestBridge</span>
          </div>

          {/* Search bar */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md" ref={searchRef}>
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={`Search in ${selectedProject?.name || 'project'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-10 left-0 right-0 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50 overflow-hidden max-h-96 overflow-y-auto">
                  {searching ? (
                    <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">Searching...</div>
                  ) : !hasSearchResults ? (
                    <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
                      No results found for "{search}"
                    </div>
                  ) : (
                    <>
                      {searchResults.bugs.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                              <Bug size={11} />
                              Bugs
                            </p>
                          </div>
                          {searchResults.bugs.map((bug: any) => (
                            <button
                              key={bug.id}
                              onClick={() => handleSearchResultClick('/bugs', { selectedBugId: bug.id })}
                              className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left border-b border-gray-50 dark:border-gray-800"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-white truncate">{bug.title}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{bug.severity} · {bug.status}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.testRuns.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                              <PlayCircle size={11} />
                              Test Runs
                            </p>
                          </div>
                          {searchResults.testRuns.map((run: any) => (
                            <button
                              key={run.id}
                              onClick={() => handleSearchResultClick(`/test-runs/${run.id}`)}
                              className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left border-b border-gray-50 dark:border-gray-800"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-white truncate">{run.name}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{run.status}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.testCases.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                              <ClipboardList size={11} />
                              Test Cases
                            </p>
                          </div>
                          {searchResults.testCases.map((tc: any) => (
                            <button
                              key={tc.id}
                              onClick={() => handleSearchResultClick(`/test-runs/${tc.runId}`, { selectedResultId: tc.resultId })}
                              className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left border-b border-gray-50 dark:border-gray-800"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-white truncate">{tc.title}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{tc.priority} priority · in {tc.runName}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2 flex-shrink-0">

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white transition"
              title="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Bell size={18} />
                {hasUnread && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    {hasUnread && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                        <Bell size={28} className="mb-2 opacity-30" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      <>
                        {previewNotifications.map(notification => (
                          <div
                            key={notification.id}
                            onClick={() => handleMarkOneRead(notification)}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 transition ${
                              notification.read
                                ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                : 'bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/20 cursor-pointer'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-snug ${
                                !notification.read
                                  ? 'font-semibold text-gray-900 dark:text-white'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))}
                        {hasMore && (
                          <button
                            onClick={() => {
                              setShowNotifications(false)
                              navigate('/notifications')
                            }}
                            className="w-full px-4 py-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center border-t border-gray-100 dark:border-gray-800"
                          >
                            View all notifications
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 bg-indigo-900 rounded-full flex items-center justify-center hover:ring-2 hover:ring-indigo-400 transition"
              >
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                        <span className="inline-block text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium mt-1">
                          {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/settings'); setShowProfileMenu(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                    >
                      <Settings size={16} className="text-gray-400" />
                      Settings
                    </button>
                    <button
                      onClick={() => { navigate('/projects'); setShowProfileMenu(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                    >
                      <Folder size={16} className="text-gray-400" />
                      Projects
                    </button>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800" />
                  <div className="py-1">
                    <button
                      onClick={() => { handleLogout(); setShowProfileMenu(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Body: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          <aside className={`
            flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex-shrink-0
            ${collapsed ? 'w-16' : 'w-56'}
          `}>
            <div className={`border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'px-2 py-3' : 'px-3 py-3'}`}>
              {collapsed ? (
                <button
                  onClick={() => navigate('/projects')}
                  className={`w-full flex items-center justify-center p-2 rounded-lg transition
                    ${location.pathname === '/projects'
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  <Folder size={18} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/projects')}
                    className={`w-full flex items-center gap-2 mb-2 px-1 py-1 rounded-lg transition text-left
                      ${location.pathname === '/projects'
                        ? 'text-indigo-700 dark:text-indigo-400'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                  >
                    <Folder size={14} />
                    <p className="text-xs font-medium uppercase tracking-wide">Projects</p>
                  </button>
                  <select
                    value={selectedProject?.id || ''}
                    onChange={(e) => {
                      const project = projects.find(p => p.id === e.target.value)
                      if (project) setSelectedProject(project)
                    }}
                    className="w-full text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path ||
                  (item.path === '/test-runs' && location.pathname.startsWith('/test-runs'))
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition
                      ${isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                )
              })}
            </nav>

            <div className="px-2 py-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}

export default Layout