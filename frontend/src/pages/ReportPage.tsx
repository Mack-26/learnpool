import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen, ChevronDown, ChevronUp, Users, AlertTriangle, ThumbsUp, ThumbsDown,
  MessageSquareText, TrendingUp, ChevronLeft, ChevronRight,
  GitFork, CheckCircle2,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { getSessionReport, submitFeedback, forkQuestion } from '../api/sessions'
import { getProfessorSessionReport, updateQuestionReview, submitProfessorFeedback } from '../api/professor'
import { useAuthStore } from '../store/authStore'
import type { ReportQuestionOut, SessionReportResponse, TopicGroup } from '../types/api'
import DashboardLayout from '@/components/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import CategoryBarChart from '@/components/CategoryBarChart'
import CommentThread from '@/components/CommentThread'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Label definitions ────────────────────────────────────────────────────────
const DISCUSSED_LABEL = 'Discussed in class'

const LABELS = [
  { emoji: '✓', label: DISCUSSED_LABEL, color: 'green' },
  { emoji: '⚡', label: 'Interesting Question', color: 'blue' },
  { emoji: '🎯', label: 'Good Analogy',         color: 'green' },
  { emoji: '❌', label: 'Wrong Answer',          color: 'red' },
  { emoji: '⚠️', label: 'Misleading',           color: 'yellow' },
  { emoji: '🧠', label: 'Deep Understanding',   color: 'purple' },
  { emoji: '📄', label: 'Surface Level',        color: 'gray' },
  { emoji: '🔄', label: 'Needs Follow-up',      color: 'orange' },
] as const

const LABEL_COLOR_MAP: Record<string, string> = {
  blue:   'bg-amber-500 text-white border-amber-500',
  green:  'bg-emerald-500 text-white border-emerald-500',
  red:    'bg-red-500 text-white border-red-500',
  yellow: 'bg-yellow-400 text-yellow-900 border-yellow-400',
  purple: 'bg-violet-500 text-white border-violet-500',
  gray:   'bg-slate-400 text-white border-slate-400',
  orange: 'bg-orange-500 text-white border-orange-500',
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

// ─── Single Q&A card ──────────────────────────────────────────────────────────
function ReportItem({
  item,
  index,
  onVote,
  isProfessor,
  onMarkDiscussed,
  onFork,
}: {
  item: ReportQuestionOut
  index: number
  onVote: (answerId: string, val: 'up' | 'down') => void
  isProfessor?: boolean
  onMarkDiscussed?: (item: ReportQuestionOut, labels: string[]) => void
  onFork?: (questionId: string, content: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [forkOpen, setForkOpen] = useState(false)
  const [forkText, setForkText] = useState('')
  const [forking, setForking] = useState(false)
  const { answer, feedback } = item
  const needsAttention = isProfessor && effectiveNeedsAttention(item)
  const isDiscussed = item.professor_labels?.includes(DISCUSSED_LABEL)
  const up = feedback?.thumbs_up ?? 0
  const down = feedback?.thumbs_down ?? 0

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        needsAttention ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 min-w-0 text-left flex items-start gap-3"
        >
          <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            needsAttention ? 'bg-destructive text-white' : 'gradient-primary text-white'
          }`}>
            <span className="text-xs font-bold">{index + 1}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">{item.anonymous_name}</p>
            <p className="text-sm font-medium text-foreground">{item.content}</p>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs text-muted-foreground">
                {new Date(item.asked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {item.category && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? 'bg-muted text-muted-foreground'}`}>
                  {item.category}
                </span>
              )}
              {item.forked_from && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitFork className="h-3 w-3" /> Forked
                </span>
              )}
              {item.fork_count > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitFork className="h-3 w-3" /> {item.fork_count} fork{item.fork_count !== 1 ? 's' : ''}
                </span>
              )}
              {answer && (
                <Badge variant="secondary" className="text-xs">
                  {answer.citations.length} citation{answer.citations.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {!answer && (
                <Badge variant="outline" className="text-xs text-muted-foreground">No answer yet</Badge>
              )}
              {needsAttention && (
                <Badge className="text-xs bg-destructive/15 text-destructive border-0 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Needs discussion
                </Badge>
              )}
              {item.professor_labels && item.professor_labels.filter((l) => l !== DISCUSSED_LABEL).length > 0 && (
                <>
                  {item.professor_labels.filter((l) => l !== DISCUSSED_LABEL).slice(0, 2).map((lbl) => {
                    const def = LABELS.find((l) => l.label === lbl)
                    return def ? <span key={lbl} className="text-xs">{def.emoji} {def.label}</span> : null
                  })}
                  {item.professor_labels.filter((l) => l !== DISCUSSED_LABEL).length > 2 && (
                    <span className="text-xs text-muted-foreground">+{item.professor_labels.filter((l) => l !== DISCUSSED_LABEL).length - 2} more</span>
                  )}
                </>
              )}
            </div>
          </div>

          {answer && (
            open
              ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          )}
        </button>

        {/* Professor: Mark discussed */}
        {isProfessor && onMarkDiscussed && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const current = item.professor_labels ?? []
              const next = current.includes(DISCUSSED_LABEL)
                ? current.filter((l) => l !== DISCUSSED_LABEL)
                : [...current, DISCUSSED_LABEL]
              onMarkDiscussed(item, next)
            }}
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
              isDiscussed
                ? 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/40'
                : 'bg-muted/50 text-muted-foreground hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 border border-transparent'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Discussed
          </button>
        )}

        {/* Vote buttons */}
        {answer && (
          <div className="flex items-center gap-3 shrink-0 ml-1 select-none">
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

        {/* Fork button (students only) */}
        {!isProfessor && answer && onFork && (
          <button
            onClick={(e) => { e.stopPropagation(); setForkOpen((v) => !v) }}
            title="Ask a follow-up question"
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
          <p className="text-xs text-muted-foreground mt-3 mb-2">Ask a follow-up question based on this answer:</p>
          <textarea
            value={forkText}
            onChange={(e) => setForkText(e.target.value)}
            placeholder="Your follow-up question…"
            rows={2}
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
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
              onClick={async () => {
                if (!forkText.trim() || !onFork) return
                setForking(true)
                try {
                  await onFork(item.question_id, forkText.trim())
                } finally {
                  setForking(false)
                  setForkOpen(false)
                  setForkText('')
                }
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1"
            >
              <GitFork className="h-3 w-3" />
              {forking ? 'Forking…' : 'Fork & Ask'}
            </button>
          </div>
        </div>
      )}

      {/* Answer body */}
      {open && answer && (
        <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/30">
          <div className="pl-9 pt-3">
            <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{answer.content}</p>
            {answer.citations.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Sources
                </p>
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
        </div>
      )}

      {/* Comment thread */}
      <div className="px-4 pb-3">
        <CommentThread questionId={item.question_id} commentCount={item.comment_count} />
      </div>
    </div>
  )
}

// ─── Topic group card ─────────────────────────────────────────────────────────
function TopicGroupCard({
  group,
  groupIndex,
  onVote,
  isProfessor,
  onMarkDiscussed,
  onFork,
}: {
  group: TopicGroup
  groupIndex: number
  onVote: (answerId: string, val: 'up' | 'down') => void
  isProfessor?: boolean
  onMarkDiscussed?: (item: ReportQuestionOut, labels: string[]) => void
  onFork?: (questionId: string, content: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(true)
  const attentionCount = isProfessor ? group.questions.filter((q) => effectiveNeedsAttention(q)).length : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: groupIndex * 0.1, duration: 0.35 }}
      className="rounded-xl border-2 border-border bg-background overflow-hidden"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
      >
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{groupIndex + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-foreground">{group.topic_name}</p>
          </div>
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
              <ReportItem
                key={item.question_id}
                item={item}
                index={i}
                onVote={onVote}
                isProfessor={isProfessor}
                onMarkDiscussed={onMarkDiscussed}
                onFork={onFork}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Review Card (professor review mode with Save/Cancel) ─────────────────────
function ReviewCard({
  item,
  queryKey,
}: {
  item: ReportQuestionOut
  queryKey: readonly [string, string | undefined, string | undefined]
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

  const handleSave = () => {
    reviewMutation.mutate({ labels: localLabels, notes: localNotes || null })
  }

  const handleCancel = () => {
    setLocalLabels(savedLabels)
    setLocalNotes(savedNotes)
    setIsDirty(false)
  }

  const { answer } = item

  return (
    <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
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

      <div className="px-5 py-4 border-b border-border max-h-60 overflow-y-auto">
        {answer ? (
          <>
            <p className="text-sm text-foreground whitespace-pre-wrap">{answer.content}</p>
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
          className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Save / Cancel */}
      <div className="px-5 py-3 flex items-center justify-end gap-2">
        {reviewMutation.isPending && <span className="text-xs text-muted-foreground mr-auto">Saving…</span>}
        {!reviewMutation.isPending && isDirty && <span className="text-xs text-amber-600 mr-auto">Unsaved changes</span>}
        <button
          onClick={handleCancel}
          disabled={!isDirty || reviewMutation.isPending}
          className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
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
export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)

  const queryClient = useQueryClient()
  const queryKey = ['session-report', sessionId, role] as const

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      role === 'professor'
        ? getProfessorSessionReport(sessionId!)
        : getSessionReport(sessionId!),
    enabled: !!sessionId,
    refetchInterval: role === 'professor' ? 60_000 : false,
  })

  const [viewMode, setViewMode] = useState<'list' | 'review'>('list')
  const [reviewIndex, setReviewIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const voteMutation = useMutation({
    mutationFn: ({ answerId, vote }: { answerId: string; vote: 'up' | 'down' }) =>
      role === 'professor'
        ? submitProfessorFeedback(answerId, vote)
        : submitFeedback(answerId, vote),
    onMutate: async ({ answerId, vote }) => {
      const previous = queryClient.getQueryData<SessionReportResponse>(queryKey)
      if (previous) queryClient.setQueryData(queryKey, applyOptimisticVote(previous, answerId, vote))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
  })
  const handleVote = useCallback(
    (answerId: string, vote: 'up' | 'down') => voteMutation.mutate({ answerId, vote }),
    [voteMutation]
  )

  // ── Derived data ──
  const allQs = useMemo(() => data?.groups.flatMap((g) => g.questions) ?? [], [data])

  const metrics = useMemo(() => {
    if (!data) return null
    const totalVotes = allQs.reduce((s, q) => s + (q.feedback?.thumbs_up ?? 0) + (q.feedback?.thumbs_down ?? 0), 0)
    const questionsWithVotes = allQs.filter((q) => (q.feedback?.thumbs_up ?? 0) + (q.feedback?.thumbs_down ?? 0) > 0).length
    const engagementPct = allQs.length > 0 ? Math.round((questionsWithVotes / allQs.length) * 100) : 0
    const uniqueStudents = new Set(allQs.map((q) => q.anonymous_name)).size

    const studentQCounts = Object.values(
      allQs.reduce((acc, q) => {
        const name = q.anonymous_name
        acc[name] = (acc[name] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).sort((a, b) => a - b)
    const mid = Math.floor(studentQCounts.length / 2)
    const median = studentQCounts.length === 0
      ? 0
      : studentQCounts.length % 2 !== 0
        ? studentQCounts[mid]
        : (studentQCounts[mid - 1] + studentQCounts[mid]) / 2

    const totalForks = allQs.reduce((s, q) => s + (q.fork_count ?? 0), 0)

    return {
      totalQuestions: data.total_questions,
      uniqueStudents,
      totalVotes,
      engagementPct,
      medianQuestionsPerStudent: Math.round(median * 10) / 10,
      totalForks,
    }
  }, [data, allQs])

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const q of allQs) {
      if (q.category) counts[q.category] = (counts[q.category] ?? 0) + 1
    }
    return Object.entries(counts).map(([category, count]) => ({ category, count }))
  }, [allQs])

  const filteredGroups = useMemo(() => {
    if (!activeCategory || !data) return data?.groups ?? []
    return data.groups.map((g) => ({
      ...g,
      questions: g.questions.filter((q) => q.category === activeCategory),
    })).filter((g) => g.questions.length > 0)
  }, [data, activeCategory])

  const totalAttention = role === 'professor'
    ? data?.groups.reduce((sum, g) => sum + g.questions.filter((q) => effectiveNeedsAttention(q)).length, 0) ?? 0
    : 0

  const markDiscussedMutation = useMutation({
    mutationFn: ({ questionId, labels, notes }: { questionId: string; labels: string[]; notes: string | null }) =>
      updateQuestionReview(questionId, labels, notes),
    onMutate: async ({ questionId, labels }) => {
      const previous = queryClient.getQueryData<SessionReportResponse>(queryKey)
      if (previous) queryClient.setQueryData(queryKey, applyOptimisticDiscussed(previous, questionId, labels))
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
  })
  const handleMarkDiscussed = useCallback(
    (item: ReportQuestionOut, labels: string[]) => {
      markDiscussedMutation.mutate({ questionId: item.question_id, labels, notes: item.professor_notes ?? null })
    },
    [markDiscussedMutation]
  )

  const handleFork = useCallback(
    async (questionId: string, content: string) => {
      await forkQuestion(questionId, content)
      // navigate to the session chat so student sees the forked Q&A
      navigate(`/sessions/${sessionId}/chat`)
    },
    [navigate, sessionId]
  )

  const allQuestions = useMemo(() => data?.groups.flatMap((g) => g.questions) ?? [], [data])
  const safeReviewIndex = Math.min(reviewIndex, Math.max(0, allQuestions.length - 1))
  const currentQuestion = allQuestions[safeReviewIndex]

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl"
      >
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Lecture
        </button>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">Class Questions</h1>
          <div className="flex items-center gap-3">
            {totalAttention > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-destructive font-medium">
                <AlertTriangle className="h-4 w-4" />
                {totalAttention} need{totalAttention === 1 ? 's' : ''} attention
              </div>
            )}
            {role === 'professor' && (
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
            )}
          </div>
        </div>
        <p className="text-muted-foreground mb-5">
          All questions from this lecture, grouped by topic — identities are anonymous.
          {role !== 'professor' && ' Vote on answers to help the professor prioritise discussion topics.'}
        </p>

        {/* ── Metrics row ── */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { icon: MessageSquareText, label: 'Questions', value: metrics.totalQuestions, color: 'text-amber-500', bg: 'bg-amber-500/10', subtitle: undefined },
              { icon: Users, label: 'Median Q / Student', value: metrics.medianQuestionsPerStudent, subtitle: `${metrics.uniqueStudents} student${metrics.uniqueStudents !== 1 ? 's' : ''}`, color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { icon: GitFork, label: 'Total Forks', value: metrics.totalForks, color: 'text-amber-500', bg: 'bg-amber-500/10', subtitle: undefined },
              { icon: TrendingUp, label: 'Engagement', value: `${metrics.engagementPct}%`, subtitle: `${metrics.totalVotes} vote${metrics.totalVotes !== 1 ? 's' : ''}`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="rounded-xl border border-border bg-card p-3.5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-7 w-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground leading-tight">{stat.value}</p>
                {stat.subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{stat.subtitle}</p>}
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Category Bar Chart ── */}
        {allQs.length > 0 && viewMode === 'list' && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">Questions by Category</h3>
            <p className="text-xs text-muted-foreground mb-3">Click a bar to filter the question list below</p>
            <CategoryBarChart
              data={categoryData}
              activeCategory={activeCategory}
              onCategoryClick={setActiveCategory}
            />
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
            <p className="text-xs text-center text-muted-foreground mt-2">Grouping questions by topic…</p>
          </div>
        )}
        {error && <p className="text-destructive text-sm">Failed to load report.</p>}
        {!isLoading && data?.total_questions === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Users className="h-10 w-10 opacity-20" />
            <p className="text-sm">No questions in this session yet.</p>
          </div>
        )}

        {/* ── List view ── */}
        {viewMode === 'list' && (
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
                  isProfessor={role === 'professor'}
                  onMarkDiscussed={role === 'professor' ? handleMarkDiscussed : undefined}
                  onFork={role !== 'professor' ? handleFork : undefined}
                />
              ))}
            {activeCategory && filteredGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <p className="text-sm">No questions in category "{activeCategory}".</p>
                <button onClick={() => setActiveCategory(null)} className="text-xs text-primary hover:underline">Clear filter</button>
              </div>
            )}
          </div>
        )}

        {/* ── Review view (professor only) ── */}
        {viewMode === 'review' && role === 'professor' && (
          <div className="space-y-4">
            {allQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Users className="h-10 w-10 opacity-20" />
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
                    queryKey={queryKey}
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
