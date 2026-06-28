import axios from 'axios'
import { authService } from './authService'

const API_URL = 'http://localhost:5000/api'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` }
})

export interface Notification {
  id: string
  userId: string
  type: 'TEST_FAILED' | 'TEST_RUN_COMPLETED' | 'MEMBER_INVITED'
  message: string
  read: boolean
  createdAt: string
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await axios.get(`${API_URL}/notifications`, getAuthHeaders())
    return response.data.notifications
  },

  async markAllAsRead(): Promise<void> {
    await axios.put(`${API_URL}/notifications/read-all`, {}, getAuthHeaders())
  },

  async markAsRead(id: string): Promise<void> {
    await axios.put(`${API_URL}/notifications/${id}/read`, {}, getAuthHeaders())
  }
}