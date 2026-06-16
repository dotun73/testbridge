import axios from 'axios'
import { authService } from './authService'

const API_URL = 'http://localhost:5000/api'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` }
})

export interface TestCase {
  id: string
  title: string
  description?: string
  steps: string
  expectedResult: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED'
  projectId: string
  createdAt: string
  project: { id: string; name: string }
}

export interface CreateTestCaseData {
  title: string
  description?: string
  steps: string
  expectedResult: string
  priority: string
  status: string
  projectId: string
}

export const testCaseService = {
  async getTestCases(filters?: {
    projectId?: string
    status?: string
    priority?: string
    search?: string
  }): Promise<TestCase[]> {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.search) params.append('search', filters.search)

    const response = await axios.get(
      `${API_URL}/test-cases?${params.toString()}`,
      getAuthHeaders()
    )
    return response.data.testCases
  },

  async createTestCase(data: CreateTestCaseData): Promise<TestCase> {
    const response = await axios.post(`${API_URL}/test-cases`, data, getAuthHeaders())
    return response.data.testCase
  },

  async updateTestCase(id: string, data: Partial<CreateTestCaseData>): Promise<TestCase> {
    const response = await axios.put(`${API_URL}/test-cases/${id}`, data, getAuthHeaders())
    return response.data.testCase
  },

  async deleteTestCase(id: string): Promise<void> {
    await axios.delete(`${API_URL}/test-cases/${id}`, getAuthHeaders())
  }
}