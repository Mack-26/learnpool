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
  answer: AnswerOut | null
}
