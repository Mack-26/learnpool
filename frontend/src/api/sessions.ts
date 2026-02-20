import type { QuestionOut, SessionCheckResponse, SessionSummary } from '../types/api'
import client from './client'

export async function getSessions(): Promise<SessionSummary[]> {
  const res = await client.get<SessionSummary[]>('/api/student/sessions')
  return res.data
}

export async function checkSession(sessionId: string): Promise<SessionCheckResponse> {
  const res = await client.get<SessionCheckResponse>(`/api/student/sessions/${sessionId}/check`)
  return res.data
}

export async function postQuestion(sessionId: string, content: string): Promise<QuestionOut> {
  const res = await client.post<QuestionOut>(`/api/student/sessions/${sessionId}/questions`, { content })
  return res.data
}

export async function getQuestions(sessionId: string): Promise<QuestionOut[]> {
  const res = await client.get<QuestionOut[]>(`/api/student/sessions/${sessionId}/questions`)
  return res.data
}
