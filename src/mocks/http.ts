import { HttpResponse } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/types/api'

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): Response {
  const body: ApiErrorBody = { code, message, fieldErrors }
  return HttpResponse.json(body, { status })
}