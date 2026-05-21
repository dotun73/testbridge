export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MEMBER'
}

export interface AuthResponse {
  message: string
  token: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}