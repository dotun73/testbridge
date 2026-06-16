import axios from 'axios'
import { authService } from './authService'

const API_URL = 'http://localhost:5000/api'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` }
})

export interface Bug {
  id: string
  title: string
  description?: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'CLOSED' | 'RETEST'
  environment?: string
  projectId: string
  reportedBy: string
  assignedTo?: string
  createdAt: string
  reporter: { id: string; name: string; email: string }
  assignee?: { id: string; name: string; email: string }
  project: { id: string; name: string }
}

export interface CreateBugData {
  title: string
  description?: string
  severity: string
  priority: string
  status: string
  environment?: string
  projectId: string
}

export const bugService = {
  async getBugs(filters?: {
    projectId?: string
    status?: string
    severity?: string
    priority?: string
    search?: string
  }): Promise<Bug[]> {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.severity) params.append('severity', filters.severity)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.search) params.append('search', filters.search)

    const response = await axios.get(
      `${API_URL}/bugs?${params.toString()}`,
      getAuthHeaders()
    )
    return response.data.bugs
  },

  async createBug(data: CreateBugData): Promise<Bug> {
    const response = await axios.post(`${API_URL}/bugs`, data, getAuthHeaders())
    return response.data.bug
  },

  async updateBug(id: string, data: Partial<CreateBugData>): Promise<Bug> {
    const response = await axios.put(`${API_URL}/bugs/${id}`, data, getAuthHeaders())
    return response.data.bug
  },

  async deleteBug(id: string): Promise<void> {
    await axios.delete(`${API_URL}/bugs/${id}`, getAuthHeaders())
  }
}