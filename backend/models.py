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
    personality: str = Field(default="supportive", pattern="^(supportive|normal|funny)$")
    anonymous: bool = False


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class CourseOut(BaseModel):
    id: str
    name: str
    description: str | None
    professor_name: str
    session_count: int


class DocumentOut(BaseModel):
    id: str
    filename: str
    storage_path: str
    url: str
    page_count: int | None
    content: str | None = None  # For inline text documents


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


class SessionDetail(BaseModel):
    """Full session details for edit form."""
    id: str
    title: str
    status: str
    started_at: datetime
    scheduled_at: datetime | None = None
    location: str | None = None
    document_ids: list[str] = Field(default_factory=list)


class SessionWithDocuments(BaseModel):
    """Session with its attached documents for materials view."""
    id: str
    title: str
    status: str
    started_at: datetime
    documents: list["DocumentOut"] = Field(default_factory=list)


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
    anonymous: bool = False
    published: bool = False
    answer: AnswerOut | None = None


class PublishQuestionsRequest(BaseModel):
    question_ids: list[str]


class ProfessorReviewRequest(BaseModel):
    labels: list[str] = []
    notes: str | None = None


class AnswerFeedbackOut(BaseModel):
    thumbs_up: int
    thumbs_down: int
    needs_attention: bool   # True when thumbs_down > thumbs_up


class ReportQuestionOut(BaseModel):
    """Anonymised Q&A item for the session report — no student_id exposed."""
    question_id: str
    content: str
    asked_at: datetime
    anonymous_name: str     # e.g. "Anonymous Lion"
    answer: AnswerOut | None = None
    feedback: AnswerFeedbackOut | None = None
    my_feedback: str | None = None  # 'up', 'down', or None if student hasn't voted
    professor_labels: list[str] = []
    professor_notes: str | None = None


class TopicGroup(BaseModel):
    topic_name: str
    student_count: int      # distinct students who asked about this topic
    question_count: int
    questions: list[ReportQuestionOut]


class SessionReportResponse(BaseModel):
    groups: list[TopicGroup]
    total_questions: int


class SubmitFeedbackRequest(BaseModel):
    feedback: str = Field(..., pattern="^(up|down)$")


class CreateSessionRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    scheduled: bool = False  # If True, creates as upcoming (future lecture)


class CreateScheduleRequest(BaseModel):
    """Full schedule form: title, date, time, location, documents."""
    title: str = Field(..., min_length=1, max_length=200)
    scheduled_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")  # YYYY-MM-DD
    scheduled_time: str = Field(..., pattern=r"^\d{1,2}:\d{2}$")  # H:MM or HH:MM
    location: str = Field("", max_length=500)
    document_ids: list[str] = Field(default_factory=list, max_length=50)


class UpdateSessionStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(active|ended|released|upcoming)$")


class AddDocumentRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=10, max_length=100_000)
    session_ids: list[str] = Field(..., min_length=1, max_length=50)
