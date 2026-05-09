import type { TokenResponse, SignupRequest } from '../types/api'
import client from './client'

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/auth/login', { email, password })
  return res.data
}

export async function signup(data: SignupRequest): Promise<TokenResponse> {
  const res = await client.post<TokenResponse>('/auth/signup', data)
  return res.data
}
