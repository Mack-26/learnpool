import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertTriangle, ThumbsUp, ThumbsDown,
  MessageSquareText, ChevronRight, MessageSquare,
  GitFork, Pencil, Trash2, Check, X, Users,
  WrenchIcon, RotateCcw, BookOpen,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  getSessionReport, getSharedThreads,
  submitThreadFeedback, forkThread,
} from '../api/sessions'
import {
  getProfessorSessionReport,
  getProfessorSharedThreads, updateThreadReview, submitProfessorThreadFeedback,
  updateThreadTitle, deleteProfessorThread,
  getStudentActivity, getSessionTimeline,
} from '../api/professor'
import { useAuthStore } from '../store/authStore'
import type {
  ReportQuestionOut, RichThreadOut, ThreadFeedbackOut,
} from '../types/api'
import DashboardLayout from '@/components/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import CategoryBarChart from '@/components/CategoryBarChart'
import LabelBarChart from '@/components/LabelBarChart'
import CommentThread from '@/components/CommentThread'
import { renderAnswerWithCitations } from '@/components/AnswerRenderer'
import CitationMapCard from '@/components/CitationMapCard'
import StudentActivityTable from '@/components/StudentActivityTable'
import QuestionTimeline from '@/components/QuestionTimeline'
import AnswerQualityBreakdown from '@/components/AnswerQualityBreakdown'

// ─── Label definitions ────────────────────────────────────────────────────────
const DISCUSSED_LABEL = 'Discussed in class'

const LABELS = [
  { emoji: '✓', label: DISCUSSED_LABEL,        color: 'green'  },
  { emoji: '⚡', label: 'Interesting Question', color: 'blue'   },
  { emoji: '🎯', label: 'Good Analogy',         color: 'green'  },
  { emoji: '❌', label: 'Wrong Answer',          color: 'red'    },
  { emoji: '⚠️', label: 'Misleading',           color: 'yellow' },
  { emoji: '🧠', label: 'Deep Understanding',   color: 'purple' },
  { emoji: '📄', label: 'Surface Level',        color: 'gray'   },
  { emoji: '🔄', label: 'Needs Follow-up',      color: 'orange' },
] as const

const LABEL_COLOR_MAP: Record<string, string> = {
  blue:   'bg-amber-50 text-amber-700 border-amber-200',
  green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  red:    'bg-red-50 text-red-600 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
  gray:   'bg-slate-50 text-slate-500 border-slate-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
}

const LABEL_INACTIVE = 'bg-muted text-muted-foreground border-border hover:border-primary/40 hover:bg-muted/80'

function effectiveNeedsAttention(q: ReportQuestionOut): boolean {
  if (!q.feedback?.needs_attention) return false
  return !q.professor_labels?.includes(DISCUSSED_LABEL)
}

// ─── Rich Thread Card (primary unit for class dashboard) ─────────────────────

function RichThreadCard({
  thread,
  index,
  isProfessor,
  onForkSuccess,
  onDeleted,
}: {
  thread: RichThreadOut
  index: number
  isProfessor?: boolean
  onForkSuccess?: () => void
  onDeleted?: (threadId: string) => void
}) {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [forkOpen, setForkOpen] = useState(false)
  const [forkText, setForkText] = useState('')
  const [forking, setForking] = useState(false)

  // Edit title state
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(thread.title ?? '')

  // Local vote state for optimistic updates
  const [myFeedback, setMyFeedback] = useState<'up' | 'down' | null>(thread.my_feedback)
  const [feedback, setFeedback] = useState<ThreadFeedbackOut | null>(thread.feedback)

  // Professor label/notes state
  const [labels, setLabels] = useState<string[]>(thread.professor_labels)
  const [notes, setNotes] = useState(thread.professor_notes ?? '')
  const [labelsDirty, setLabelsDirty] = useState(false)
  const [savingLabels, setSavingLabels] = useState(false)

  const titleMutation = useMutation({
    mutationFn: (title: string) => updateThreadTitle(thread.thread_id, title),
    onSuccess: () => {
      setEditingTitle(false)
      queryClient.invalidateQueries({ queryKey: ['shared-threads', sessionId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProfessorThread(thread.thread_id),
    onSuccess: () => onDeleted?.(thread.thread_id),
  })

  const up = feedback?.thumbs_up ?? 0
  const down = feedback?.thumbs_down ?? 0
  const needsAttention = isProfessor && (down > up) && !labels.includes(DISCUSSED_LABEL)

  const handleVote = async (v: 'up' | 'down') => {
    const prev = myFeedback
    const newVote = prev === v ? null : v
    setMyFeedback(newVote)
    let newUp = up
    let newDown = down
    if (prev === 'up') newUp = Math.max(0, newUp - 1)
    if (prev === 'down') newDown = Math.max(0, newDown - 1)
    if (newVote === 'up') newUp += 1
    if (newVote === 'down') newDown += 1
    setFeedback({ thumbs_up: newUp, thumbs_down: newDown, needs_attention: newDown > newUp })
    try {
      const result = isProfessor
        ? await submitProfessorThreadFeedback(thread.thread_id, v)
        : await submitThreadFeedback(thread.thread_id, v)
      setFeedback(result)
    } catch {
      setMyFeedback(prev)
      setFeedback(thread.feedback)
    }
  }

  const toggleLabel = (label: string) => {
    const next = labels.includes(label) ? labels.filter((l) => l !== label) : [...labels, label]
    setLabels(next)
    setLabelsDirty(true)
  }

  const handleSaveLabels = async () => {
    setSavingLabels(true)
    try {
      await updateThreadReview(thread.thread_id, labels, notes || null)
      setLabelsDirty(false)
    } finally {
      setSavingLabels(false)
    }
  }

  const handleFork = async () => {
    if (!forkText.trim()) return
    setForking(true)
    try {
      await forkThread(thread.thread_id, forkText.trim())
      setForkOpen(false)
      setForkText('')
      onForkSuccess?.()
      navigate(`/sessions/${sessionId}/chat`)
    } finally {
      setForking(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`rounded-xl border overflow-hidden transition-colors ${
        needsAttention ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1 min-w-0 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg gradient-primary text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            {/* Title — inline edit for professors */}
            {editingTitle ? (
              <div className="flex items-center gap-1.5 mb-1">
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') titleMutation.mutate(titleDraft)
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                  className="flex-1 text-sm font-semibold border border-primary/40 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ background: '#ffffff' }}
                />
                <button onClick={() => titleMutation.mutate(titleDraft)} disabled={titleMutation.isPending} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditingTitle(false)} className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-sm font-semibold text-foreground leading-snug">
                {thread.title || thread.exchanges[0]?.answer?.slice(0, 80) || 'Shared thread'}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">{thread.student_display_name}</span>
              {thread.is_mine && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">You</span>
              )}
              {thread.forked_from && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitFork className="h-3 w-3" /> Forked
                </span>
              )}
              {thread.fork_count > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitFork className="h-3 w-3" /> {thread.fork_count} fork{thread.fork_count !== 1 ? 's' : ''}
                </span>
              )}
              <Badge variant="secondary" className="text-xs">
                <MessageSquare className="h-2.5 w-2.5 mr-1" />
                {thread.exchange_count} exchange{thread.exchange_count !== 1 ? 's' : ''}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(thread.shared_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            {/* Show applied labels for students */}
            {!isProfessor && labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {labels.slice(0, 3).map((lbl) => {
                  const def = LABELS.find((l) => l.label === lbl)
                  return def ? (
                    <span key={lbl} className="text-xs text-muted-foreground">{def.emoji} {def.label}</span>
                  ) : null
                })}
                {labels.length > 3 && <span className="text-xs text-muted-foreground">+{labels.length - 3} more</span>}
              </div>
            )}
          </div>
        </div>

        {/* Professor edit/delete buttons */}
        {isProfessor && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => { setTitleDraft(thread.title ?? ''); setEditingTitle(true) }}
              title="Edit title"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete this thread? This cannot be undone.`)) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
              title="Delete thread"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Vote buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => handleVote('up')} className="group/v flex items-center gap-1 text-xs tabular-nums transition-colors">
            <ThumbsUp className={`h-3.5 w-3.5 transition-all duration-150 group-hover/v:scale-110 ${
              myFeedback === 'up' ? 'text-emerald-500' : 'text-muted-foreground/50 group-hover/v:text-muted-foreground'
            }`} />
            {up > 0 && <span className={myFeedback === 'up' ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>{up}</span>}
          </button>
          <button onClick={() => handleVote('down')} className="group/v flex items-center gap-1 text-xs tabular-nums transition-colors">
            <ThumbsDown className={`h-3.5 w-3.5 transition-all duration-150 group-hover/v:scale-110 ${
              myFeedback === 'down' ? 'text-red-500' : 'text-muted-foreground/50 group-hover/v:text-muted-foreground'
            }`} />
            {down > 0 && <span className={myFeedback === 'down' ? 'text-red-600 font-medium' : 'text-muted-foreground'}>{down}</span>}
          </button>
        </div>

        {/* Fork button (students only) */}
        {!isProfessor && (
          <button
            onClick={(e) => { e.stopPropagation(); setForkOpen((v) => !v) }}
            title="Ask a follow-up"
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${
              forkOpen
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border-transparent'
            }`}
          >
            <GitFork className="h-3.5 w-3.5" />
            Fork
          </button>
        )}
      </div>

      {/* Fork form */}
      {forkOpen && !isProfessor && (
        <div className="px-4 pb-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground mt-3 mb-2">Ask a follow-up question based on this thread:</p>
          <textarea
            value={forkText}
            onChange={(e) => setForkText(e.target.value)}
            placeholder="Your follow-up question…"
            rows={2}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground" style={{ background: '#ffffff' }}
          />
          <div className="flex items-center gap-2 mt-2 justify-end">
            <button
              onClick={() => { setForkOpen(false); setForkText('') }}
              className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!forkText.trim() || forking}
              onClick={handleFork}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1"
            >
              <GitFork className="h-3 w-3" />
              {forking ? 'Forking…' : 'Fork & Ask'}
            </button>
          </div>
        </div>
      )}

      {/* Exchanges */}
      <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
        {thread.exchanges.map((ex, i) => (
          <div key={i} className="space-y-2">
            {ex.question && (
              <div className="flex justify-end">
                <div
                  className="max-w-[78%] rounded-2xl px-3 py-2.5 text-sm text-white"
                  style={{ background: 'linear-gradient(135deg,#272757,#505081)' }}
                >
                  {ex.question}
                </div>
              </div>
            )}
            {ex.answer && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-3 py-2.5 text-sm text-foreground" style={{ lineHeight: 1.7, background: '#ffffff', border: '1px solid rgba(134,134,172,0.15)' }}>
                  {renderAnswerWithCitations(ex.answer, ex.citations)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Professor labels + notes */}
      {isProfessor && (
        <div className="px-4 py-3 border-t border-border bg-muted/10">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {LABELS.map(({ emoji, label, color }) => {
              const active = labels.includes(label)
              return (
                <button
                  key={label}
                  onClick={() => toggleLabel(label)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                    active ? LABEL_COLOR_MAP[color] : LABEL_INACTIVE
                  }`}
                >
                  {emoji} {label}
                </button>
              )
            })}
          </div>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setLabelsDirty(true) }}
            placeholder="Add a note…"
            rows={2}
            className="w-full text-xs border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground mt-1" style={{ background: '#ffffff' }}
          />
          {labelsDirty && (
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setLabels(thread.professor_labels)
                  setNotes(thread.professor_notes ?? '')
                  setLabelsDirty(false)
                }}
                className="px-3 py-1 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLabels}
                disabled={savingLabels}
                className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {savingLabels ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <div className="px-4 pb-3">
        <CommentThread threadId={thread.thread_id} commentCount={thread.comment_count} />
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)
  const isProfessor = role === 'professor'

  const queryClient = useQueryClient()
  const reportQueryKey = ['session-report', sessionId, role] as const

  // ── Threads (primary data) ──
  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ['shared-threads', sessionId],
    queryFn: () => isProfessor
      ? getProfessorSharedThreads(sessionId!)
      : getSharedThreads(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 30_000,
  })

  // ── Questions (professor: unshared section; student: not shown) ──
  const { data: reportData } = useQuery({
    queryKey: reportQueryKey,
    queryFn: () => isProfessor
      ? getProfessorSessionReport(sessionId!)
      : getSessionReport(sessionId!),
    enabled: !!sessionId && isProfessor,
    refetchInterval: 60_000,
  })

  // ── Professor-only analytics ──
  const { data: studentActivity = [] } = useQuery({
    queryKey: ['student-activity', sessionId],
    queryFn: () => getStudentActivity(sessionId!),
    enabled: !!sessionId && isProfessor,
  })

  const { data: timeline = [] } = useQuery({
    queryKey: ['session-timeline', sessionId],
    queryFn: () => getSessionTimeline(sessionId!),
    enabled: !!sessionId && isProfessor,
  })

  // ── UI state ──
  const [showMineOnly, setShowMineOnly] = useState(false)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [activeThreadCategory, setActiveThreadCategory] = useState<string | null>(null)

  // ── Thread analytics ──
  const threadMetrics = useMemo(() => {
    if (threads.length === 0) return null
    const totalForks = threads.reduce((s, t) => s + t.fork_count, 0)
    const totalComments = threads.reduce((s, t) => s + t.comment_count, 0)
    const totalVotes = threads.reduce((s, t) => s + (t.feedback?.thumbs_up ?? 0) + (t.feedback?.thumbs_down ?? 0), 0)
    return { count: threads.length, totalForks, totalComments, totalVotes }
  }, [threads])

  const labelData = useMemo(() => LABELS.map(({ label }) => ({
    label,
    count: threads.filter((t) => t.professor_labels.includes(label)).length,
  })), [threads])

  const threadCategoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of threads) {
      for (const ex of t.exchanges) {
        if (ex.category) counts[ex.category] = (counts[ex.category] ?? 0) + 1
      }
    }
    return Object.entries(counts).map(([category, count]) => ({ category, count }))
  }, [threads])

  // ── Filtered threads ──
  const visibleThreads = useMemo(
    () => threads.filter((t) =>
      (showMineOnly ? t.is_mine : true) &&
      (activeLabel ? t.professor_labels.includes(activeLabel) : true) &&
      (activeThreadCategory ? t.exchanges.some((ex) => ex.category === activeThreadCategory) : true)
    ),
    [threads, showMineOnly, activeLabel, activeThreadCategory]
  )

  // ── Professor question section derived data ──
  const allQs = useMemo(() => reportData?.groups.flatMap((g) => g.questions) ?? [], [reportData])

  const metrics = useMemo(() => {
    if (!reportData) return null
    const totalVotes = allQs.reduce((s, q) => s + (q.feedback?.thumbs_up ?? 0) + (q.feedback?.thumbs_down ?? 0), 0)
    const questionsWithVotes = allQs.filter((q) => (q.feedback?.thumbs_up ?? 0) + (q.feedback?.thumbs_down ?? 0) > 0).length
    const engagementPct = allQs.length > 0 ? Math.round((questionsWithVotes / allQs.length) * 100) : 0
    const uniqueStudents = new Set(allQs.map((q) => q.anonymous_name)).size
    const totalForks = allQs.reduce((s, q) => s + (q.fork_count ?? 0), 0)
    return { totalQuestions: reportData.total_questions, uniqueStudents, totalVotes, engagementPct, totalForks }
  }, [reportData, allQs])

  // ── To-do card computations ──
  const todoCards = useMemo(() => {
    if (!isProfessor) return null

    // Card 1: Fix These Answers — questions where downs > ups AND total >= 2
    const flaggedAnswers = allQs.filter((q) => {
      const up = q.feedback?.thumbs_up ?? 0
      const down = q.feedback?.thumbs_down ?? 0
      return down > up && (up + down) >= 2
    })

    // Card 2: Revisit Next Class — category with most questions
    const catCounts: Record<string, number> = {}
    const catForks: Record<string, number> = {}
    for (const q of allQs) {
      const cat = q.category ?? 'Doubts'
      catCounts[cat] = (catCounts[cat] ?? 0) + 1
      catForks[cat] = (catForks[cat] ?? 0) + (q.fork_count ?? 0)
    }
    const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]

    // Card 3: Class Participation — how many enrolled students asked at least 1 question
    const totalEnrolled = studentActivity.length
    const activeStudents = studentActivity.filter((s) => s.question_count > 0).length

    // Card 4: Add Materials On — category with worst AI satisfaction (≥2 total votes)
    const catSatisfaction: Record<string, { ups: number; total: number }> = {}
    for (const q of allQs) {
      const cat = q.category ?? 'Doubts'
      const up = q.feedback?.thumbs_up ?? 0
      const down = q.feedback?.thumbs_down ?? 0
      const total = up + down
      if (total >= 2) {
        if (!catSatisfaction[cat]) catSatisfaction[cat] = { ups: 0, total: 0 }
        catSatisfaction[cat].ups += up
        catSatisfaction[cat].total += total
      }
    }
    const worstCategory = Object.entries(catSatisfaction)
      .map(([cat, { ups, total }]) => ({ cat, rate: ups / total, total }))
      .sort((a, b) => a.rate - b.rate)[0]

    const topCategoryForks = topCategory ? (catForks[topCategory[0]] ?? 0) : 0

    return { flaggedAnswers, topCategory, topCategoryForks, totalEnrolled, activeStudents, worstCategory }
  }, [isProfessor, allQs, studentActivity])

  const totalAttention = isProfessor
    ? reportData?.groups.reduce((sum, g) => sum + g.questions.filter((q) => effectiveNeedsAttention(q)).length, 0) ?? 0
    : 0

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Lecture
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">Class Dashboard</h1>
          {totalAttention > 0 && isProfessor && (
            <div className="flex items-center gap-1.5 text-sm text-destructive font-medium">
              <AlertTriangle className="h-4 w-4" />
              {totalAttention} need{totalAttention === 1 ? 's' : ''} attention
            </div>
          )}
        </div>
        <p className="text-muted-foreground mb-6">
          {isProfessor
            ? 'Shared threads from this lecture. Labels, notes, and comments help you prepare discussion.'
            : 'Threads shared by students in this session. Fork any thread to ask a follow-up.'}
        </p>

        {/* ── Professor to-do cards ── */}
        {isProfessor && todoCards && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {/* Card 1: Fix These Answers */}
            <div className={`rounded-xl border bg-card p-3.5 ${todoCards.flaggedAnswers.length > 0 ? 'border-red-200 bg-red-50/30' : 'border-border'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
                  <WrenchIcon className="h-3.5 w-3.5 text-red-600" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Fix These Answers</span>
              </div>
              <p className={`text-lg font-bold ${todoCards.flaggedAnswers.length > 0 ? 'text-red-600' : 'text-foreground'}`}>
                {todoCards.flaggedAnswers.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {todoCards.flaggedAnswers.length > 0 ? `flagged by students` : 'all answers well-rated'}
              </p>
            </div>

            {/* Card 2: Revisit Next Class */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/30 bg-card p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Revisit Next Class</span>
              </div>
              <p className="text-base font-bold text-foreground leading-tight">
                {todoCards.topCategory ? todoCards.topCategory[0] : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {todoCards.topCategory
                  ? `${todoCards.topCategory[1]} questions · ${todoCards.topCategoryForks} forks`
                  : 'no data yet'}
              </p>
            </div>

            {/* Card 3: Check In With */}
            <div className={`rounded-xl border bg-card p-3.5 ${todoCards.totalEnrolled > 0 && todoCards.activeStudents < todoCards.totalEnrolled ? 'border-sky-200 bg-sky-50/30' : 'border-border'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-sky-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-sky-600" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Class Participation</span>
              </div>
              <p className="text-lg font-bold text-foreground leading-tight">
                {todoCards.totalEnrolled > 0 ? `${todoCards.activeStudents} / ${todoCards.totalEnrolled}` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {todoCards.totalEnrolled === 0
                  ? 'no enrollment data yet'
                  : todoCards.activeStudents === todoCards.totalEnrolled
                  ? 'all students participated'
                  : `${todoCards.totalEnrolled - todoCards.activeStudents} didn't ask questions`}
              </p>
            </div>

            {/* Card 4: Add Materials On */}
            <div className={`rounded-xl border bg-card p-3.5 ${todoCards.worstCategory ? 'border-violet-200 bg-violet-50/30' : 'border-border'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <BookOpen className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Add Materials On</span>
              </div>
              <p className="text-base font-bold text-foreground leading-tight">
                {todoCards.worstCategory?.cat ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {todoCards.worstCategory
                  ? `${Math.round(todoCards.worstCategory.rate * 100)}% satisfaction · AI struggled`
                  : 'AI performed well'}
              </p>
            </div>
          </div>
        )}

        {/* ── Student thread metrics (non-professor) ── */}
        {!isProfessor && threadMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { icon: MessageSquare, label: 'Threads Shared', value: threadMetrics.count, color: 'text-primary', bg: 'bg-primary/10' },
              { icon: GitFork, label: 'Total Forks', value: threadMetrics.totalForks, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { icon: MessageSquareText, label: 'Total Comments', value: threadMetrics.totalComments, color: 'text-sky-500', bg: 'bg-sky-500/10' },
              { icon: ThumbsUp, label: 'Total Votes', value: threadMetrics.totalVotes, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-7 w-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Professor label chart ── */}
        {isProfessor && threads.length > 0 && labelData.some((d) => d.count > 0) && (
          <div className="rounded-xl border border-border bg-card p-4 mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Threads by Label</h3>
            <p className="text-xs text-muted-foreground mb-3">Click a bar to filter threads by label</p>
            <LabelBarChart
              data={labelData}
              activeLabel={activeLabel}
              onLabelClick={setActiveLabel}
            />
          </div>
        )}

        {/* ── Thread category chart + Material Coverage side by side ── */}
        {threads.length > 0 && sessionId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {threadCategoryData.length > 0 ? (
              <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
                <h3 className="text-sm font-semibold text-foreground mb-1">Threads by Category</h3>
                <p className="text-xs text-muted-foreground mb-3">Click a bar to filter</p>
                <div style={{ flex: 1, minHeight: 180, height: 0 }}>
                  <CategoryBarChart
                    data={threadCategoryData}
                    activeCategory={activeThreadCategory}
                    onCategoryClick={setActiveThreadCategory}
                    fillHeight
                  />
                </div>
              </div>
            ) : (
              <div />
            )}
            <div className="h-full"><CitationMapCard sessionId={sessionId} /></div>
          </div>
        )}

        {/* ── Professor analytics visualizations ── */}
        {isProfessor && (
          <>
            <StudentActivityTable data={studentActivity} />
            <QuestionTimeline data={timeline} />
            <AnswerQualityBreakdown questions={allQs} />
          </>
        )}

        {/* ── Professor: CTA to All Questions page ── */}
        {isProfessor && (
          <div className="mb-8">
            <button
              onClick={() => navigate(`/sessions/${sessionId}/questions`)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 border-border bg-card hover:border-primary/40 hover:bg-accent/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <MessageSquareText className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Review All Questions</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {metrics ? `${metrics.totalQuestions} questions · ${metrics.uniqueStudents} students` : 'View all session questions'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                {totalAttention > 0 && (
                  <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-medium">
                    {totalAttention} need attention
                  </span>
                )}
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        )}

        {/* ── Shared Threads section header ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Shared Threads</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isProfessor ? 'Threads students have shared with the class' : 'Threads shared in this session'}
            </p>
          </div>
          {!isProfessor && threads.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMineOnly}
                onChange={(e) => setShowMineOnly(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-muted-foreground">My threads only</span>
              {showMineOnly && (
                <span className="text-xs text-primary">
                  ({visibleThreads.length} of {threads.length})
                </span>
              )}
            </label>
          )}
        </div>

        {/* ── Thread list ── */}
        {threadsLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : visibleThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <MessageSquare className="h-10 w-10 opacity-20" />
            <p className="text-sm">
              {showMineOnly
                ? "You haven't shared any threads yet. Share from the Chat page!"
                : isProfessor
                  ? 'No threads shared yet. Students can share from the Chat page.'
                  : 'No shared threads yet. Be the first to share from Chat!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleThreads.map((t, i) => (
              <RichThreadCard
                key={t.thread_id}
                thread={t}
                index={i}
                isProfessor={isProfessor}
                onForkSuccess={() => queryClient.invalidateQueries({ queryKey: ['shared-threads', sessionId] })}
                onDeleted={() => queryClient.invalidateQueries({ queryKey: ['shared-threads', sessionId] })}
              />
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
