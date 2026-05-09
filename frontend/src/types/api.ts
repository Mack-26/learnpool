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
  content?: string | null  // For inline text documents
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: string
  display_name: string
  role: string
}

export interface SignupRequest {
  email: string
  password: string
  display_name: string
  role: 'student' | 'professor'
}

export interface SessionSummary {
  id: string
  title: string
  status: 'active' | 'ended' | 'released' | 'upcoming'
  started_at: string
}

export interface SessionCheckResponse {
  session_id: string
  enrolled: boolean
  session_status: string
  questions_used?: number
  questions_limit?: number
}

export interface CitationOut {
  chunk_id: string
  content: string
  page_number: number | null
  relevance_score: number
  citation_order: number
  filename?: string | null
  document_id?: string | null
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
  published?: boolean
  answer: AnswerOut | null
}

export interface SharedThreadExchange {
  question: string
  answer: string
  citations_count: number
}

export interface SharedThreadOut {
  thread_id: string
  title: string | null
  exchange_count: number
  shared_at: string
  exchanges: SharedThreadExchange[]
  include_questions: boolean
}

export interface ThreadFeedbackOut {
  thumbs_up: number
  thumbs_down: number
  needs_attention: boolean
}

export interface RichThreadExchange {
  question: string
  answer: string
  citations: CitationOut[]
  category: string | null
}

export interface RichThreadOut {
  thread_id: string
  title: string | null
  exchange_count: number
  shared_at: string
  exchanges: RichThreadExchange[]
  include_questions: boolean
  professor_labels: string[]
  professor_notes: string | null
  fork_count: number
  forked_from: string | null
  comment_count: number
  feedback: ThreadFeedbackOut | null
  my_feedback: 'up' | 'down' | null
  student_display_name: string
  is_mine: boolean
}

export interface AnswerFeedbackOut {
  thumbs_up: number
  thumbs_down: number
  needs_attention: boolean
}

export interface CommentOut {
  comment_id: string
  user_id: string
  display_name: string
  role: string
  content: string
  created_at: string
}

export interface ReportQuestionOut {
  question_id: string
  content: string
  asked_at: string
  anonymous_name: string
  answer: AnswerOut | null
  feedback: AnswerFeedbackOut | null
  my_feedback: 'up' | 'down' | null
  professor_labels: string[]
  professor_notes: string | null
  category: string | null
  fork_count: number
  comment_count: number
  forked_from: string | null
}

export interface TopicGroup {
  topic_name: string
  student_count: number
  question_count: number
  questions: ReportQuestionOut[]
  summary?: string | null
  is_hot?: boolean
}

export interface RepeatingQuestionGroup {
  summary: string
  question_ids: string[]
  count: number
}

export interface SessionReportResponse {
  groups: TopicGroup[]
  total_questions: number
  session_summary?: string | null
  repeating_questions?: RepeatingQuestionGroup[]
  hot_topics?: string[]
}

export type Personality = 'supportive' | 'normal' | 'funny'

export interface CitationPageOut {
  page_number: number | null
  citation_count: number
  avg_relevance: number
}

export interface DocumentCitationOut {
  document_id: string
  filename: string
  page_count: number | null
  total_citations: number
  pages: CitationPageOut[]
}

export interface SavedAnswerOut {
  save_id: string
  answer_id: string
  question_content: string
  answer_content: string
  saved_at: string
  session_id: string
  session_title: string
  citations: CitationOut[]
}
