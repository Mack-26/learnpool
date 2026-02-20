import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpen, ChevronDown, ChevronUp, Users, AlertTriangle, ThumbsUp, ThumbsDown,
} from 'lucide-react'
import { useState } from 'react'
import { getSessionReport } from '../api/sessions'
import { getProfessorSessionReport } from '../api/professor'
import { useAuthStore } from '../store/authStore'
import type { ReportQuestionOut, TopicGroup } from '../types/api'
import DashboardLayout from '@/components/DashboardLayout'
import { Badge } from '@/components/ui/badge'

// ─── Single Q&A card ──────────────────────────────────────────────────────────
function ReportItem({ item, index }: { item: ReportQuestionOut; index: number }) {
  const [open, setOpen] = useState(false)
  const { answer, feedback } = item
  const needsAttention = feedback?.needs_attention ?? false

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        needsAttention
          ? 'border-destructive/40 bg-destructive/5'
          : 'border-border bg-card'
      }`}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/40 transition-colors"
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
            {/* Feedback counts */}
            {feedback && (
              <>
                <span className="flex items-center gap-1 text-xs text-success">
                  <ThumbsUp className="h-3 w-3" />{feedback.thumbs_up}
                </span>
                <span className={`flex items-center gap-1 text-xs ${feedback.thumbs_down > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  <ThumbsDown className="h-3 w-3" />{feedback.thumbs_down}
                </span>
              </>
            )}
            {/* Needs attention badge */}
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
function TopicGroupCard({ group, groupIndex }: { group: TopicGroup; groupIndex: number }) {
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
              {group.student_count} student{group.student_count !== 1 ? 's' : ''}
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
              <ReportItem key={item.question_id} item={item} index={i} />
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['session-report', sessionId, role],
    queryFn: () =>
      role === 'professor'
        ? getProfessorSessionReport(sessionId!)
        : getSessionReport(sessionId!),
    enabled: !!sessionId,
  })

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
          ← Back
        </button>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">Class Questions</h1>
          {data && (
            <div className="flex items-center gap-3">
              {totalAttention > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-destructive font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {totalAttention} need{totalAttention === 1 ? 's' : ''} professor attention
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {data.total_questions} question{data.total_questions !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
        <p className="text-muted-foreground mb-6">
          All questions from this session, grouped by topic — identities are anonymous
        </p>

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
            <TopicGroupCard key={group.topic_name} group={group} groupIndex={i} />
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
