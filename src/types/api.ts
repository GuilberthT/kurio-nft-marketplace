export const API_ERROR_CODES = [
  'VALIDATION',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'UNAVAILABLE',
] as const
export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

export interface ApiErrorBody {
  code: ApiErrorCode
  message: string
  fieldErrors?: Record<string, string>
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}