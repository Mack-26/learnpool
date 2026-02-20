import type { CourseOut, DocumentOut, SessionReportResponse, SessionSummary } from '../types/api'
import client from './client'

export async function getProfessorCourses(): Promise<CourseOut[]> {
  const res = await client.get<CourseOut[]>('/api/professor/courses')
  return res.data
}

export async function getProfessorSessionsForCourse(courseId: string): Promise<SessionSummary[]> {
  const res = await client.get<SessionSummary[]>(`/api/professor/courses/${courseId}/sessions`)
  return res.data
}

export interface SessionWithDocuments {
  id: string
  title: string
  status: string
  started_at: string
  documents: DocumentOut[]
}

export async function getSessionsWithDocuments(
  courseId: string
): Promise<SessionWithDocuments[]> {
  const res = await client.get<SessionWithDocuments[]>(
    `/api/professor/courses/${courseId}/sessions-with-documents`
  )
  return res.data
}

export async function createSession(
  courseId: string,
  title: string,
  options?: { scheduled?: boolean }
): Promise<SessionSummary> {
  const res = await client.post<SessionSummary>(`/api/professor/courses/${courseId}/sessions`, {
    title,
    scheduled: options?.scheduled ?? false,
  })
  return res.data
}

export async function updateSessionStatus(
  sessionId: string,
  status: 'active' | 'ended' | 'released' | 'upcoming'
): Promise<SessionSummary> {
  const res = await client.patch<SessionSummary>(`/api/professor/sessions/${sessionId}/status`, { status })
  return res.data
}

export interface SessionDetail {
  id: string
  title: string
  status: string
  started_at: string
  scheduled_at: string | null
  location: string | null
  document_ids: string[]
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail> {
  const res = await client.get<SessionDetail>(`/api/professor/sessions/${sessionId}`)
  return res.data
}

export async function updateSession(
  sessionId: string,
  data: {
    title: string
    scheduled_date: string
    scheduled_time: string
    location: string
    document_ids: string[]
  }
): Promise<SessionSummary> {
  const res = await client.patch<SessionSummary>(`/api/professor/sessions/${sessionId}`, data)
  return res.data
}

export async function deleteSession(sessionId: string): Promise<void> {
  await client.delete(`/api/professor/sessions/${sessionId}`)
}

export async function getProfessorSessionReport(sessionId: string): Promise<SessionReportResponse> {
  const res = await client.get<SessionReportResponse>(`/api/professor/sessions/${sessionId}/report`)
  return res.data
}

export async function getCourseDocuments(courseId: string): Promise<DocumentOut[]> {
  const res = await client.get<DocumentOut[]>(`/api/professor/courses/${courseId}/documents`)
  return res.data
}

export async function addDocument(
  courseId: string,
  data: { title: string; content: string; session_ids: string[] }
): Promise<DocumentOut> {
  const res = await client.post<DocumentOut>(`/api/professor/courses/${courseId}/documents`, data)
  return res.data
}

export async function scheduleLecture(
  courseId: string,
  data: {
    title: string
    scheduled_date: string
    scheduled_time: string
    location: string
    document_ids: string[]
  }
): Promise<SessionSummary> {
  const res = await client.post<SessionSummary>(
    `/api/professor/courses/${courseId}/schedule`,
    data
  )
  return res.data
}

export async function updateQuestionReview(
  questionId: string,
  labels: string[],
  notes: string | null,
): Promise<{ question_id: string }> {
  const res = await client.patch<{ question_id: string }>(`/api/professor/questions/${questionId}`, { labels, notes })
  return res.data
}

export async function uploadDocument(
  courseId: string,
  file: File,
  title: string,
  sessionIds: string[]
): Promise<DocumentOut> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title || file.name)
  formData.append('session_ids', JSON.stringify(sessionIds))
  const res = await client.post<DocumentOut>(
    `/api/professor/courses/${courseId}/documents/upload`,
    formData
  )
  return res.data
}
