import type { Session } from '@/types/user'
import { httpClient } from './httpClient'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  username: string
}

export async function login(input: LoginInput): Promise<Session> {
  const { data } = await httpClient.post<Session>('/auth/login', input)
  return data
}

export async function register(input: RegisterInput): Promise<Session> {
  const { data } = await httpClient.post<Session>('/auth/register', input)
  return data
}

export async function fetchSession(signal?: AbortSignal): Promise<Session> {
  const { data } = await httpClient.get<Session>('/auth/session', { signal })
  return data
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout')
}