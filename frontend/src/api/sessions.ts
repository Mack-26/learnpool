import type { CourseOut, DocumentOut, Personality, QuestionOut, SessionCheckResponse, SessionReportResponse, SessionSummary } from '../types/api'
import client from './client'

export async function getCourses(): Promise<CourseOut[]> {
  const res = await client.get<CourseOut[]>('/api/student/courses')
  return res.data
}

export async function getSessionsForCourse(courseId: string): Promise<SessionSummary[]> {
  const res = await client.get<SessionSummary[]>(`/api/student/courses/${courseId}/sessions`)
  return res.data
}

export async function getSessionDocuments(sessionId: string): Promise<DocumentOut[]> {
  const res = await client.get<DocumentOut[]>(`/api/student/sessions/${sessionId}/documents`)
  return res.data
}

export async function checkSession(sessionId: string): Promise<SessionCheckResponse> {
  const res = await client.get<SessionCheckResponse>(`/api/student/sessions/${sessionId}/check`)
  return res.data
}

export async function postQuestion(sessionId: string, content: string, personality: Personality = 'supportive', anonymous: boolean = false): Promise<QuestionOut> {
  const res = await client.post<QuestionOut>(`/api/student/sessions/${sessionId}/questions`, { content, personality, anonymous })
  return res.data
}

export async function getSessionReport(sessionId: string): Promise<SessionReportResponse> {
  const res = await client.get<SessionReportResponse>(`/api/student/sessions/${sessionId}/report`)
  return res.data
}

export async function submitFeedback(answerId: string, feedback: 'up' | 'down'): Promise<{ thumbs_up: number; thumbs_down: number }> {
  const res = await client.post(`/api/student/answers/${answerId}/feedback`, { feedback })
  return res.data
}

export async function getQuestions(sessionId: string): Promise<QuestionOut[]> {
  const res = await client.get<QuestionOut[]>(`/api/student/sessions/${sessionId}/questions`)
  return res.data
}

export async function publishQuestions(sessionId: string, questionIds: string[]): Promise<{ published_count: number }> {
  const res = await client.post<{ published_count: number }>(`/api/student/sessions/${sessionId}/publish`, { question_ids: questionIds })
  return res.data
}
