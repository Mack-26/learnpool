import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState, useMemo, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, MessageSquareText, Users, GitFork, TrendingUp,
  BookOpen, AlertTriangle, CheckCircle2, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  getProfessorSessionReport, updateQuestionReview, submitProfessorFeedback,
} from '../api/professor'
import DashboardLayout from '@/components/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import CategoryBarChart from '@/components/CategoryBarChart'
import CommentThread from '@/components/CommentThread'
import { renderAnswerWithCitations } from '@/components/AnswerRenderer'
import type { ReportQuestionOut, SessionReportResponse, TopicGroup } from '../types/api'

// ─── Shared constants ─────────────────────────────────────────────────────────

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

const CATEGORY_COLORS: Record<string, string> = {
  Homework:    'bg-violet-500 text-white',
  Doubts:      'bg-sky-500 text-white',
  Summaries:   'bg-teal-500 text-white',
  'Exam Prep': 'bg-orange-500 text-white',
}

function effectiveNeedsAttention(q: ReportQuestionOut): boolean {
  if (!q.feedback?.needs_attention) return false
  return !q.professor_labels?.includes(DISCUSSED_LABEL)
}

function applyOptimisticVote(
  old: SessionReportResponse,
  answerId: string,
  vote: 'up' | 'down',
): SessionReportResponse {
  return {
    ...old,
    groups: old.groups.map((g) => ({
      ...g,
      questions: g.questions.map((q) => {
        if (q.answer?.answer_id !== answerId) return q
        const prev = q.my_feedback
        const newVote = prev === vote ? null : vote
        let up = q.feedback?.thumbs_up ?? 0
        let down = q.feedback?.thumbs_down ?? 0
        if (prev === 'up') up = Math.max(0, up - 1)
        if (prev === 'down') down = Math.max(0, down - 1)
        if (newVote === 'up') up += 1
        if (newVote === 'down') down += 1
        return { ...q, my_feedback: newVote, feedback: { thumbs_up: up, thumbs_down: down, needs_attention: down > up } }
      }),
    })),
  }
}

function applyOptimisticDiscussed(
  old: SessionReportResponse,
  questionId: string,
  labels: string[],
): SessionReportResponse {
  return {
    ...old,
    groups: old.groups.map((g) => ({
      ...g,
      questions: g.questions.map((q) =>
        q.question_id === questionId ? { ...q, professor_labels: labels } : q
      ),
    })),
  }
}

// ─── Question Item ─────────────────────────────────────────────────────────────

function QuestionItem({
  item,
  index,
  onVote,
  onMarkDiscussed,
  queryKey,
}: {
  item: ReportQuestionOut
  index: number
  onVote: (answerId: string, val: 'up' | 'down') => void
  onMarkDiscussed: (item: ReportQuestionOut, labels: string[]) => void
  queryKey: readonly [string, string | undefined]
}) {
  const queryClient = useQueryClient()
  const { answer, feedback } = item
  const needsAttention = effectiveNeedsAttention(item)
  const isDiscussed = item.professor_labels?.includes(DISCUSSED_LABEL)
  const up = feedback?.thumbs_up ?? 0
  const down = feedback?.thumbs_down ?? 0

  const [localLabels, setLocalLabels] = useState<string[]>(item.professor_labels ?? [])
  const [localNotes, setLocalNotes] = useState<string>(item.professor_notes ?? '')
  const [isDirty, setIsDirty] = useState(false)
  const [showCitations, setShowCitations] = useState(false)
  const [showReview, setShowReview] = useState(false)

  const reviewMutation = useMutation({
    mutationFn: ({ labels, notes }: { labels: string[]; notes: string | null }) =>
      updateQuestionReview(item.question_id, labels, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKey] })
      setIsDirty(false)
    },
  })

  const toggleLabel = (label: string) => {
    const next = localLabels.includes(label)
      ? localLabels.filter((l) => l !== label)
      : [...localLabels, label]
    setLocalLabels(next)
    setIsDirty(true)
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        needsAttention ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0 flex items-start gap-3">
          <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            needsAttention ? 'bg-destructive text-white' : 'gradient-primary text-white'
          }`}>
            <span className="text-xs font-bold">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-xs text-muted-foreground">{item.anonymous_name}</p>
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(item.asked_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {' · '}
                {new Date(item.asked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">{item.content}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {item.category && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? 'bg-muted text-muted-foreground'}`}>
                  {item.category}
                </span>
              )}
              {answer && (
                <Badge variant="secondary" className="text-xs">
                  {answer.citations.length} citation{answer.citations.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {!answer && <Badge variant="outline" className="text-xs text-muted-foreground">No answer yet</Badge>}
              {needsAttention && (
                <Badge className="text-xs bg-destructive/15 text-destructive border-0 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Needs discussion
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              const current = item.professor_labels ?? []
              const next = current.includes(DISCUSSED_LABEL)
                ? current.filter((l) => l !== DISCUSSED_LABEL)
                : [...current, DISCUSSED_LABEL]
              onMarkDiscussed(item, next)
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
              isDiscussed
                ? 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/40'
                : 'bg-muted/50 text-muted-foreground hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 border border-transparent'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Discussed
          </button>

          {answer && (
            <div className="flex items-center gap-2 select-none">
              <button onClick={() => onVote(answer.answer_id, 'up')} className="group/vote flex items-center gap-1 text-xs tabular-nums transition-colors">
                <ThumbsUp className={`h-3.5 w-3.5 transition-all duration-150 group-hover/vote:scale-110 ${
                  item.my_feedback === 'up' ? 'text-emerald-500' : 'text-muted-foreground/50 group-hover/vote:text-muted-foreground'
                }`} />
                {up > 0 && <span className={item.my_feedback === 'up' ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>{up}</span>}
              </button>
              <button onClick={() => onVote(answer.answer_id, 'down')} className="group/vote flex items-center gap-1 text-xs tabular-nums transition-colors">
                <ThumbsDown className={`h-3.5 w-3.5 transition-all duration-150 group-hover/vote:scale-110 ${
                  item.my_feedback === 'down' ? 'text-red-500' : 'text-muted-foreground/50 group-hover/vote:text-muted-foreground'
                }`} />
                {down > 0 && <span className={item.my_feedback === 'down' ? 'text-red-600 font-medium' : 'text-muted-foreground'}>{down}</span>}
              </button>
            </div>
          )}

          <button
            onClick={() => setShowReview((v) => !v)}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            title="Review / label"
          >
            {showReview ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Answer */}
      {answer && (
        <div className="px-4 pb-4 pt-0 border-t border-border bg-card">
          <div className="pl-9 pt-3">
            <div className="text-sm text-foreground mb-3 prose prose-sm max-w-none">{renderAnswerWithCitations(answer.content, answer.citations)}</div>
            {answer.citations.length > 0 && (
              <div className="space-y-1.5">
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
                      <div key={c.chunk_id} className="text-xs bg-background rounded-lg px-3 py-2 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary">[{c.citation_order}]</span>
                          {c.page_number && <span className="text-muted-foreground">Page {c.page_number}</span>}
                          <span className="ml-auto text-muted-foreground">{Math.round(c.relevance_score * 100)}% match</span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review panel */}
      {showReview && (
        <div className="px-4 py-3 border-t border-border bg-muted/10 space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Labels</p>
            <div className="flex flex-wrap gap-1.5">
              {LABELS.map(({ emoji, label, color }) => {
                const active = localLabels.includes(label)
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
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</p>
            <textarea
              value={localNotes}
              onChange={(e) => { setLocalNotes(e.target.value); setIsDirty(true) }}
              placeholder="Add a note…"
              rows={2}
              className="w-full text-xs border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              style={{ background: '#ffffff' }}
            />
          </div>
          {isDirty && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setLocalLabels(item.professor_labels ?? [])
                  setLocalNotes(item.professor_notes ?? '')
                  setIsDirty(false)
                }}
                className="px-3 py-1 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => reviewMutation.mutate({ labels: localLabels, notes: localNotes || null })}
                disabled={reviewMutation.isPending}
                className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {reviewMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <div className="px-4 pb-3">
        <CommentThread questionId={item.question_id} commentCount={item.comment_count} />
      </div>
    </div>
  )
}

// ─── Topic Group (list mode) ───────────────────────────────────────────────────

function TopicGroupCard({
  group,
  groupIndex,
  onVote,
  onMarkDiscussed,
  queryKey,
}: {
  group: TopicGroup
  groupIndex: number
  onVote: (answerId: string, val: 'up' | 'down') => void
  onMarkDiscussed: (item: ReportQuestionOut, labels: string[]) => void
  queryKey: readonly [string, string | undefined]
}) {
  const [expanded, setExpanded] = useState(true)
  const attentionCount = group.questions.filter((q) => effectiveNeedsAttention(q)).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: groupIndex * 0.08, duration: 0.3 }}
      className="rounded-xl border border-border bg-background overflow-hidden"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
      >
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{groupIndex + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{group.topic_name}</p>
          {group.summary && <p className="text-xs text-muted-foreground mt-0.5 italic">{group.summary}</p>}
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {group.student_count} student{group.student_count !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-muted-foreground">{group.question_count} question{group.question_count !== 1 ? 's' : ''}</span>
            {attentionCount > 0 && (
              <Badge className="text-xs bg-destructive/15 text-destructive border-0 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {attentionCount} need{attentionCount === 1 ? 's' : ''} discussion
              </Badge>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border bg-muted/20">
          <div className="pt-3 space-y-2">
            {group.questions.map((item, i) => (
              <QuestionItem
                key={item.question_id}
                item={item}
                index={i}
                onVote={onVote}
                onMarkDiscussed={onMarkDiscussed}
                queryKey={queryKey}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Review Card ───────────────────────────────────────────────────────────────

function ReviewCard({
  item,
  queryKey,
}: {
  item: ReportQuestionOut
  queryKey: readonly [string, string | undefined]
}) {
  const queryClient = useQueryClient()
  const [localLabels, setLocalLabels] = useState<string[]>(item.professor_labels ?? [])
  const [localNotes, setLocalNotes] = useState<string>(item.professor_notes ?? '')
  const [savedLabels] = useState<string[]>(item.professor_labels ?? [])
  const [savedNotes] = useState<string>(item.professor_notes ?? '')
  const [isDirty, setIsDirty] = useState(false)
  const [showCitations, setShowCitations] = useState(false)

  const reviewMutation = useMutation({
    mutationFn: ({ labels, notes }: { labels: string[]; notes: string | null }) =>
      updateQuestionReview(item.question_id, labels, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKey] })
      setIsDirty(false)
    },
  })

  const toggleLabel = (label: string) => {
    const next = localLabels.includes(label)
      ? localLabels.filter((l) => l !== label)
      : [...localLabels, label]
    setLocalLabels(next)
    setIsDirty(true)
  }

  const { answer } = item

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">{item.anonymous_name}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {new Date(item.asked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {item.category && (
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? 'bg-muted text-muted-foreground'}`}>
              {item.category}
            </span>
          )}
        </div>
        <p className="text-lg font-semibold text-foreground">{item.content}</p>
      </div>

      <div className="px-5 py-4 border-b border-border max-h-64 overflow-y-auto">
        {answer ? (
          <>
            <div className="text-sm text-foreground prose prose-sm max-w-none">{renderAnswerWithCitations(answer.content, answer.citations)}</div>
            {answer.citations.length > 0 && (
              <div className="mt-3">
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
                      <div key={c.chunk_id} className="text-xs bg-muted rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary">[{c.citation_order}]</span>
                          {c.page_number && <span className="text-muted-foreground">Page {c.page_number}</span>}
                          <span className="ml-auto text-muted-foreground">{Math.round(c.relevance_score * 100)}% match</span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic">No answer yet.</p>
        )}
      </div>

      <div className="px-5 py-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Labels</p>
        <div className="flex flex-wrap gap-2">
          {LABELS.map(({ emoji, label, color }) => {
            const active = localLabels.includes(label)
            return (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                  active ? LABEL_COLOR_MAP[color] : LABEL_INACTIVE
                }`}
              >
                <span>{emoji}</span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-5 py-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
        <textarea
          value={localNotes}
          onChange={(e) => { setLocalNotes(e.target.value); setIsDirty(true) }}
          placeholder="Add a note…"
          rows={3}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          style={{ background: '#ffffff' }}
        />
      </div>

      <div className="px-5 py-3 flex items-center justify-end gap-2">
        {reviewMutation.isPending && <span className="text-xs text-muted-foreground mr-auto">Saving…</span>}
        {!reviewMutation.isPending && isDirty && <span className="text-xs text-amber-600 mr-auto">Unsaved changes</span>}
        <button
          onClick={() => { setLocalLabels(savedLabels); setLocalNotes(savedNotes); setIsDirty(false) }}
          disabled={!isDirty || reviewMutation.isPending}
          className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => reviewMutation.mutate({ labels: localLabels, notes: localNotes || null })}
          disabled={!isDirty || reviewMutation.isPending}
          className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Save
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AllQuestionsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const reportQueryKey = ['all-questions-report', sessionId] as const

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: reportQueryKey,
    queryFn: () => getProfessorSessionReport(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 60_000,
  })

  // ── UI state ──
  const [viewMode, setViewMode] = useState<'list' | 'review'>('list')
  const [reviewIndex, setReviewIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // ── Derived data ──
  const allQs = useMemo(() => reportData?.groups.flatMap((g) => g.questions) ?? [], [reportData])

  const metrics = useMemo(() => {
    if (!reportData) return null
    const questionsWithVotes = allQs.filter((q) => (q.feedback?.thumbs_up ?? 0) + (q.feedback?.thumbs_down ?? 0) > 0).length
    const engagementPct = allQs.length > 0 ? Math.round((questionsWithVotes / allQs.length) * 100) : 0
    const uniqueStudents = new Set(allQs.map((q) => q.anonymous_name)).size
    const totalForks = allQs.reduce((s, q) => s + (q.fork_count ?? 0), 0)
    return { totalQuestions: reportData.total_questions, uniqueStudents, totalForks, engagementPct }
  }, [reportData, allQs])

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const q of allQs) {
      if (q.category) counts[q.category] = (counts[q.category] ?? 0) + 1
    }
    return Object.entries(counts).map(([category, count]) => ({ category, count }))
  }, [allQs])

  const filteredGroups = useMemo(() => {
    if (!activeCategory || !reportData) return reportData?.groups ?? []
    return reportData.groups
      .map((g) => ({ ...g, questions: g.questions.filter((q) => q.category === activeCategory) }))
      .filter((g) => g.questions.length > 0)
  }, [reportData, activeCategory])

  const totalAttention = reportData?.groups.reduce(
    (sum, g) => sum + g.questions.filter((q) => effectiveNeedsAttention(q)).length, 0
  ) ?? 0

  const allQuestions = useMemo(() => reportData?.groups.flatMap((g) => g.questions) ?? [], [reportData])
  const safeReviewIndex = Math.min(reviewIndex, Math.max(0, allQuestions.length - 1))
  const currentQuestion = allQuestions[safeReviewIndex]

  // ── Mutations ──
  const voteMutation = useMutation({
    mutationFn: ({ answerId, vote }: { answerId: string; vote: 'up' | 'down' }) =>
      submitProfessorFeedback(answerId, vote),
    onMutate: async ({ answerId, vote }) => {
      const previous = queryClient.getQueryData<SessionReportResponse>(reportQueryKey)
      if (previous) queryClient.setQueryData(reportQueryKey, applyOptimisticVote(previous, answerId, vote))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(reportQueryKey, context.previous)
    },
  })
  const handleVote = useCallback(
    (answerId: string, vote: 'up' | 'down') => voteMutation.mutate({ answerId, vote }),
    [voteMutation]
  )

  const markDiscussedMutation = useMutation({
    mutationFn: ({ questionId, labels, notes }: { questionId: string; labels: string[]; notes: string | null }) =>
      updateQuestionReview(questionId, labels, notes),
    onMutate: async ({ questionId, labels }) => {
      const previous = queryClient.getQueryData<SessionReportResponse>(reportQueryKey)
      if (previous) queryClient.setQueryData(reportQueryKey, applyOptimisticDiscussed(previous, questionId, labels))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(reportQueryKey, context.previous)
    },
  })
  const handleMarkDiscussed = useCallback(
    (item: ReportQuestionOut, labels: string[]) => {
      markDiscussedMutation.mutate({ questionId: item.question_id, labels, notes: item.professor_notes ?? null })
    },
    [markDiscussedMutation]
  )

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">All Session Questions</h1>
          {totalAttention > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-destructive font-medium">
              <AlertTriangle className="h-4 w-4" />
              {totalAttention} need{totalAttention === 1 ? 's' : ''} attention
            </div>
          )}
        </div>
        <p className="text-muted-foreground mb-6">
          Review, label, and discuss every question asked in this session.
        </p>

        {/* ── Metrics ── */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { icon: MessageSquareText, label: 'Questions', value: metrics.totalQuestions, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { icon: Users, label: 'Students', value: metrics.uniqueStudents, color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { icon: GitFork, label: 'Total Forks', value: metrics.totalForks, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { icon: TrendingUp, label: 'Engagement', value: `${metrics.engagementPct}%`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
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

        {/* ── Category chart + view toggle ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground font-medium' : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('review')}
              className={`px-3 py-1.5 transition-colors ${
                viewMode === 'review' ? 'bg-primary text-primary-foreground font-medium' : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              Review
            </button>
          </div>
          {allQs.length > 0 && viewMode === 'list' && (
            <span className="text-xs text-muted-foreground">
              {allQs.length} question{allQs.length !== 1 ? 's' : ''}
              {activeCategory && ` · filtered by "${activeCategory}"`}
            </span>
          )}
        </div>

        {/* Category chart (list mode only) */}
        {allQs.length > 0 && viewMode === 'list' && categoryData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Questions by Category</h3>
            <p className="text-xs text-muted-foreground mb-3">Click a bar to filter</p>
            <CategoryBarChart
              data={categoryData}
              activeCategory={activeCategory}
              onCategoryClick={setActiveCategory}
            />
          </div>
        )}

        {/* ── Loading / empty ── */}
        {reportLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
          </div>
        )}
        {!reportLoading && (reportData?.total_questions ?? 0) === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Users className="h-10 w-10 opacity-20" />
            <p className="text-sm">No questions in this session yet.</p>
          </div>
        )}

        {/* ── List view ── */}
        {!reportLoading && viewMode === 'list' && (
          <div className="space-y-4">
            {[...filteredGroups]
              .sort((a, b) => {
                const aNeed = a.questions.filter((q) => effectiveNeedsAttention(q)).length
                const bNeed = b.questions.filter((q) => effectiveNeedsAttention(q)).length
                if (bNeed !== aNeed) return bNeed - aNeed
                return b.question_count - a.question_count
              })
              .map((group, i) => (
                <TopicGroupCard
                  key={group.topic_name}
                  group={group}
                  groupIndex={i}
                  onVote={handleVote}
                  onMarkDiscussed={handleMarkDiscussed}
                  queryKey={reportQueryKey}
                />
              ))}
            {activeCategory && filteredGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <p className="text-sm">No questions in category "{activeCategory}".</p>
                <button onClick={() => setActiveCategory(null)} className="text-xs text-primary hover:underline">
                  Clear filter
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Review view ── */}
        {!reportLoading && viewMode === 'review' && (
          <div className="space-y-4">
            {allQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <Users className="h-8 w-8 opacity-20" />
                <p className="text-sm">No questions to review.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{safeReviewIndex + 1} of {allQuestions.length}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
                      disabled={safeReviewIndex === 0}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setReviewIndex((i) => Math.min(allQuestions.length - 1, i + 1))}
                      disabled={safeReviewIndex === allQuestions.length - 1}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {currentQuestion && (
                  <ReviewCard
                    key={currentQuestion.question_id}
                    item={currentQuestion}
                    queryKey={reportQueryKey}
                  />
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
