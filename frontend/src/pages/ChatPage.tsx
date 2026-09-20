import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, FileText, PanelLeftClose, PanelLeftOpen, Quote, Settings2, Share2, X } from 'lucide-react'
import {
  checkSession, createThread, getQuestions, getSessionDocuments, getSavedAnswers, postQuestion, saveAnswer, submitFeedback, unsaveAnswer,
} from '../api/sessions'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'
import type { CitationOut, DocumentOut, QuestionOut } from '../types/api'
import MessageList from '../components/MessageList'
import QuestionInput, { MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH } from '../components/QuestionInput'
import DashboardLayout from '@/components/DashboardLayout'

// ─── constants ─────────────────────────────────────────────────────────────────
const MIN_PREVIEW_WIDTH = 280
const MAX_PREVIEW_WIDTH = 800
const DEFAULT_PREVIEW_WIDTH = 420
const SAVED_STRIP_MS = 6000

const PERSONALITIES = [
  { value: 'supportive', label: 'Supportive', desc: 'Encouraging & step-by-step' },
  { value: 'normal', label: 'Normal', desc: 'Clear and professional' },
  { value: 'funny', label: 'Funny', desc: 'Light-hearted with humour' },
] as const

function initialsOf(name: string | undefined): string {
  const parts = (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2)
  return parts.map((p) => p[0]!.toUpperCase()).join('') || 'Me'
}

function statusChip(status: string | undefined) {
  if (status === 'active') {
    return (
      <span className="inline-flex h-[21px] items-center gap-1.5 rounded-md bg-primary px-2 text-[10.5px] font-medium text-primary-foreground">
        <span className="h-[5px] w-[5px] rounded-full" style={{ background: 'var(--seq-1)' }} />Live
      </span>
    )
  }
  return (
    <span className="inline-flex h-[21px] items-center rounded-md border border-border bg-card px-2 text-[10.5px] font-medium capitalize text-muted-foreground">
      {status ?? '…'}
    </span>
  )
}

// ─── Materials rail (desktop) ──────────────────────────────────────────────────
function MaterialsRail({
  status, questionCount, documents, previewDoc, onPick, onBack, onThreads, onNotes,
}: {
  status: string | undefined
  questionCount: number
  documents: DocumentOut[]
  previewDoc: DocumentOut | null
  onPick: (doc: DocumentOut) => void
  onBack: () => void
  onThreads: () => void
  onNotes: () => void
}) {
  const navRow = 'flex h-[34px] w-full items-center justify-between rounded-lg px-2.5 text-[13px] transition-colors hover:bg-secondary'
  return (
    <aside className="flex w-[248px] shrink-0 flex-col gap-[18px] overflow-y-auto border-r border-border bg-background px-3.5 py-[22px]">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-[7px] px-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back
      </button>

      <div className="rounded-[10px] border border-border bg-card px-[13px] py-3">
        {statusChip(status)}
        <div className="mt-2 text-sm font-semibold leading-[1.35] tracking-[-0.014em] text-foreground">Lecture Q&amp;A</div>
        <div className="mt-1 text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
          {status === 'active' ? 'Class is live — answers come from the materials below.' : 'Answers come from the materials below.'}
        </div>
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Lecture">
        <span className={`${navRow} bg-accent font-medium text-accent-foreground hover:bg-accent`}>
          My questions <span className="text-[11.5px]" style={{ color: 'var(--ai-meta)' }}>{questionCount}</span>
        </span>
        <button type="button" onClick={onThreads} className={`${navRow} text-muted-foreground`}>From the class</button>
        <button type="button" onClick={onNotes} className={`${navRow} text-muted-foreground`}>My notes</button>
      </nav>

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between px-2.5">
          <span className="mono text-[9.5px] tracking-[0.09em]" style={{ color: 'var(--ink-3)' }}>MATERIALS IN USE</span>
          <span className="text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{documents.length}</span>
        </div>
        <div className="mt-2.5 flex flex-col gap-1">
          {documents.length === 0 && (
            <p className="px-2.5 text-xs" style={{ color: 'var(--ink-2)' }}>Nothing activated yet.</p>
          )}
          {documents.map((doc) => {
            const active = previewDoc?.id === doc.id
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => onPick(doc)}
                aria-pressed={active}
                className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${active ? 'bg-accent' : 'hover:bg-secondary'}`}
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: active ? 'var(--ai-meta)' : 'var(--ink-3)' }} />
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] leading-[1.35] text-foreground">{doc.filename}</span>
                  <span className="block text-[11px]" style={{ color: 'var(--ink-2)' }}>
                    {doc.page_count ? `${doc.page_count} pages` : doc.content ? 'text' : 'document'} · in scope
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

// ─── Material preview (desktop right panel / mobile overlay) ──────────────────
function MaterialPreview({ doc, onClose, width }: { doc: DocumentOut; onClose: () => void; width?: number }) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-card" style={width ? { width } : undefined}>
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
        <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ink-3)' }} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">{doc.filename}</span>
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open in new tab</a>
        )}
        <button type="button" onClick={onClose} aria-label="Close preview" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden bg-background">
        {doc.content ? (
          <div className="h-full overflow-y-auto whitespace-pre-wrap p-4 text-sm text-foreground">{doc.content}</div>
        ) : doc.url ? (
          <iframe key={doc.id} src={doc.url} title={doc.filename} className="h-full w-full border-0" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No preview available</div>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const displayName = useAuthStore((s) => s.user?.display_name)
  const personality = useSettingsStore((s) => s.personality)
  const setPersonality = useSettingsStore((s) => s.setPersonality)

  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false))
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // composer
  const [input, setInput] = useState('')
  const [optimisticContent, setOptimisticContent] = useState<string | null>(null)
  const [anonymous, setAnonymous] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // notes
  const [savedAnswers, setSavedAnswers] = useState<Set<string>>(new Set())
  const [justSavedId, setJustSavedId] = useState<string | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // chrome
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false)
  const [railOpen, setRailOpen] = useState(true)
  const [materialsSheet, setMaterialsSheet] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocumentOut | null>(null)
  const [selectionPopup, setSelectionPopup] = useState<{ text: string; x: number; y: number } | null>(null)

  // sharing
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [shareModal, setShareModal] = useState(false)
  const [shareTitle, setShareTitle] = useState('')
  const [includeQuestions, setIncludeQuestions] = useState(true)
  const [sharing, setSharing] = useState(false)

  // resizable preview panel
  const [previewWidth, setPreviewWidth] = useState(DEFAULT_PREVIEW_WIDTH)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(DEFAULT_PREVIEW_WIDTH)
  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = previewWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [previewWidth])
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = dragStartX.current - e.clientX
      setPreviewWidth(Math.min(MAX_PREVIEW_WIDTH, Math.max(MIN_PREVIEW_WIDTH, dragStartWidth.current + delta)))
    }
    const onUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  // ── data ────────────────────────────────────────────────────────────────────
  const { data: check, isLoading: checkLoading } = useQuery({
    queryKey: ['session-check', sessionId],
    queryFn: () => checkSession(sessionId!),
    retry: false,
  })
  useEffect(() => {
    if (!checkLoading && check && !check.enrolled) navigate('/classes')
  }, [check, checkLoading, navigate])

  const { data: documents = [] } = useQuery({
    queryKey: ['session-documents', sessionId],
    queryFn: () => getSessionDocuments(sessionId!),
  })
  const materialNames = documents.map((d) => d.filename)

  const { data: questions = [] } = useQuery({
    queryKey: ['questions', sessionId],
    queryFn: () => getQuestions(sessionId!),
    refetchInterval: 5000,
    enabled: !!check?.enrolled,
  })

  useEffect(() => {
    getSavedAnswers()
      .then((saved) => setSavedAnswers(new Set(saved.map((s) => s.answer_id))))
      .catch(() => { /* bookmark state stays empty */ })
  }, [])

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
      setSendError(response?.data?.detail ?? 'Something went wrong. Please try again.')
      if (response?.status === 429) setRateLimited(true)
    },
  })

  // ── notes ───────────────────────────────────────────────────────────────────
  const showSavedStrip = (answerId: string) => {
    if (savedTimer.current) clearTimeout(savedTimer.current)
    setJustSavedId(answerId)
    savedTimer.current = setTimeout(() => setJustSavedId(null), SAVED_STRIP_MS)
  }
  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current) }, [])

  const handleUnsave = async (answerId: string) => {
    setJustSavedId((id) => (id === answerId ? null : id))
    setSavedAnswers((prev) => { const s = new Set(prev); s.delete(answerId); return s })
    await unsaveAnswer(answerId).catch(() => setSavedAnswers((prev) => new Set(prev).add(answerId)))
  }
  const handleToggleSave = async (answerId: string) => {
    if (savedAnswers.has(answerId)) { await handleUnsave(answerId); return }
    setSavedAnswers((prev) => new Set(prev).add(answerId))
    try {
      await saveAnswer(answerId)
      showSavedStrip(answerId)
    } catch {
      setSavedAnswers((prev) => { const s = new Set(prev); s.delete(answerId); return s })
    }
  }

  // ── composer ────────────────────────────────────────────────────────────────
  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || trimmed.length < MIN_QUESTION_LENGTH || trimmed.length > MAX_QUESTION_LENGTH || mutation.isPending) return
    setOptimisticContent(trimmed)
    mutation.mutate(trimmed)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
  }

  const focusComposer = (prefill?: string) => {
    if (prefill !== undefined) setInput(prefill)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null
  const handleVoiceToggle = () => {
    if (!SR) return
    if (isListening) { recognitionRef.current?.stop(); return }
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
      const transcript = Array.from(event.results).map((r) => r[0].transcript).join('')
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

  // ── selection popup / dropdown dismissal ────────────────────────────────────
  const handleTextSelect = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) { setSelectionPopup(null); return }
    const text = selection.toString().trim()
    if (text.length < 3) { setSelectionPopup(null); return }
    const rect = selection.getRangeAt(0).getBoundingClientRect()
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

  // ── materials ───────────────────────────────────────────────────────────────
  const openDocument = (doc: DocumentOut) => {
    setMaterialsSheet(false)
    if (isMobile && !doc.content && doc.url) { window.open(doc.url, '_blank', 'noopener'); return }
    setPreviewDoc(doc)
  }
  const openCitation = (c: CitationOut) => {
    const doc = documents.find((d) => d.id === c.document_id) ?? documents.find((d) => d.filename === c.filename)
    if (doc) openDocument(doc)
  }

  // ── sharing ─────────────────────────────────────────────────────────────────
  const exitSelect = () => { setSelectMode(false); setSelectedIds(new Set()) }
  const toggleSelect = (questionId: string) =>
    setSelectedIds((prev) => { const s = new Set(prev); if (s.has(questionId)) s.delete(questionId); else s.add(questionId); return s })
  const openShareModal = (ids: Set<string>) => {
    const first = questions.find((q) => ids.has(q.question_id))
    setSelectedIds(ids)
    setShareTitle(first?.content.slice(0, 80) || '')
    setIncludeQuestions(true)
    setShareModal(true)
  }
  const confirmShare = async () => {
    setSharing(true)
    try {
      const orderedIds = questions.filter((q) => selectedIds.has(q.question_id)).map((q) => q.question_id)
      await createThread(sessionId!, orderedIds, shareTitle.trim() || undefined, includeQuestions)
      setShareModal(false)
      exitSelect()
    } finally {
      setSharing(false)
    }
  }

  // ── derived ─────────────────────────────────────────────────────────────────
  const pending = mutation.isPending && optimisticContent !== null && !questions.some((q) => q.content === optimisticContent)
    ? { content: optimisticContent, anonymous }
    : null
  const isEnded = check?.session_status === 'ended'
  const canChat = !isEnded
  const initials = initialsOf(displayName)

  const bubbleProps = (q: QuestionOut) => ({
    isSaved: q.answer ? savedAnswers.has(q.answer.answer_id) : false,
    justSaved: q.answer ? justSavedId === q.answer.answer_id : false,
    onToggleSave: handleToggleSave,
    onUndoSave: handleUnsave,
    onFollowUp: () => focusComposer(),
    onRegenerate: (content: string) => { if (!mutation.isPending) { setOptimisticContent(content); mutation.mutate(content) } },
    onShareThis: () => openShareModal(new Set([q.question_id])),
    onOpenCitation: openCitation,
    onFeedback: (answerId: string, fb: 'up' | 'down') => { submitFeedback(answerId, fb).catch(() => { /* feedback is best-effort */ }) },
    onTextSelect: handleTextSelect,
    selectMode,
    isSelected: selectedIds.has(q.question_id),
    onToggleSelect: toggleSelect,
  })

  if (checkLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-muted-foreground">Loading lecture…</div>
      </DashboardLayout>
    )
  }

  const showRail = !isMobile && railOpen

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {showRail && (
        <MaterialsRail
          status={check?.session_status}
          questionCount={questions.length}
          documents={documents}
          previewDoc={previewDoc}
          onPick={openDocument}
          onBack={() => navigate(-1)}
          onThreads={() => navigate(`/sessions/${sessionId}/threads`)}
          onNotes={() => navigate('/notes')}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className={`flex shrink-0 items-center gap-3 border-b border-border bg-card ${isMobile ? 'py-3 pl-2 pr-3' : 'px-8 py-4'}`}>
          {isMobile ? (
            <>
              <button type="button" onClick={() => navigate(-1)} aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-[10px] hover:bg-secondary">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {statusChip(check?.session_status)}
                  <span className="text-[11px]" style={{ color: 'var(--ink-2)' }}>{materialNames.length} material{materialNames.length === 1 ? '' : 's'} in scope</span>
                </div>
                <div className="mt-[3px] truncate text-[14.5px] font-semibold tracking-[-0.015em]">Lecture Q&amp;A</div>
              </div>
              <button
                type="button"
                onClick={() => setMaterialsSheet(true)}
                aria-label="Materials in use"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-card hover:bg-secondary"
              >
                <FileText className="h-[18px] w-[18px]" style={{ color: 'var(--ink-2)' }} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setRailOpen((v) => !v)}
                aria-label={railOpen ? 'Hide materials' : 'Show materials'}
                aria-expanded={railOpen}
                className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary"
              >
                {railOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold tracking-[-0.02em]">Lecture Q&amp;A</h1>
                <p className="mt-0.5 text-[12.5px]" style={{ color: 'var(--ink-2)' }}>
                  Your questions are yours and your professor's — share an answer to put it in the class thread.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {questions.length > 0 && (
                  selectMode ? (
                    <button type="button" onClick={exitSelect} className="h-[33px] rounded-lg bg-accent px-3 text-[12.5px] font-medium text-accent-foreground">
                      Cancel{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                    </button>
                  ) : (
                    <button type="button" onClick={() => { setSelectMode(true); setSelectedIds(new Set()) }} className="h-[33px] rounded-lg border border-border bg-card px-3 text-[12.5px] hover:bg-secondary">
                      Select to share
                    </button>
                  )
                )}
                <div data-ai-settings className="relative">
                  <button
                    type="button"
                    onClick={() => setAiSettingsOpen((v) => !v)}
                    aria-expanded={aiSettingsOpen}
                    className={`inline-flex h-[33px] items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] hover:bg-secondary ${aiSettingsOpen ? 'bg-secondary' : 'bg-card'}`}
                  >
                    <Settings2 className="h-3.5 w-3.5" /> {PERSONALITIES.find((p) => p.value === personality)?.label ?? 'Style'}
                  </button>
                  <AnimatePresence>
                    {aiSettingsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.13 }}
                        className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[220px] rounded-xl border border-border bg-card p-2 elevated-shadow"
                        role="menu"
                      >
                        <p className="mono px-2 pb-1.5 pt-1 text-[9.5px] tracking-[0.09em]" style={{ color: 'var(--ink-3)' }}>ANSWER STYLE</p>
                        {PERSONALITIES.map(({ value, label, desc }) => {
                          const active = personality === value
                          return (
                            <button
                              key={value}
                              type="button"
                              role="menuitemradio"
                              aria-checked={active}
                              onClick={() => { setPersonality(value); setAiSettingsOpen(false) }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-secondary ${active ? 'bg-accent' : ''}`}
                            >
                              <span>
                                <span className={`block text-[13px] ${active ? 'font-semibold text-accent-foreground' : 'text-foreground'}`}>{label}</span>
                                <span className="block text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{desc}</span>
                              </span>
                              {active && <Check className="h-3.5 w-3.5 text-primary" />}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </header>

        <div className="flex min-h-0 flex-1">
          {/* conversation */}
          <main className="relative flex min-w-0 flex-1 flex-col">
            <div className={`min-h-0 flex-1 overflow-y-auto ${isMobile ? 'px-4 pb-3 pt-3.5' : 'px-8 pb-4 pt-5'}`}>
              <div className="mx-auto h-full max-w-[860px]">
                <MessageList questions={questions} pending={pending} materialNames={materialNames} initials={initials} bubbleProps={bubbleProps} />
              </div>
            </div>

            {/* floating share bar */}
            <AnimatePresence>
              {selectMode && selectedIds.size > 0 && !shareModal && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="absolute left-4 right-4 z-20 flex items-center justify-between rounded-xl px-4 py-3 text-primary-foreground elevated-shadow"
                  style={{ bottom: canChat ? '7.5rem' : '1rem', background: 'var(--dark)' }}
                >
                  <span className="text-[13px] opacity-80">{selectedIds.size} exchange{selectedIds.size !== 1 ? 's' : ''} selected</span>
                  <button type="button" onClick={() => openShareModal(selectedIds)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-card px-3.5 text-[13px] font-medium text-foreground">
                    <Share2 className="h-3.5 w-3.5" /> Share with class
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* composer */}
            {canChat ? (
              rateLimited ? (
                <div className={`shrink-0 ${isMobile ? 'px-4 pb-5 pt-3' : 'px-8 pb-5 pt-3'}`}>
                  <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'hsl(var(--destructive) / 0.3)', background: 'hsl(var(--destructive) / 0.06)', color: 'hsl(var(--destructive))' }}>
                    {sendError}
                  </div>
                </div>
              ) : (
                <div className={`shrink-0 ${isMobile ? '' : 'px-8 pb-5 pt-3.5'}`}>
                  <div className={isMobile ? '' : 'mx-auto max-w-[860px]'}>
                    <QuestionInput
                      value={input}
                      onChange={(v) => { setInput(v); setSendError(null) }}
                      onSubmit={handleSend}
                      pending={mutation.isPending}
                      materialNames={materialNames}
                      anonymous={anonymous}
                      onAnonymousChange={setAnonymous}
                      voice={{ supported: !!SR, listening: isListening, onToggle: handleVoiceToggle }}
                      error={sendError}
                      inputRef={inputRef}
                      isMobile={isMobile}
                      onOpenMaterials={() => setMaterialsSheet(true)}
                      questionsUsed={questions.length}
                      questionsLimit={check?.questions_limit}
                    />
                  </div>
                </div>
              )
            ) : (
              <p className="shrink-0 py-4 text-center text-sm text-muted-foreground">This lecture has ended. Questions are read-only.</p>
            )}
          </main>

          {/* material preview — desktop */}
          {!isMobile && previewDoc && (
            <>
              <div
                onMouseDown={onDividerMouseDown}
                role="separator"
                aria-orientation="vertical"
                className="w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/40"
              />
              <MaterialPreview doc={previewDoc} width={previewWidth} onClose={() => setPreviewDoc(null)} />
            </>
          )}
        </div>
      </div>

      {/* material preview — mobile overlay (inline text docs) */}
      {isMobile && previewDoc && (
        <div className="fixed inset-0 z-50 bg-card">
          <MaterialPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
        </div>
      )}

      {/* materials sheet — mobile */}
      <AnimatePresence>
        {isMobile && materialsSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: 'rgba(25,24,22,0.45)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setMaterialsSheet(false) }}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              className="w-full rounded-t-2xl bg-card px-4 pb-6 pt-3"
              role="dialog"
              aria-label="Materials in use"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
              <div className="flex items-center justify-between">
                <span className="mono text-[9.5px] tracking-[0.09em]" style={{ color: 'var(--ink-3)' }}>MATERIALS IN USE</span>
                <button type="button" onClick={() => setMaterialsSheet(false)} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>Horizon answers only from these.</p>
              <div className="mt-3 flex flex-col gap-1">
                {documents.length === 0 && <p className="py-2 text-sm text-muted-foreground">Nothing activated yet.</p>}
                {documents.map((doc) => (
                  <button key={doc.id} type="button" onClick={() => openDocument(doc)} className="flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-left hover:bg-secondary">
                    <FileText className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-3)' }} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">{doc.filename}</span>
                      <span className="block text-[11px]" style={{ color: 'var(--ink-2)' }}>{doc.page_count ? `${doc.page_count} pages` : 'document'} · in scope</span>
                    </span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => { setMaterialsSheet(false); navigate('/notes') }} className="mt-3 h-11 w-full rounded-lg border border-border text-sm">My notes</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* share modal */}
      <AnimatePresence>
        {shareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(25,24,22,0.45)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShareModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-[420px] rounded-2xl bg-card p-6 elevated-shadow"
              role="dialog"
              aria-labelledby="share-title"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 id="share-title" className="text-base font-semibold">
                  Share {selectedIds.size} exchange{selectedIds.size !== 1 ? 's' : ''} with the class
                </h3>
                <button type="button" onClick={() => setShareModal(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <label htmlFor="thread-title" className="mb-1.5 block text-xs font-semibold text-muted-foreground">Thread title</label>
              <input
                id="thread-title"
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. Why does water move toward the saltier side?"
                className="mb-4 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                style={{ borderColor: 'hsl(var(--input))' }}
              />
              <button
                type="button"
                onClick={() => setIncludeQuestions((v) => !v)}
                role="switch"
                aria-checked={includeQuestions}
                className="mb-5 flex w-full items-center justify-between rounded-lg bg-background p-3 text-left"
              >
                <span>
                  <span className="block text-[13px] font-semibold">Include my questions</span>
                  <span className="block text-xs" style={{ color: 'var(--ink-2)' }}>
                    {includeQuestions ? 'Classmates see the full Q&A' : 'Classmates see only the answers'}
                  </span>
                </span>
                <span className="relative h-5 w-9 shrink-0 rounded-full transition-colors" style={{ background: includeQuestions ? 'hsl(var(--primary))' : 'hsl(var(--input))' }}>
                  <span className="absolute top-[2px] h-4 w-4 rounded-full bg-card shadow transition-all" style={{ left: includeQuestions ? '18px' : '2px' }} />
                </span>
              </button>
              <p className="mb-4 text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
                This puts the exchange in the lecture thread — classmates can reply and vote.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShareModal(false)} className="h-9 rounded-lg border border-border px-4 text-sm hover:bg-secondary">Cancel</button>
                <button
                  type="button"
                  onClick={confirmShare}
                  disabled={sharing}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  <Share2 className="h-3.5 w-3.5" /> {sharing ? 'Sharing…' : 'Share with class'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* text-selection popup */}
      <AnimatePresence>
        {selectionPopup && (
          <motion.div
            data-selection-popup
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[70] -translate-x-1/2"
            style={{ left: selectionPopup.x, top: selectionPopup.y - 44 }}
          >
            <button
              type="button"
              data-selection-popup
              onClick={() => {
                focusComposer(`"${selectionPopup.text}" — can you explain this further?`)
                setSelectionPopup(null)
                window.getSelection()?.removeAllRanges()
              }}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground elevated-shadow"
              style={{ background: 'var(--dark)' }}
            >
              <Quote className="h-3.5 w-3.5 opacity-75" /> Ask about this
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
