import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Bookmark, Zap, Eye, EyeOff, X, AlertCircle, FileText, Share2, Copy, Check, RefreshCw, Mic, MicOff, Quote, Settings2,
} from 'lucide-react'
import { checkSession, createThread, getQuestions, getSessionDocuments, getSavedAnswers, postQuestion, saveAnswer, unsaveAnswer } from '../api/sessions'
import { renderAnswerWithCitations } from '../components/AnswerRenderer'
import { useSettingsStore } from '../store/settingsStore'
import type { DocumentOut, QuestionOut } from '../types/api'
import { Button } from '@/components/ui/button'
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
      className="flex flex-col border-l border-border overflow-hidden shrink-0"
      style={{ width, background: '#ffffff' }}
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
          ) : selectedDoc.url ? (
            <div className="h-full flex flex-col">
              <iframe
                key={selectedDoc.id}
                src={selectedDoc.url}
                className="flex-1 min-h-0 w-full border-0"
                title={selectedDoc.filename}
              />
              <a
                href={selectedDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 py-1.5 px-3 text-xs text-muted-foreground hover:text-foreground border-t border-border"
              >
                Open in new tab
              </a>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No preview available
            </div>
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

const FOLLOW_UP_CHIPS = ['Explain more simply', 'Give me an example', 'What else should I know?']

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  question,
  isSaved,
  onToggleSave,
  onRegenerate,
  onFollowUp,
  onShareThis,
  onTextSelect,
  selectMode,
  isSelected,
  onToggleSelect,
}: {
  question: QuestionOut
  isSaved: boolean
  onToggleSave: (answerId: string) => void
  onRegenerate: (content: string) => void
  onFollowUp: (text: string) => void
  onShareThis: () => void
  onTextSelect: () => void
  selectMode: boolean
  isSelected: boolean
  onToggleSelect: (questionId: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [confirmUnsave, setConfirmUnsave] = useState(false)
  const answer = question.answer

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!answer) return
    navigator.clipboard.writeText(answer.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      style={{
        position: 'relative',
        cursor: selectMode ? 'pointer' : 'default',
        borderRadius: '0.75rem',
        padding: selectMode ? '0.5rem 0.5rem 0.5rem 2rem' : '0',
        background: isSelected ? 'rgba(39,39,87,0.06)' : 'transparent',
        transition: 'background 0.15s',
      }}
      onClick={selectMode ? () => onToggleSelect(question.question_id) : undefined}
    >
      {/* Checkbox */}
      {selectMode && (
        <div style={{
          position: 'absolute', left: '0.35rem', top: '1.2rem', zIndex: 10,
          width: '1.1rem', height: '1.1rem', borderRadius: '50%',
          border: isSelected ? '2px solid #272757' : '2px solid #8686AC',
          background: isSelected ? '#272757' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {isSelected && (
            <div style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: '#fff' }} />
          )}
        </div>
      )}

      <div className="space-y-3">
        {/* User question */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <div className="max-w-[75%] rounded-2xl px-4 py-3 gradient-primary text-white relative">
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
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-card text-foreground" style={{ border: '1px solid rgba(134,134,172,0.15)' }}>
              <div className="text-sm" onMouseUp={onTextSelect} style={{ userSelect: 'text', cursor: 'text', lineHeight: 1.7 }}>
                {renderAnswerWithCitations(answer.content, answer.citations)}
              </div>

              {/* Action row — hidden in select mode */}
              {!selectMode && (
                <>
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-foreground/10">
                    {/* Copy */}
                    <button
                      onClick={handleCopy}
                      title="Copy answer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: copied ? '#166534' : '#8686AC',
                        padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                        fontSize: '0.7rem', transition: 'color 0.2s',
                      }}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    {/* Regenerate */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onRegenerate(question.content) }}
                      title="Regenerate answer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#8686AC',
                        padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                        fontSize: '0.7rem', transition: 'color 0.2s',
                      }}
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Regenerate</span>
                    </button>

                    {/* Save / unsave with confirmation */}
                    <div style={{ marginLeft: 'auto', position: 'relative' }}>
                      {confirmUnsave ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.7rem', color: '#505081' }}>Remove?</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleSave(answer.answer_id); setConfirmUnsave(false) }}
                            style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c0392b', background: 'rgba(186,26,26,0.08)', border: 'none', borderRadius: '0.3rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                          >Yes</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmUnsave(false) }}
                            style={{ fontSize: '0.7rem', color: '#8686AC', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem' }}
                          >No</button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); isSaved ? setConfirmUnsave(true) : onToggleSave(answer.answer_id) }}
                          title={isSaved ? 'Remove from notes' : 'Save to notes'}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.2rem',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: isSaved ? '#272757' : '#8686AC',
                            padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                            fontSize: '0.7rem', transition: 'color 0.2s',
                          }}
                        >
                          <Bookmark className="h-3.5 w-3.5" fill={isSaved ? 'currentColor' : 'none'} />
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Follow-up chips */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {FOLLOW_UP_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={(e) => { e.stopPropagation(); onFollowUp(chip) }}
                        style={{
                          fontSize: '0.68rem', color: '#505081',
                          background: 'rgba(80,80,129,0.08)',
                          border: '1px solid rgba(80,80,129,0.18)',
                          borderRadius: '99px', padding: '0.2rem 0.65rem',
                          cursor: 'pointer', transition: 'background 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(80,80,129,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(80,80,129,0.08)')}
                      >
                        {chip} →
                      </button>
                    ))}
                  </div>

                  {/* CTA row */}
                  <div style={{ fontSize: '0.67rem', color: '#8686AC', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                    <span>Didn't like this answer?</span>
                    <button
                      type="button"
                      onClick={onShareThis}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        background: 'none', border: 'none', padding: 0,
                        cursor: 'pointer', fontSize: 'inherit', color: '#505081',
                        fontWeight: 600, transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#272757')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#505081')}
                    >
                      <Share2 style={{ width: '0.65rem', height: '0.65rem' }} />
                      Share with classmates →
                    </button>
                  </div>
                </>
              )}
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
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const [input, setInput] = useState('')
  const [optimisticContent, setOptimisticContent] = useState<string | null>(null)
  const [anonymous, setAnonymous] = useState(false)
  const [showNudge, setShowNudge] = useState(false)
  const [savedAnswers, setSavedAnswers] = useState<Set<string>>(new Set())
  const [sendError, setSendError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [selectionPopup, setSelectionPopup] = useState<{ text: string; x: number; y: number } | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const [aiSettingsOpen, setAiSettingsOpen] = useState(false)

  // Selection / sharing state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [shareModal, setShareModal] = useState(false)
  const [shareTitle, setShareTitle] = useState('')
  const [includeQuestions, setIncludeQuestions] = useState(true)
  const [sharing, setSharing] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const personality = useSettingsStore((s) => s.personality)
  const setPersonality = useSettingsStore((s) => s.setPersonality)

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

  // Load saved answer IDs so bookmark state is correct on page load
  useEffect(() => {
    getSavedAnswers().then((saved) => {
      setSavedAnswers(new Set(saved.map((s) => s.answer_id)))
    }).catch(() => {/* silent */})
  }, [])

  const handleToggleSave = async (answerId: string) => {
    if (savedAnswers.has(answerId)) {
      setSavedAnswers((prev) => { const s = new Set(prev); s.delete(answerId); return s })
      await unsaveAnswer(answerId).catch(() => {
        setSavedAnswers((prev) => new Set(prev).add(answerId))
      })
    } else {
      setSavedAnswers((prev) => new Set(prev).add(answerId))
      await saveAnswer(answerId).catch(() => {
        setSavedAnswers((prev) => { const s = new Set(prev); s.delete(answerId); return s })
      })
    }
  }

  // Questions query (polling)
  const { data: questions = [], isFetching } = useQuery({
    queryKey: ['questions', sessionId],
    queryFn: () => getQuestions(sessionId!),
    refetchInterval: 5000,
    enabled: !!check?.enrolled,
  })

  const mutation = useMutation({
    mutationFn: (content: string) => postQuestion(sessionId!, content, personality, anonymous),
    onSuccess: () => {
      setSendError(null)
      setOptimisticContent(null)
      queryClient.invalidateQueries({ queryKey: ['questions', sessionId] })
    },
    onError: (err: unknown) => {
      setOptimisticContent(null)
      const response = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number; data?: { detail?: string } } }).response
        : null
      const msg = response?.data?.detail ?? 'Something went wrong. Please try again.'
      setSendError(msg)
      if (response?.status === 429) setRateLimited(true)
    },
  })

  // Auto-scroll — also fires when optimistic bubble appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [questions, optimisticContent])

  // Cycling loading phrases
  const LOADING_PHRASES = [
    'Ruminating…', 'Cogitating…', 'Deliberating…', 'Contemplating…',
    'Pondering…', 'Synthesizing…', 'Connecting the dots…', 'Distilling wisdom…',
    'Cross-referencing…', 'Excavating knowledge…', 'Consulting the oracle…', 'Calculating…',
  ]
  const [loadingPhraseIdx, setLoadingPhraseIdx] = useState(0)
  useEffect(() => {
    if (!mutation.isPending) return
    setLoadingPhraseIdx(Math.floor(Math.random() * LOADING_PHRASES.length))
    const interval = setInterval(() => {
      setLoadingPhraseIdx((i) => (i + 1) % LOADING_PHRASES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [mutation.isPending])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || trimmed.length < 5 || mutation.isPending) return
    if (trimmed.length > 2000) return
    setOptimisticContent(trimmed)
    mutation.mutate(trimmed)
    setInput('')
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleVoiceToggle = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')
      setInput(transcript)
      setSendError(null)
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
      }
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const voiceSupported = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  const handleTextSelect = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) { setSelectionPopup(null); return }
    const text = selection.toString().trim()
    if (text.length < 3) { setSelectionPopup(null); return }
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setSelectionPopup({ text, x: rect.left + rect.width / 2, y: rect.top })
  }

  useEffect(() => {
    const dismiss = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-selection-popup]')) setSelectionPopup(null)
      if (!target.closest('[data-ai-settings]')) setAiSettingsOpen(false)
    }
    document.addEventListener('mousedown', dismiss)
    return () => document.removeEventListener('mousedown', dismiss)
  }, [])

  // Selection handlers
  const handleEnterSelect = () => {
    setSelectMode(true)
    setSelectedIds(new Set())
  }

  const handleExitSelect = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleToggleSelect = (questionId: string) => {
    setSelectedIds((prev) => {
      const s = new Set(prev)
      if (s.has(questionId)) s.delete(questionId)
      else s.add(questionId)
      return s
    })
  }

  const handleOpenShareModal = () => {
    const firstSelected = questions.find((q) => selectedIds.has(q.question_id))
    setShareTitle(firstSelected?.content.slice(0, 80) || '')
    setIncludeQuestions(true)
    setShareModal(true)
  }

  const handleConfirmShare = async () => {
    setSharing(true)
    try {
      const orderedIds = questions
        .filter((q) => selectedIds.has(q.question_id))
        .map((q) => q.question_id)
      await createThread(sessionId!, orderedIds, shareTitle.trim() || undefined, includeQuestions)
      setShareModal(false)
      handleExitSelect()
    } finally {
      setSharing(false)
    }
  }

  // Show optimistic bubble only while the mutation is in flight AND the real question hasn't arrived yet
  const showOptimistic = mutation.isPending && optimisticContent !== null &&
    !questions.some(q => q.content === optimisticContent)

  const isActive = check?.session_status === 'active'
  const isEnded = check?.session_status === 'ended'
  const canChat = !isEnded

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
    <div className="min-h-screen flex" style={{ background: '#0c0c35' }}>
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
              ← Back
            </Button>
            {isActive ? (
              <>
                <Badge className="animate-pulse text-xs border-0" style={{ background: '#dcfce7', color: '#166534' }}>
                  ● Live
                </Badge>
                {!isMobile && (
                  <span className="text-xs text-muted-foreground">
                    Questions are automatically summarized with the class and shared with the professor
                  </span>
                )}
              </>
            ) : check && (
              <span className="text-xs text-muted-foreground capitalize">
                {check.session_status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isFetching && !mutation.isPending && !isMobile && (
              <span className="text-xs text-muted-foreground">Refreshing…</span>
            )}
            {!isMobile && check?.questions_limit !== undefined && (
              <span className={`text-xs font-medium tabular-nums ${
                questions.length >= check.questions_limit - 1
                  ? 'text-destructive'
                  : questions.length >= Math.floor(check.questions_limit * 0.7)
                  ? 'text-warning'
                  : 'text-muted-foreground'
              }`}>
                {questions.length}/{check.questions_limit} questions
              </span>
            )}
            {/* Select mode toggle */}
            {!isMobile && questions.length > 0 && (
              selectMode ? (
                <button
                  onClick={handleExitSelect}
                  style={{ fontSize: '0.75rem', color: '#272757', fontWeight: 600, background: 'rgba(39,39,87,0.08)', border: 'none', borderRadius: '99px', padding: '0.3rem 0.75rem', cursor: 'pointer' }}
                >
                  Cancel {selectedIds.size > 0 && `(${selectedIds.size})`}
                </button>
              ) : (
                <button
                  onClick={handleEnterSelect}
                  style={{ fontSize: '0.75rem', color: '#505081', background: 'none', border: '1px solid rgba(80,80,129,0.3)', borderRadius: '99px', padding: '0.3rem 0.75rem', cursor: 'pointer' }}
                >
                  Select
                </button>
              )
            )}
            {/* AI Settings button */}
            {!isMobile && <div data-ai-settings style={{ position: 'relative' }}>
              <button
                onClick={() => setAiSettingsOpen((v) => !v)}
                title="AI settings"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.75rem', fontWeight: 500,
                  color: aiSettingsOpen ? '#272757' : '#505081',
                  background: aiSettingsOpen ? 'rgba(39,39,87,0.1)' : 'none',
                  border: '1px solid rgba(80,80,129,0.25)',
                  borderRadius: '99px', padding: '0.3rem 0.75rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!aiSettingsOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(39,39,87,0.06)' }}
                onMouseLeave={e => { if (!aiSettingsOpen) (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <Settings2 style={{ width: '0.85rem', height: '0.85rem' }} />
                AI Style
              </button>

              <AnimatePresence>
                {aiSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.13 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
                      background: '#fff', borderRadius: '0.85rem',
                      boxShadow: '0 8px 32px rgba(39,39,87,0.18), 0 1px 4px rgba(39,39,87,0.08)',
                      padding: '0.75rem', minWidth: '220px', zIndex: 50,
                      border: '1px solid rgba(39,39,87,0.08)',
                    }}
                  >
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8686AC', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', paddingLeft: '0.1rem' }}>
                      AI Teaching Style
                    </p>
                    {([
                      { value: 'supportive', label: 'Supportive', desc: 'Encouraging & step-by-step' },
                      { value: 'normal', label: 'Normal', desc: 'Clear and professional' },
                      { value: 'funny', label: 'Funny', desc: 'Light-hearted with humour' },
                    ] as const).map(({ value, label, desc }) => {
                      const active = personality === value
                      return (
                        <button
                          key={value}
                          onClick={() => { setPersonality(value); setAiSettingsOpen(false) }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.55rem 0.65rem', borderRadius: '0.5rem', border: 'none',
                            background: active ? 'rgba(39,39,87,0.07)' : 'transparent',
                            cursor: 'pointer', textAlign: 'left', marginBottom: '0.2rem',
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(39,39,87,0.04)' }}
                          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <div>
                            <p style={{ fontSize: '0.82rem', fontWeight: active ? 600 : 500, color: active ? '#272757' : '#374151', margin: 0 }}>{label}</p>
                            <p style={{ fontSize: '0.7rem', color: '#8686AC', margin: '0.1rem 0 0' }}>{desc}</p>
                          </div>
                          {active && (
                            <Check style={{ width: '0.85rem', height: '0.85rem', color: '#272757', flexShrink: 0 }} />
                          )}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>}

            <div className="flex items-center gap-2 text-sm">
              {anonymous
                ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                : <Eye className="h-4 w-4 text-primary" />
              }
              {!isMobile && <span className="text-xs text-muted-foreground">Anonymous</span>}
              <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative" style={{ background: '#f7f7fc' }}>
            {/* Messages */}
            <div className={`flex-1 overflow-y-auto space-y-5 ${isMobile ? 'p-4' : 'p-5 pl-10'}`}>
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
                  isSaved={q.answer ? savedAnswers.has(q.answer.answer_id) : false}
                  onToggleSave={handleToggleSave}
                  onRegenerate={(content) => {
                    if (mutation.isPending) return
                    mutation.mutate(content)
                  }}
                  onFollowUp={(text) => {
                    setInput(text)
                    setTimeout(() => inputRef.current?.focus(), 50)
                  }}
                  onShareThis={() => {
                    setSelectedIds(new Set([q.question_id]))
                    setShareTitle(q.content.slice(0, 80))
                    setIncludeQuestions(true)
                    setShareModal(true)
                  }}
                  onTextSelect={handleTextSelect}
                  selectMode={selectMode}
                  isSelected={selectedIds.has(q.question_id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}

              {/* Optimistic question + typing indicator */}
              {showOptimistic && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl px-4 py-3 gradient-primary text-white">
                      <p className="text-sm">{optimisticContent}</p>
                      {anonymous && (
                        <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                          <EyeOff className="h-3 w-3" /> Asked anonymously
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <motion.div
                      key={loadingPhraseIdx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-2xl px-4 py-3 bg-muted text-muted-foreground text-sm"
                      style={{ fontStyle: 'italic', color: '#8686AC' }}
                    >
                      {LOADING_PHRASES[loadingPhraseIdx]}
                    </motion.div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Floating action bar — shown when items selected */}
            <AnimatePresence>
              {selectMode && selectedIds.size > 0 && !shareModal && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  style={{
                    position: 'absolute', bottom: canChat ? '5.5rem' : '1rem', left: '1rem', right: '1rem',
                    background: 'rgba(39,39,87,0.95)', backdropFilter: 'blur(8px)',
                    borderRadius: '0.75rem', padding: '0.75rem 1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    zIndex: 20,
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>
                    {selectedIds.size} exchange{selectedIds.size !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={handleOpenShareModal}
                    style={{
                      background: '#fff', color: '#272757', borderRadius: '99px',
                      padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 600,
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                    }}
                  >
                    <Share2 style={{ width: '0.85rem', height: '0.85rem' }} />
                    Share with class
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div style={{ padding: '0 1.25rem 1.25rem', background: '#f7f7fc', flexShrink: 0 }}>
              {canChat ? (
                rateLimited ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{sendError}</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleSend() }}>
                    {/* Pill */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '9999px',
                      boxShadow: '0 4px 24px -2px rgba(39,39,87,0.13), 0 1px 6px -1px rgba(39,39,87,0.07)',
                      border: '1.5px solid rgba(39,39,87,0.09)',
                      display: 'flex', alignItems: 'flex-end',
                      padding: '0.4rem 0.4rem 0.4rem 1rem',
                      gap: '0.25rem',
                    }}>
                      {/* Textarea — grows vertically, pill stays rounded */}
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value)
                          setSendError(null)
                          e.target.style.height = 'auto'
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                        }}
                        onKeyDown={handleTextareaKeyDown}
                        placeholder={
                          isListening ? 'Listening…' :
                          mutation.isPending ? 'Generating answer…' :
                          'Ask a question about this session…'
                        }
                        disabled={mutation.isPending}
                        rows={1}
                        style={{
                          flex: 1, resize: 'none', border: 'none', outline: 'none',
                          background: 'transparent', fontSize: '0.875rem', lineHeight: '1.5',
                          color: isListening ? '#dc2626' : '#1a1a2e', fontFamily: 'inherit',
                          minHeight: '1.5rem', maxHeight: '120px',
                          overflowY: 'auto', padding: '0.3rem 0',
                          alignSelf: 'center',
                        }}
                        aria-label="Ask a question"
                      />

                      {/* Mic */}
                      {voiceSupported && (
                        <button
                          type="button"
                          onClick={handleVoiceToggle}
                          title={isListening ? 'Stop recording' : 'Voice input'}
                          aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                          className={isListening ? 'animate-pulse' : ''}
                          style={{
                            background: isListening ? 'rgba(220,38,38,0.1)' : 'none',
                            border: 'none', cursor: 'pointer',
                            color: isListening ? '#dc2626' : '#b0b0cc',
                            padding: '0.4rem', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'color 0.15s, background 0.15s', flexShrink: 0,
                          }}
                          onMouseEnter={e => { if (!isListening) { (e.currentTarget as HTMLElement).style.color = '#272757'; (e.currentTarget as HTMLElement).style.background = 'rgba(39,39,87,0.07)' } }}
                          onMouseLeave={e => { if (!isListening) { (e.currentTarget as HTMLElement).style.color = '#b0b0cc'; (e.currentTarget as HTMLElement).style.background = 'transparent' } }}
                        >
                          {isListening ? <MicOff style={{ width: '1rem', height: '1rem' }} /> : <Mic style={{ width: '1rem', height: '1rem' }} />}
                        </button>
                      )}

                      {/* Send */}
                      <button
                        type="submit"
                        disabled={mutation.isPending || !input.trim() || input.trim().length < 5 || input.length > 2000}
                        aria-label="Send question"
                        style={{
                          background: (mutation.isPending || !input.trim() || input.trim().length < 5 || input.length > 2000)
                            ? 'rgba(39,39,87,0.12)'
                            : 'linear-gradient(135deg,#272757,#505081)',
                          color: (mutation.isPending || !input.trim() || input.trim().length < 5 || input.length > 2000)
                            ? '#a0a0c0' : '#fff',
                          border: 'none', borderRadius: '50%', cursor: 'pointer',
                          width: '2.1rem', height: '2.1rem', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s, color 0.2s',
                        }}
                      >
                        <Send style={{ width: '0.875rem', height: '0.875rem' }} />
                      </button>
                    </div>

                    {/* Validation errors — below pill */}
                    {sendError && (
                      <p style={{ fontSize: '0.72rem', color: '#dc2626', margin: '0.35rem 0 0 1rem' }}>{sendError}</p>
                    )}
                    {!sendError && input.trim().length > 0 && input.trim().length < 5 && (
                      <p style={{ fontSize: '0.72rem', color: '#dc2626', margin: '0.35rem 0 0 1rem' }}>At least 5 characters required</p>
                    )}
                    {input.length > 1800 && (
                      <p style={{ fontSize: '0.72rem', color: input.length > 2000 ? '#dc2626' : '#8686AC', margin: '0.35rem 0 0 1rem' }}>
                        {input.length} / 2000
                      </p>
                    )}
                  </form>
                )
              ) : (
                <p className="text-center text-sm text-muted-foreground py-3">
                  This lecture has ended. Questions are read-only.
                </p>
              )}
            </div>
          </div>

          {/* Drag divider + PDF Panel — desktop only */}
          {!isMobile && (
            <>
              <div
                onMouseDown={onDividerMouseDown}
                className="w-1.5 shrink-0 bg-border hover:bg-primary/40 cursor-col-resize transition-colors"
              />
              <DocumentPanel sessionId={sessionId!} width={pdfWidth} />
            </>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {shareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(12,12,53,0.55)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShareModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(12,12,53,0.25)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', color: '#272757', margin: 0 }}>
                  Share {selectedIds.size} exchange{selectedIds.size !== 1 ? 's' : ''} with class
                </h3>
                <button onClick={() => setShareModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8686AC', padding: '0.25rem' }}>
                  <X style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>

              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#505081', display: 'block', marginBottom: '0.4rem' }}>Thread title</label>
              <input
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. Why does gradient descent converge?"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e5e7eb', fontSize: '0.85rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#272757')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />

              {/* Include questions toggle */}
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.5rem', background: '#f7f7fc', marginBottom: '1.25rem', cursor: 'pointer' }}
                onClick={() => setIncludeQuestions((v) => !v)}
              >
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#272757', margin: 0 }}>Include my questions</p>
                  <p style={{ fontSize: '0.72rem', color: '#8686AC', margin: '0.15rem 0 0' }}>
                    {includeQuestions ? 'Classmates see full Q&A' : 'Classmates see only AI answers'}
                  </p>
                </div>
                <div style={{
                  width: '2.25rem', height: '1.25rem', borderRadius: '99px',
                  background: includeQuestions ? '#272757' : '#d1d5db',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: '0.15rem',
                    left: includeQuestions ? '1.1rem' : '0.15rem',
                    width: '0.95rem', height: '0.95rem', borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShareModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: 'none', fontSize: '0.85rem', cursor: 'pointer', color: '#505081' }}>
                  Cancel
                </button>
                <button
                  onClick={handleConfirmShare}
                  disabled={sharing}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg,#272757,#505081)', color: '#fff', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: sharing ? 0.6 : 1 }}
                >
                  <Share2 style={{ width: '0.85rem', height: '0.85rem' }} />
                  {sharing ? 'Sharing…' : 'Share with class'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text-selection popup */}
      <AnimatePresence>
        {selectionPopup && (
          <motion.div
            data-selection-popup
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'fixed',
              left: selectionPopup.x,
              top: selectionPopup.y - 44,
              transform: 'translateX(-50%)',
              zIndex: 9999,
              pointerEvents: 'auto',
            }}
          >
            <button
              data-selection-popup
              onClick={() => {
                const quoted = `"${selectionPopup.text}" — can you explain this further?`
                setInput(quoted)
                setSelectionPopup(null)
                window.getSelection()?.removeAllRanges()
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#1a1a2e', color: '#fff',
                border: 'none', borderRadius: '99px',
                padding: '0.4rem 0.85rem 0.4rem 0.65rem',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              <Quote style={{ width: '0.85rem', height: '0.85rem', opacity: 0.75 }} />
              Ask about this
            </button>
            {/* Caret */}
            <div style={{
              position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
              borderTop: '5px solid #1a1a2e',
            }} />
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
            className={`fixed ${isMobile ? 'bottom-24 right-3 left-3 max-w-none' : 'bottom-6 right-6 max-w-sm'} p-4 rounded-xl bg-card border border-primary/30 elevated-shadow z-50`}
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
