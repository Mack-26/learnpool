import type { CommentOut, CourseOut, CourseOverviewResponse, DocumentCitationOut, DocumentOut, RichThreadOut, SessionReportResponse, SessionSummary, StudentActivityItem, StudentOut, ThreadFeedbackOut, TimelineBucket } from '../types/api'
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

export async function submitProfessorFeedback(
  answerId: string,
  feedback: 'up' | 'down',
): Promise<{ thumbs_up: number; thumbs_down: number }> {
  const res = await client.post<{ thumbs_up: number; thumbs_down: number }>(
    `/api/professor/answers/${answerId}/feedback`,
    { feedback }
  )
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

export async function getProfessorQuestionComments(questionId: string): Promise<CommentOut[]> {
  const res = await client.get<CommentOut[]>(`/api/professor/questions/${questionId}/comments`)
  return res.data
}

export async function postProfessorQuestionComment(questionId: string, content: string): Promise<CommentOut> {
  const res = await client.post<CommentOut>(`/api/professor/questions/${questionId}/comments`, { content })
  return res.data
}

export async function deleteProfessorQuestionComment(questionId: string, commentId: string): Promise<void> {
  await client.delete(`/api/professor/questions/${questionId}/comments/${commentId}`)
}

export async function getProfessorSharedThreads(sessionId: string): Promise<RichThreadOut[]> {
  const res = await client.get<RichThreadOut[]>(`/api/professor/sessions/${sessionId}/shared-threads`)
  return res.data
}

export async function updateThreadReview(
  threadId: string,
  labels: string[],
  notes: string | null,
): Promise<{ thread_id: string }> {
  const res = await client.patch<{ thread_id: string }>(`/api/professor/threads/${threadId}`, { labels, notes })
  return res.data
}

export async function getProfessorThreadComments(threadId: string): Promise<CommentOut[]> {
  const res = await client.get<CommentOut[]>(`/api/professor/threads/${threadId}/comments`)
  return res.data
}

export async function postProfessorThreadComment(threadId: string, content: string): Promise<CommentOut> {
  const res = await client.post<CommentOut>(`/api/professor/threads/${threadId}/comments`, { content })
  return res.data
}

export async function deleteProfessorThreadComment(threadId: string, commentId: string): Promise<void> {
  await client.delete(`/api/professor/threads/${threadId}/comments/${commentId}`)
}

export async function updateThreadTitle(threadId: string, title: string): Promise<void> {
  await client.patch(`/api/professor/threads/${threadId}/title`, { title })
}

export async function deleteProfessorThread(threadId: string): Promise<void> {
  await client.delete(`/api/professor/threads/${threadId}`)
}

export async function submitProfessorThreadFeedback(threadId: string, feedback: 'up' | 'down'): Promise<ThreadFeedbackOut> {
  const res = await client.post<ThreadFeedbackOut>(`/api/professor/threads/${threadId}/feedback`, { feedback })
  return res.data
}

export interface CategoryAnalyticsItem {
  category: string
  count: number
}

export async function getCategoryAnalytics(courseId: string): Promise<CategoryAnalyticsItem[]> {
  const res = await client.get<CategoryAnalyticsItem[]>(`/api/professor/courses/${courseId}/category-analytics`)
  return res.data
}

export async function getSessionCitationMap(sessionId: string): Promise<DocumentCitationOut[]> {
  const res = await client.get<DocumentCitationOut[]>(`/api/professor/sessions/${sessionId}/citation-map`)
  return res.data
}

export async function getCourseInviteCode(courseId: string): Promise<{ invite_code: string }> {
  const res = await client.get<{ invite_code: string }>(`/api/professor/courses/${courseId}/invite-code`)
  return res.data
}

export async function regenerateCourseInviteCode(courseId: string): Promise<{ invite_code: string }> {
  const res = await client.post<{ invite_code: string }>(`/api/professor/courses/${courseId}/invite-code/regenerate`)
  return res.data
}

export async function getCourseStudents(courseId: string): Promise<StudentOut[]> {
  const res = await client.get<StudentOut[]>(`/api/professor/courses/${courseId}/students`)
  return res.data
}

export async function getStudentActivity(sessionId: string): Promise<StudentActivityItem[]> {
  const res = await client.get<StudentActivityItem[]>(`/api/professor/sessions/${sessionId}/student-activity`)
  return res.data
}

export async function getSessionTimeline(sessionId: string): Promise<TimelineBucket[]> {
  const res = await client.get<TimelineBucket[]>(`/api/professor/sessions/${sessionId}/timeline`)
  return res.data
}

export async function getCourseOverview(courseId: string): Promise<CourseOverviewResponse> {
  const res = await client.get<CourseOverviewResponse>(`/api/professor/courses/${courseId}/overview`)
  return res.data
}
