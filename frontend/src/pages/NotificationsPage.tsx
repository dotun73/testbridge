import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../services/notificationService'
import { motion } from 'framer-motion'

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getAllNotifications()
        setNotifications(data)
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to mark notifications as read:', err)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </motion.div>
        {unreadCount > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            onClick={handleMarkAllRead}
            className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Mark all as read
          </motion.button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <Bell size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs mt-1">You'll see activity here when bugs, test cases and test runs are created</p>
          </div>
        ) : (
          notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.25 }}
              className={`flex items-start gap-4 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                index !== notifications.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
              } ${!notification.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${
                  !notification.read
                    ? 'font-semibold text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  )
}

export default NotificationsPage