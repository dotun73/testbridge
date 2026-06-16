import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProject } from '../context/ProjectContext'
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
  ChevronDown,
  ClipboardList,
  Folder,
} from 'lucide-react'
import { authService } from '../services/authService'

interface Props {
  children: React.ReactNode
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Projects', icon: Folder, path: '/projects' },
  { label: 'Bugs', icon: Bug, path: '/bugs' },
  { label: 'Test Cases', icon: ClipboardList, path: '/test-cases' },
  { label: 'Test Runs', icon: PlayCircle, path: '/test-runs' },
  { label: 'Analytics', icon: BarChart2, path: '/analytics' },
]

const Layout = ({ children }: Props) => {
  const { projects, selectedProject, setSelectedProject } = useProject()
  const navigate = useNavigate()
  const location = useLocation()
  const user = authService.getUser()
  const [collapsed, setCollapsed] = useState(false)
  const [notifications] = useState(3)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

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
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev)
  }

  return (
    <div className={darkMode ? 'dark' : ''} style={{ colorScheme: darkMode ? 'dark' : 'light' }}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">

        {/* Sidebar */}
        <aside className={`
          flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300
          ${collapsed ? 'w-16' : 'w-56'}
        `}>

          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">TB</span>
            </div>
            {!collapsed && (
              <span className="font-bold text-gray-900 dark:text-white text-sm">TestBridge</span>
            )}
          </div>

          {/* Project Switcher */}
          {!collapsed && (
            <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1.5 uppercase tracking-wide">Project</p>
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
            </div>
          )}

          {/* Nav Items */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
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

          {/* Collapse toggle */}
          <div className="px-2 py-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top Header */}
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-end gap-3">

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white transition"
              title="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <Bell size={18} />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="w-8 h-8 bg-indigo-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.role}</p>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50 overflow-hidden">

                  {/* User info header */}
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

                  {/* Menu items */}
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

                  {/* Divider */}
                  <div className="border-t border-gray-100 dark:border-gray-800" />

                  {/* Logout */}
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
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}

export default Layout