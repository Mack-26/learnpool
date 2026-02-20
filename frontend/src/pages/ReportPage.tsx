import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen, ChevronDown, ChevronUp, Users, AlertTriangle, ThumbsUp, ThumbsDown,
  MessageSquareText, Layers, Flame, TrendingUp,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { getSessionReport, submitFeedback } from '../api/sessions'
import { getProfessorSessionReport } from '../api/professor'
import { useAuthStore } from '../store/authStore'
import type { ReportQuestionOut, SessionReportResponse, TopicGroup } from '../types/api'
import DashboardLayout from '@/components/DashboardLayout'
import { Badge } from '@/components/ui/badge'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Apply an optimistic vote to cached report data, returning the new snapshot. */
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

        const prev = q.my_feedback          // null | 'up' | 'down'
        const newVote = prev === vote ? null : vote  // toggle off if same
        let up = q.feedback?.thumbs_up ?? 0
        let down = q.feedback?.thumbs_down ?? 0

        // Remove old vote
        if (prev === 'up') up = Math.max(0, up - 1)
        if (prev === 'down') down = Math.max(0, down - 1)

        // Add new vote
        if (newVote === 'up') up += 1
        if (newVote === 'down') down += 1

        return {
          ...q,
          my_feedback: newVote,
          feedback: { thumbs_up: up, thumbs_down: down, needs_attention: down > up },
        }
      }),
    })),
  }
}

// ─── Single Q&A card ──────────────────────────────────────────────────────────
function ReportItem({
  item,
  index,
  onVote,
}: {
  item: ReportQuestionOut
  index: number
  onVote: (answerId: string, val: 'up' | 'down') => void
}) {
  const [open, setOpen] = useState(false)
  const { answer, feedback } = item
  const needsAttention = feedback?.needs_attention ?? false
  const up = feedback?.thumbs_up ?? 0
  const down = feedback?.thumbs_down ?? 0

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        needsAttention
          ? 'border-destructive/40 bg-destructive/5'
          : 'border-border bg-card'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 min-w-0 text-left flex items-start gap-3"
        >
          {/* Index bubble */}
          <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            needsAttention ? 'bg-destructive text-white' : 'gradient-primary text-white'
          }`}>
            <span className="text-xs font-bold">{index + 1}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Anonymous name */}
            <p className="text-xs text-muted-foreground mb-0.5">{item.anonymous_name}</p>
            {/* Question text */}
            <p className="text-sm font-medium text-foreground">{item.content}</p>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs text-muted-foreground">
                {new Date(item.asked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
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
            </div>
          </div>

          {answer && (
            open
              ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          )}
        </button>

        {/* Vote buttons — icon-only, no background/border */}
        {answer && (
          <div className="flex items-center gap-3 shrink-0 ml-1 select-none">
            <button
              onClick={() => onVote(answer.answer_id, 'up')}
              className="group/vote flex items-center gap-1 text-xs tabular-nums transition-colors"
            >
              <ThumbsUp className={`h-3.5 w-3.5 transition-all duration-150 group-hover/vote:scale-110 group-active/vote:scale-125 ${
                item.my_feedback === 'up'
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-muted-foreground/50 group-hover/vote:text-muted-foreground'
              }`} />
              {up > 0 && (
                <span className={`transition-colors ${
                  item.my_feedback === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-muted-foreground'
                }`}>{up}</span>
              )}
            </button>
            <button
              onClick={() => onVote(answer.answer_id, 'down')}
              className="group/vote flex items-center gap-1 text-xs tabular-nums transition-colors"
            >
              <ThumbsDown className={`h-3.5 w-3.5 transition-all duration-150 group-hover/vote:scale-110 group-active/vote:scale-125 ${
                item.my_feedback === 'down'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-muted-foreground/50 group-hover/vote:text-muted-foreground'
              }`} />
              {down > 0 && (
                <span className={`transition-colors ${
                  item.my_feedback === 'down'
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : 'text-muted-foreground'
                }`}>{down}</span>
              )}
            </button>
          </div>
        )}
      </div>

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
                      {c.page_number && (
                        <span className="text-muted-foreground">Page {c.page_number}</span>
                      )}
                      <span className="ml-auto text-muted-foreground">
                        {Math.round(c.relevance_score * 100)}% match
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Topic group card ─────────────────────────────────────────────────────────
function TopicGroupCard({
  group,
  groupIndex,
  onVote,
}: {
  group: TopicGroup
  groupIndex: number
  onVote: (answerId: string, val: 'up' | 'down') => void
}) {
  const [expanded, setExpanded] = useState(true)
  const attentionCount = group.questions.filter((q) => q.feedback?.needs_attention).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: groupIndex * 0.1, duration: 0.35 }}
      className="rounded-xl border-2 border-border bg-background overflow-hidden"
    >
      {/* Topic header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
      >
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{groupIndex + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{group.topic_name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {group.student_count} student{group.student_count !== 1 ? 's' : ''} asked about this
            </span>
            <span className="text-xs text-muted-foreground">
              {group.question_count} question{group.question_count !== 1 ? 's' : ''}
            </span>
            {attentionCount > 0 && (
              <Badge className="text-xs bg-destructive/15 text-destructive border-0 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {attentionCount} need{attentionCount === 1 ? 's' : ''} discussion
              </Badge>
            )}
          </div>
        </div>

        {expanded
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        }
      </button>

      {/* Questions list */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-border bg-muted/20">
          <div className="pt-3 space-y-2">
            {group.questions.map((item, i) => (
              <ReportItem key={item.question_id} item={item} index={i} onVote={onVote} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
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
  })

  const handleVote = useCallback((answerId: string, vote: 'up' | 'down') => {
    // ── Optimistic update: patch the cache immediately ──
    const previous = queryClient.getQueryData<SessionReportResponse>(queryKey)
    if (previous) {
      queryClient.setQueryData<SessionReportResponse>(queryKey, applyOptimisticVote(previous, answerId, vote))
    }

    // ── Fire the API call in the background ──
    submitFeedback(answerId, vote).catch(() => {
      // Roll back on error
      if (previous) queryClient.setQueryData(queryKey, previous)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, sessionId])

  // ── Derived metrics ──
  const metrics = useMemo(() => {
    if (!data) return null
    const allQs = data.groups.flatMap((g) => g.questions)
    const totalVotes = allQs.reduce(
      (s, q) => s + (q.feedback?.thumbs_up ?? 0) + (q.feedback?.thumbs_down ?? 0), 0
    )
    const questionsWithVotes = allQs.filter(
      (q) => (q.feedback?.thumbs_up ?? 0) + (q.feedback?.thumbs_down ?? 0) > 0
    ).length
    const uniqueStudents = new Set(allQs.map((q) => q.anonymous_name)).size
    const hottest = data.groups.length > 0
      ? data.groups.reduce((best, g) => g.question_count > best.question_count ? g : best)
      : null
    const engagementPct = allQs.length > 0
      ? Math.round((questionsWithVotes / allQs.length) * 100)
      : 0
    return {
      totalQuestions: data.total_questions,
      topicCount: data.groups.length,
      hottest,
      uniqueStudents,
      totalVotes,
      engagementPct,
    }
  }, [data])

  const totalAttention = data?.groups.reduce(
    (sum, g) => sum + g.questions.filter((q) => q.feedback?.needs_attention).length, 0
  ) ?? 0

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
          {totalAttention > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-destructive font-medium">
              <AlertTriangle className="h-4 w-4" />
              {totalAttention} need{totalAttention === 1 ? 's' : ''} attention
            </div>
          )}
        </div>
        <p className="text-muted-foreground mb-5">
          All questions from this lecture, grouped by topic — identities are anonymous.
          Vote on answers to help the professor prioritise discussion topics.
        </p>

        {/* ── Metrics row ── */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              {
                icon: MessageSquareText,
                label: 'Questions',
                value: metrics.totalQuestions,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
              },
              {
                icon: Layers,
                label: 'Topics',
                value: metrics.topicCount,
                color: 'text-violet-500',
                bg: 'bg-violet-500/10',
              },
              {
                icon: Flame,
                label: 'Hottest Topic',
                value: metrics.hottest
                  ? `${metrics.hottest.question_count} Qs`
                  : '—',
                subtitle: metrics.hottest?.topic_name,
                color: 'text-amber-500',
                bg: 'bg-amber-500/10',
              },
              {
                icon: TrendingUp,
                label: 'Engagement',
                value: `${metrics.engagementPct}%`,
                subtitle: `${metrics.totalVotes} vote${metrics.totalVotes !== 1 ? 's' : ''} · ${metrics.uniqueStudents} student${metrics.uniqueStudents !== 1 ? 's' : ''}`,
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
              },
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
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate" title={stat.subtitle}>
                    {stat.subtitle}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
            <p className="text-xs text-center text-muted-foreground mt-2">
              Grouping questions by topic…
            </p>
          </div>
        )}
        {error && <p className="text-destructive text-sm">Failed to load report.</p>}
        {!isLoading && data?.total_questions === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Users className="h-10 w-10 opacity-20" />
            <p className="text-sm">No questions have been asked in this session yet.</p>
          </div>
        )}

        <div className="space-y-4">
          {data?.groups.map((group, i) => (
            <TopicGroupCard key={group.topic_name} group={group} groupIndex={i} onVote={handleVote} />
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
