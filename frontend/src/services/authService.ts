import axios from 'axios'
import type { AuthResponse, LoginCredentials, RegisterCredentials } from '../types/auth'

const API_URL = 'http://localhost:5000/api'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, credentials)
    return response.data
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/register`, credentials)
    return response.data
  },

  saveToken(token: string) {
    localStorage.setItem('testbridge_token', token)
  },

  saveUser(user: any) {
    localStorage.setItem('testbridge_user', JSON.stringify(user))
  },

  getToken(): string | null {
    return localStorage.getItem('testbridge_token')
  },

  getUser() {
    const user = localStorage.getItem('testbridge_user')
    return user ? JSON.parse(user) : null
  },

  logout() {
    localStorage.removeItem('testbridge_token')
    localStorage.removeItem('testbridge_user')
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('testbridge_token')
  }
}