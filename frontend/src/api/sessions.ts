import type { CommentOut, CourseOut, DocumentCitationOut, DocumentOut, Personality, QuestionOut, RichThreadOut, SavedAnswerOut, SessionCheckResponse, SessionReportResponse, SessionSummary, SharedThreadOut, ThreadFeedbackOut } from '../types/api'
import client from './client'

export async function getCourses(): Promise<CourseOut[]> {
  const res = await client.get<CourseOut[]>('/api/student/courses')
  return res.data
}

export async function getSessionsForCourse(courseId: string): Promise<SessionSummary[]> {
  const res = await client.get<SessionSummary[]>(`/api/student/courses/${courseId}/sessions`)
  return res.data
}

export interface SessionWithDocuments {
  id: string
  title: string
  status: string
  started_at: string
  documents: DocumentOut[]
}

export async function getSessionsWithDocuments(courseId: string): Promise<SessionWithDocuments[]> {
  const res = await client.get<SessionWithDocuments[]>(
    `/api/student/courses/${courseId}/sessions-with-documents`
  )
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

export async function createThread(sessionId: string, questionIds: string[], title?: string, includeQuestions: boolean = false): Promise<SharedThreadOut> {
  const res = await client.post<SharedThreadOut>(`/api/student/sessions/${sessionId}/threads`, {
    question_ids: questionIds,
    title: title || null,
    include_questions: includeQuestions,
  })
  return res.data
}

export async function getSharedThreads(sessionId: string): Promise<RichThreadOut[]> {
  const res = await client.get<RichThreadOut[]>(`/api/student/sessions/${sessionId}/shared-threads`)
  return res.data
}

export async function getThreadComments(threadId: string): Promise<CommentOut[]> {
  const res = await client.get<CommentOut[]>(`/api/student/threads/${threadId}/comments`)
  return res.data
}

export async function postThreadComment(threadId: string, content: string): Promise<CommentOut> {
  const res = await client.post<CommentOut>(`/api/student/threads/${threadId}/comments`, { content })
  return res.data
}

export async function submitThreadFeedback(threadId: string, feedback: 'up' | 'down'): Promise<ThreadFeedbackOut> {
  const res = await client.post<ThreadFeedbackOut>(`/api/student/threads/${threadId}/feedback`, { feedback })
  return res.data
}

export async function forkThread(threadId: string, content: string, personality: Personality = 'supportive', title?: string): Promise<RichThreadOut> {
  const res = await client.post<RichThreadOut>(`/api/student/threads/${threadId}/fork`, { content, personality, title: title || null })
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

export async function getQuestionComments(questionId: string): Promise<CommentOut[]> {
  const res = await client.get<CommentOut[]>(`/api/student/questions/${questionId}/comments`)
  return res.data
}

export async function postQuestionComment(questionId: string, content: string): Promise<CommentOut> {
  const res = await client.post<CommentOut>(`/api/student/questions/${questionId}/comments`, { content })
  return res.data
}

export async function forkQuestion(questionId: string, content: string, personality: Personality = 'supportive'): Promise<QuestionOut> {
  const res = await client.post<QuestionOut>(`/api/student/questions/${questionId}/fork`, { content, personality })
  return res.data
}

export async function saveAnswer(answerId: string): Promise<{ save_id: string; saved: boolean }> {
  const res = await client.post<{ save_id: string; saved: boolean }>(`/api/student/answers/${answerId}/save`)
  return res.data
}

export async function unsaveAnswer(answerId: string): Promise<{ saved: boolean }> {
  const res = await client.delete<{ saved: boolean }>(`/api/student/answers/${answerId}/save`)
  return res.data
}

export async function getSavedAnswers(): Promise<SavedAnswerOut[]> {
  const res = await client.get<SavedAnswerOut[]>('/api/student/notes')
  return res.data
}

export async function getStudentCitationMap(sessionId: string): Promise<DocumentCitationOut[]> {
  const res = await client.get<DocumentCitationOut[]>(`/api/student/sessions/${sessionId}/citation-map`)
  return res.data
}
