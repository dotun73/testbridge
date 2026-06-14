import axios from 'axios'
import { authService } from './authService'

const API_URL = 'http://localhost:5000/api'

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` }
})

export interface Project {
  id: string
  name: string
  description?: string
  githubRepo?: string
  createdAt: string
  updatedAt: string
  members: {
    id: string
    userId: string
    user: { id: string; name: string; email: string }
  }[]
  _count: {
    testCases: number
    testRuns: number
    bugs: number
  }
}

export interface CreateProjectData {
  name: string
  description?: string
  githubRepo?: string
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const response = await axios.get(`${API_URL}/projects`, getAuthHeaders())
    return response.data.projects
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await axios.post(`${API_URL}/projects`, data, getAuthHeaders())
    return response.data.project
  },

  async updateProject(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    const response = await axios.put(`${API_URL}/projects/${id}`, data, getAuthHeaders())
    return response.data.project
  },

  async deleteProject(id: string): Promise<void> {
    await axios.delete(`${API_URL}/projects/${id}`, getAuthHeaders())
  }
}