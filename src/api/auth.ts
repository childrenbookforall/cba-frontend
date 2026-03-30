import client from './client'
import type { AuthResponse, InviteInfo, MessageResponse } from '../types/api'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>('/api/auth/login', { email, password })
  return res.data
}

export async function getInvite(token: string): Promise<InviteInfo> {
  const res = await client.get<InviteInfo>(`/api/auth/invite/${token}`)
  return res.data
}

export async function acceptInvite(
  token: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<AuthResponse> {
  const res = await client.post<AuthResponse>(`/api/auth/invite/${token}`, { password, firstName, lastName })
  return res.data
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>('/api/auth/forgot-password', { email })
  return res.data
}

export async function validateResetToken(token: string): Promise<void> {
  await client.get(`/api/auth/reset-password/${token}`)
}

export async function resetPassword(token: string, password: string): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`/api/auth/reset-password/${token}`, { password })
  return res.data
}

export async function logoutApi(): Promise<void> {
  await client.post('/api/auth/logout')
}
