import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, BookOpen, Zap, ThumbsUp, ThumbsDown, Eye, EyeOff, LogOut, X, AlertCircle, FileText,
  Share2, CheckSquare, Square,
} from 'lucide-react'
import { checkSession, getQuestions, getSessionDocuments, postQuestion, publishQuestions, submitFeedback } from '../api/sessions'
import { useSettingsStore } from '../store/settingsStore'
import type { DocumentOut, QuestionOut } from '../types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import DashboardLayout from '@/components/DashboardLayout'

// ─── Document Panel ────────────────────────────────────────────────────────────
const MIN_PDF_WIDTH = 240
const MAX_PDF_WIDTH = 800
const DEFAULT_PDF_WIDTH = 380

function DocumentPanel({ sessionId, width }: { sessionId: string; width: number }) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentOut | null>(null)

  const { data: documents = [] } = useQuery({
    queryKey: ['session-documents', sessionId],
    queryFn: () => getSessionDocuments(sessionId),
  })

  return (
    <div
      className="flex flex-col bg-card border-l border-border overflow-hidden shrink-0"
      style={{ width }}
    >
      <div className="p-3 border-b border-border shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Lecture Documents
        </h3>
      </div>

      {/* Doc chips */}
      <div className="p-3 flex flex-col gap-2 border-b border-border shrink-0 overflow-y-auto max-h-48">
        {documents.length === 0 && (
          <p className="text-xs text-muted-foreground">No documents.</p>
        )}
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
            className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 text-left transition-all ${
              selectedDoc?.id === doc.id
                ? 'border-primary bg-accent'
                : 'border-border hover:border-primary/30 bg-card'
            }`}
          >
            <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${
              selectedDoc?.id === doc.id ? 'gradient-primary' : 'bg-muted'
            }`}>
              <FileText className={`h-4 w-4 ${selectedDoc?.id === doc.id ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{doc.filename}</p>
              {doc.page_count && (
                <p className="text-xs text-muted-foreground">{doc.page_count} pages</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Document preview (PDF iframe or inline text) */}
      <div className="flex-1 overflow-hidden bg-muted/30">
        {selectedDoc ? (
          selectedDoc.content ? (
            <div
              key={selectedDoc.id}
              className="h-full overflow-y-auto p-4 text-sm text-foreground whitespace-pre-wrap"
            >
              {selectedDoc.content}
            </div>
          ) : (
            <iframe
              key={selectedDoc.id}
              src={selectedDoc.url}
              className="w-full h-full border-0"
              title={selectedDoc.filename}
            />
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileText className="h-8 w-8 opacity-30" />
            <p className="text-xs text-center">
              Select a document<br />to preview it here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  question,
  feedback,
  onFeedback,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  question: QuestionOut
  feedback: 'up' | 'down' | undefined
  onFeedback: (id: string, val: 'up' | 'down') => void
  selectionMode: boolean
  selected: boolean
  onToggleSelect: (id: string) => void
}) {
  const [showCitations, setShowCitations] = useState(false)
  const answer = question.answer

  return (
    <div className="space-y-3 relative">
      {/* Selection checkbox overlay */}
      {selectionMode && (
        <button
          onClick={() => onToggleSelect(question.question_id)}
          className="absolute -left-7 top-1 z-10 text-primary"
          aria-label={selected ? 'Deselect' : 'Select'}
        >
          {selected
            ? <CheckSquare className="h-5 w-5" />
            : <Square className="h-5 w-5 text-muted-foreground" />
          }
        </button>
      )}

      {/* User question */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className={`max-w-[75%] rounded-2xl px-4 py-3 gradient-primary text-white relative ${
          selectionMode && selected ? 'ring-2 ring-primary ring-offset-2' : ''
        }`}>
          {question.published && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
              Shared
            </span>
          )}
          <p className="text-sm">{question.content}</p>
          {question.anonymous && (
            <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
              <EyeOff className="h-3 w-3" /> Asked anonymously
            </p>
          )}
        </div>
      </motion.div>

      {/* AI answer */}
      {answer ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <div className={`max-w-[80%] rounded-2xl px-4 py-3 bg-muted text-foreground ${
            selectionMode && selected ? 'ring-2 ring-primary ring-offset-2' : ''
          }`}>
            <p className="text-sm whitespace-pre-wrap">{answer.content}</p>

            {/* Citations toggle */}
            {answer.citations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-foreground/10">
                <button
                  onClick={() => setShowCitations((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <BookOpen className="h-3 w-3" />
                  {showCitations ? 'Hide' : 'Show'} {answer.citations.length} source{answer.citations.length !== 1 ? 's' : ''}
                </button>
                {showCitations && (
                  <div className="mt-2 space-y-1.5">
                    {answer.citations.map((c) => (
                      <div key={c.chunk_id} className="text-xs bg-background/60 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs h-4 px-1.5">
                            [{c.citation_order}]
                          </Badge>
                          {c.page_number && (
                            <span className="text-muted-foreground">Page {c.page_number}</span>
                          )}
                          <span className="ml-auto text-muted-foreground">
                            {Math.round(c.relevance_score * 100)}% match
                          </span>
                        </div>
                        <p className="text-muted-foreground line-clamp-3">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feedback row */}
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-foreground/10">
              {answer.generation_latency_ms && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-2.5 w-2.5 mr-1" />
                  {(answer.generation_latency_ms / 1000).toFixed(1)}s
                </Badge>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => onFeedback(question.question_id, 'up')}
                  className={`p-1 rounded hover:bg-foreground/10 transition-colors ${
                    feedback === 'up' ? 'text-success' : 'opacity-40 hover:opacity-100'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onFeedback(question.question_id, 'down')}
                  className={`p-1 rounded hover:bg-foreground/10 transition-colors ${
                    feedback === 'down' ? 'text-destructive' : 'opacity-40 hover:opacity-100'
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="flex justify-start">
          <div className="rounded-2xl px-4 py-3 bg-muted text-muted-foreground text-sm animate-pulse">
            Generating answer…
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [input, setInput] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [showNudge, setShowNudge] = useState(false)
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({})
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const personality = useSettingsStore((s) => s.personality)

  // Resizable PDF panel
  const [pdfWidth, setPdfWidth] = useState(DEFAULT_PDF_WIDTH)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(DEFAULT_PDF_WIDTH)

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = pdfWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [pdfWidth])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return
      const delta = dragStartX.current - e.clientX
      const newWidth = Math.min(MAX_PDF_WIDTH, Math.max(MIN_PDF_WIDTH, dragStartWidth.current + delta))
      setPdfWidth(newWidth)
    }
    function onMouseUp() {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // Session check
  const { data: check, isLoading: checkLoading } = useQuery({
    queryKey: ['session-check', sessionId],
    queryFn: () => checkSession(sessionId!),
    retry: false,
  })

  useEffect(() => {
    if (!checkLoading && check && !check.enrolled) navigate('/classes')
  }, [check, checkLoading, navigate])

  // Nudge after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowNudge(true), 8000)
    return () => clearTimeout(t)
  }, [])

  // Questions query (polling)
  const { data: questions = [], isFetching } = useQuery({
    queryKey: ['questions', sessionId],
    queryFn: () => getQuestions(sessionId!),
    refetchInterval: 5000,
    enabled: !!check?.enrolled,
  })

  const mutation = useMutation({
    mutationFn: (content: string) => postQuestion(sessionId!, content, personality, anonymous),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions', sessionId] }),
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null
      console.error('Post question failed:', msg || err)
    },
  })

  const publishMutation = useMutation({
    mutationFn: (ids: string[]) => publishQuestions(sessionId!, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', sessionId] })
      setSelectedQuestionIds(new Set())
      setSelectionMode(false)
      setToast('Published to class discussion')
      setTimeout(() => setToast(null), 3000)
    },
  })

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [questions])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || trimmed.length < 5 || mutation.isPending) return
    if (trimmed.length > 2000) return
    mutation.mutate(trimmed)
    setInput('')
  }

  const toggleSelect = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedQuestionIds(new Set())
  }

  const isActive = check?.session_status === 'active'
  const isEnded = check?.session_status === 'ended'
  const canChat = !isEnded  // active + released (upcoming) lectures allow Q&A

  if (checkLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading lecture…
        </div>
      </DashboardLayout>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-xs"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Leave
            </Button>
            {isActive ? (
              <>
                <Badge className="gradient-primary text-white border-0 animate-pulse text-xs">
                  ● Live
                </Badge>
                <span className="text-xs text-muted-foreground">
                  The professor is notified each time a new question comes in
                </span>
              </>
            ) : check && (
              <span className="text-xs text-muted-foreground capitalize">
                {check.session_status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isFetching && !mutation.isPending && (
              <span className="text-xs text-muted-foreground">Refreshing…</span>
            )}
            {questions.length > 0 && (
              selectionMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={exitSelectionMode}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectionMode(true)}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1" />
                  Select to share
                </Button>
              )
            )}
            <div className="flex items-center gap-2 text-sm">
              {anonymous
                ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                : <Eye className="h-4 w-4 text-primary" />
              }
              <span className="text-xs text-muted-foreground">Anonymous</span>
              <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background relative">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 pl-10 space-y-5">
              {questions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-foreground">Ask anything</p>
                    <p className="text-sm">AI will answer using citations from course materials</p>
                  </div>
                </div>
              )}
              {questions.map((q) => (
                <MessageBubble
                  key={q.question_id}
                  question={q}
                  feedback={feedback[q.question_id]}
                  onFeedback={(id, val) => {
                    setFeedback((prev) => ({ ...prev, [id]: val }))
                    if (q.answer?.answer_id) {
                      submitFeedback(q.answer.answer_id, val).catch(() => {/* silent */})
                    }
                  }}
                  selectionMode={selectionMode}
                  selected={selectedQuestionIds.has(q.question_id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Publish sticky bar */}
            <AnimatePresence>
              {selectionMode && selectedQuestionIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="absolute bottom-0 left-0 right-0 p-3 bg-background border-t border-primary/30 z-10"
                >
                  <Button
                    className="w-full gradient-primary text-white border-0"
                    disabled={publishMutation.isPending}
                    onClick={() => publishMutation.mutate([...selectedQuestionIds])}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Publish {selectedQuestionIds.size} exchange{selectedQuestionIds.size !== 1 ? 's' : ''} to shared conversation bank
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className={`p-4 border-t border-border bg-card shrink-0 ${selectionMode && selectedQuestionIds.size > 0 ? 'pb-20' : ''}`}>
              {canChat ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend() }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 flex flex-col gap-0.5">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={mutation.isPending ? 'Generating answer…' : 'Ask a question about this session…'}
                      disabled={mutation.isPending}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                      }}
                    />
                    {input.trim().length > 0 && input.trim().length < 5 && (
                      <p className="text-xs text-destructive">At least 5 characters required</p>
                    )}
                    {input.length > 2000 && (
                      <p className="text-xs text-destructive">{input.length}/2000 characters</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={mutation.isPending || !input.trim() || input.trim().length < 5 || input.length > 2000}
                    className="gradient-primary text-white border-0 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  This lecture has ended. Questions are read-only.
                </p>
              )}
            </div>
          </div>

          {/* Drag divider */}
          <div
            onMouseDown={onDividerMouseDown}
            className="w-1.5 shrink-0 bg-border hover:bg-primary/40 cursor-col-resize transition-colors"
          />

          {/* PDF Panel */}
          <DocumentPanel sessionId={sessionId!} width={pdfWidth} />
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participation Nudge */}
      <AnimatePresence>
        {showNudge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 max-w-sm p-4 rounded-xl bg-card border border-primary/30 elevated-shadow z-50"
          >
            <button
              onClick={() => setShowNudge(false)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Tip: Ask anything from the slides!
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  The AI uses your uploaded course materials to give grounded answers with citations.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => setShowNudge(false)}
                >
                  Got it
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
