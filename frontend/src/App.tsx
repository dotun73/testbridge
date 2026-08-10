import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import BugsPage from './pages/BugsPage'
import TestRunsPage from './pages/TestRunsPage'
import TestCasesPage from './pages/TestCasesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import ProjectsPage from './pages/ProjectsPage'
import NotificationsPage from './pages/NotificationsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/bugs" element={<BugsPage />} />
                <Route path="/test-runs" element={<TestRunsPage />} />
                <Route path="/test-runs/:id" element={<TestCasesPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App