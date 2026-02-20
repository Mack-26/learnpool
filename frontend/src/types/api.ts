export interface CourseOut {
  id: string
  name: string
  description: string | null
  professor_name: string
  session_count: number
}

export interface DocumentOut {
  id: string
  filename: string
  storage_path: string
  url: string
  page_count: number | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: string
  display_name: string
  role: string
}

export interface SessionSummary {
  id: string
  title: string
  status: 'active' | 'ended' | 'released'
  started_at: string
}

export interface SessionCheckResponse {
  session_id: string
  enrolled: boolean
  session_status: string
}

export interface CitationOut {
  chunk_id: string
  content: string
  page_number: number | null
  relevance_score: number
  citation_order: number
}

export interface AnswerOut {
  answer_id: string
  content: string
  model_used: string
  generation_latency_ms: number | null
  citations: CitationOut[]
}

export interface QuestionOut {
  question_id: string
  content: string
  asked_at: string
  student_id: string
  anonymous: boolean
  answer: AnswerOut | null
}

export interface AnswerFeedbackOut {
  thumbs_up: number
  thumbs_down: number
  needs_attention: boolean
}

export interface ReportQuestionOut {
  question_id: string
  content: string
  asked_at: string
  anonymous_name: string
  answer: AnswerOut | null
  feedback: AnswerFeedbackOut | null
  my_feedback: 'up' | 'down' | null
}

export interface TopicGroup {
  topic_name: string
  student_count: number
  question_count: number
  questions: ReportQuestionOut[]
}

export interface SessionReportResponse {
  groups: TopicGroup[]
  total_questions: number
}

export type Personality = 'supportive' | 'normal' | 'funny'
