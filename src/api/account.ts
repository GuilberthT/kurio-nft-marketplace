import type { User } from '@/types/user'
import type { Wallet, WalletInput } from '@/types/wallet'
import { httpClient } from './httpClient'

export interface ProfileInput {
  name: string
  username: string
  email: string
}

export async function updateProfile(input: ProfileInput): Promise<User> {
  const { data } = await httpClient.patch<User>('/profile', input)
  return data
}

export async function uploadAvatar(dataUrl: string): Promise<User> {
  const { data } = await httpClient.put<User>('/profile/avatar', { dataUrl })
  return data
}

export async function removeAvatar(): Promise<User> {
  const { data } = await httpClient.delete<User>('/profile/avatar')
  return data
}

export async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
  await httpClient.post('/profile/password', input)
}

export async function createWallet(input: WalletInput): Promise<Wallet> {
  const { data } = await httpClient.post<Wallet>('/wallets', input)
  return data
}

export async function updateWallet(id: string, input: Omit<WalletInput, 'kind'>): Promise<Wallet> {
  const { data } = await httpClient.patch<Wallet>(`/wallets/${encodeURIComponent(id)}`, input)
  return data
}