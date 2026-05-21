import { authService } from '../services/authService'
import { useNavigate } from 'react-router-dom'

const DashboardPage = () => {
  const navigate = useNavigate()
  const user = authService.getUser()

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-gray-500 mb-8">TestBridge Dashboard — coming soon</p>
        <button
          onClick={handleLogout}
          className="bg-indigo-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-800 transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default DashboardPage