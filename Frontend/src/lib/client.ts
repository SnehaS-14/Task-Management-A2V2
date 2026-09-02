import axios from 'axios'
import type { ApiErrorDetail } from '@/lib/types'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

const TOKEN_KEY = 'taskapp_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorDetail | undefined
    if (data?.error?.message) {
      return data.error.message
    }
    if (data?.error?.details && Array.isArray(data.error.details)) {
      const first = data.error.details[0] as { message?: string } | string
      if (typeof first === 'object' && first?.message) return first.message
    }
    if (error.message === 'Network Error') {
      return 'Unable to reach the server. Please check your connection.'
    }
    return data?.error?.message ?? error.message ?? 'An unexpected error occurred'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export default apiClient
