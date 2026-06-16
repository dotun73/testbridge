import axios from 'axios'
import { authService } from './authService'

const API_URL = 'http://localhost:5000/api'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` }
})

export interface TestRun {
  id: string
  name: string
  projectId: string
  executedBy: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED'
  githubRef?: string
  createdAt: string
  executor: { id: string; name: string; email: string }
  project: { id: string; name: string }
  testResults: Array<{
    id: string
    status: 'PENDING' | 'PASS' | 'FAIL' | 'BLOCKED'
    notes?: string
  }>
}

export interface CreateTestRunData {
  name: string
  projectId: string
  githubRef?: string
  status?: string
}

export const testRunService = {
  async getTestRuns(filters?: {
    projectId?: string
    status?: string
  }): Promise<TestRun[]> {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.status) params.append('status', filters.status)

    const response = await axios.get(
      `${API_URL}/test-runs?${params.toString()}`,
      getAuthHeaders()
    )
    return response.data.testRuns
  },

  async createTestRun(data: CreateTestRunData): Promise<TestRun> {
    const response = await axios.post(`${API_URL}/test-runs`, data, getAuthHeaders())
    return response.data.testRun
  },

  async updateTestRun(id: string, data: Partial<CreateTestRunData>): Promise<TestRun> {
    const response = await axios.put(`${API_URL}/test-runs/${id}`, data, getAuthHeaders())
    return response.data.testRun
  },

  async deleteTestRun(id: string): Promise<void> {
    await axios.delete(`${API_URL}/test-runs/${id}`, getAuthHeaders())
  },

  async addTestResult(testRunId: string, data: any): Promise<any> {
    const response = await axios.post(
      `${API_URL}/test-runs/${testRunId}/results`,
      data,
      getAuthHeaders()
    )
    return response.data
  }
}