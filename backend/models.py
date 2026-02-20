from datetime import datetime
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class PostQuestionRequest(BaseModel):
    content: str = Field(..., min_length=5, max_length=2000)


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    display_name: str
    role: str


class SessionSummary(BaseModel):
    id: str
    title: str
    status: str
    started_at: datetime


class SessionCheckResponse(BaseModel):
    session_id: str
    enrolled: bool
    session_status: str


class CitationOut(BaseModel):
    chunk_id: str
    content: str
    page_number: int | None
    relevance_score: float
    citation_order: int


class AnswerOut(BaseModel):
    answer_id: str
    content: str
    model_used: str
    generation_latency_ms: int | None
    citations: list[CitationOut]


class QuestionOut(BaseModel):
    question_id: str
    content: str
    asked_at: datetime
    student_id: str
    answer: AnswerOut | None = None
