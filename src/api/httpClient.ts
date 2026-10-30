import axios from 'axios'
import { getSessionToken, SESSION_EXPIRED_EVENT } from '@/auth/sessionToken'
import { getGuestCartId } from '@/cart/guestCartId'
import type { ApiErrorBody, ApiErrorCode } from '@/types/api'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode | 'NETWORK'
  readonly fieldErrors?: Record<string, string>

  constructor(
    status: number,
    code: ApiErrorCode | 'NETWORK',
    message: string,
    fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  paramsSerializer: { indexes: null },
})

httpClient.interceptors.request.use((config) => {
  const token = getSessionToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
    config.headers['X-Guest-Cart'] = getGuestCartId()
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<ApiErrorBody>(error)) {
      const body = error.response?.data
      const isAuthAttempt = /\/auth\/(login|register)$/.test(error.config?.url ?? '')
      if (error.response?.status === 401 && error.config?.headers.Authorization && !isAuthAttempt) {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      }
      if (error.response && body?.code) {
        return Promise.reject(
          new ApiError(error.response.status, body.code, body.message, body.fieldErrors),
        )
      }
      return Promise.reject(
        new ApiError(0, 'NETWORK', 'Não foi possível conectar. Verifique sua internet.'),
      )
    }
    return Promise.reject(error)
  },
)