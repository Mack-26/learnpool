import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react'
import { getCourseOverview, getProfessorSessionReport } from '../api/professor'
import DashboardLayout from '@/components/DashboardLayout'
import CitationMapCard from '@/components/CitationMapCard'
import type {
  RecurringTopicItem, ReportQuestionOut, SessionOverviewItem, StudentSummaryItem,
} from '../types/api'

/* ────────────────────────────────────────────────────────────────────────────
   Design: design/App-Prof.html — "What the class asked".
   Chart rules (design/README.md): one hue per single series (--chart-1), one
   axis per chart, tooltip on every mark, a Table toggle on each chart, and
   status colours reserved for status chips only.
   ──────────────────────────────────────────────────────────────────────────── */

const CHART_HUE = 'var(--chart-1)'
const TOOLTIP_STYLE = {
  background: 'var(--dark)',
  border: 0,
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 11,
  lineHeight: 1.3,
  color: 'hsl(var(--background))',
  boxShadow: 'var(--shadow-hover)',
}
const AXIS_TICK = { fontSize: 10, fill: 'var(--ink-3)', fontFamily: 'ui-monospace, Menlo, monospace' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/* ── Small building blocks ──────────────────────────────────────────────── */

function Eyebrow({ children, color = 'var(--ink-3)' }: { children: ReactNode; color?: string }) {
  return (
    <div className="mono text-[9.5px] tracking-[.09em] uppercase" style={{ color }}>
      {children}
    </div>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 sm:p-[16px_18px] ${className}`}>{children}</div>
  )
}

function ToggleButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="h-[27px] px-2.5 rounded-[7px] border border-border bg-card text-[11.5px] text-muted-foreground hover:bg-muted hover:border-input transition-colors flex-shrink-0"
    >
      {children}
    </button>
  )
}

/** Card with a title, subtitle and a chart/table toggle. */
function ChartCard({
  title, subtitle, table, children, className = '',
}: { title: string; subtitle?: ReactNode; table: ReactNode; children: ReactNode; className?: string }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>{subtitle}</p>}
        </div>
        <ToggleButton active={view === 'table'} onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}>
          {view === 'chart' ? 'Table' : 'Chart'}
        </ToggleButton>
      </div>
      <div className="mt-4 flex-1 min-h-0">{view === 'chart' ? children : table}</div>
    </Card>
  )
}

function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[360px] text-xs">
        <thead>
          <tr className="border-b border-border">
            {columns.map((c, i) => (
              <th key={c} className={`py-1.5 px-2 font-medium ${i === 0 ? 'text-left' : 'text-right'}`} style={{ color: 'var(--ink-2)' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-border/60 last:border-0">
              {r.map((cell, ci) => (
                <td key={ci} className={`py-1.5 px-2 tabular-nums ${ci === 0 ? 'text-left text-foreground' : 'text-right text-foreground'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Charts ─────────────────────────────────────────────────────────────── */

interface LectureBarChartProps {
  sessions: SessionOverviewItem[]
  value: (s: SessionOverviewItem) => number | null
  unit: string
  highlightId?: string
  domainMax?: number
}

/** Single-series vertical bars, one value axis, latest lecture highlighted. */
function LectureBarChart({ sessions, value, unit, highlightId, domainMax }: LectureBarChartProps) {
  const data = sessions.map((s, i) => ({
    id: s.session_id,
    label: `L${i + 1}`,
    title: s.title,
    value: value(s),
  }))
  return (
    <div className="h-[168px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 14, right: 4, left: -22, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: 'var(--grid)' }} tickLine={false} interval={0} />
          <YAxis
            allowDecimals={false}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            domain={domainMax != null ? [0, domainMax] : [0, 'auto']}
          />
          <Tooltip
            cursor={{ fill: 'var(--hover-row)' }}
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: 'inherit', padding: 0 }}
            labelStyle={{ color: 'inherit', fontWeight: 500 }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.title ?? ''}
            formatter={(v) => [v == null ? 'not rated' : `${v}${unit}`, '']}
            separator=""
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.id} fill={CHART_HUE} fillOpacity={highlightId && d.id !== highlightId ? 0.35 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Horizontal label bars (9px, rounded data-end) for a nominal list — one hue. */
function TopicBars({ topics }: { topics: RecurringTopicItem[] }) {
  const max = Math.max(1, ...topics.map((t) => t.question_count))
  return (
    <div className="flex flex-col gap-[11px]">
      {topics.map((t) => (
        <div key={t.category} className="relative group" tabIndex={0}>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 bottom-full -translate-x-1/2 -translate-y-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity z-10"
            style={{ background: 'var(--dark)', color: 'hsl(var(--background))' }}
          >
            {t.question_count} question{t.question_count !== 1 ? 's' : ''} · {t.session_count} lecture{t.session_count !== 1 ? 's' : ''}
          </span>
          <div className="flex items-baseline justify-between gap-2.5">
            <span className="text-[12.5px] text-foreground truncate">{t.category}</span>
            <span className="text-[12.5px] font-semibold text-foreground tabular-nums flex-shrink-0">{t.question_count}</span>
          </div>
          <span
            className="block mt-[5px] h-[9px] rounded-r-[4px] transition-[filter] group-hover:brightness-95"
            style={{ width: `${(t.question_count / max) * 100}%`, background: CHART_HUE }}
          />
        </div>
      ))}
    </div>
  )
}

/* ── Needs attention ────────────────────────────────────────────────────── */

function citedPages(q: ReportQuestionOut): string | null {
  const pages = Array.from(
    new Set((q.answer?.citations ?? []).map((c) => c.page_number).filter((p): p is number => p != null)),
  ).sort((a, b) => a - b)
  if (pages.length === 0) return null
  const shown = pages.slice(0, 3).map((p) => `p. ${p}`).join(', ')
  return pages.length > 3 ? `${shown} +${pages.length - 3}` : shown
}

function AttentionCard({
  session, questions, isLoading, onOpen,
}: { session: SessionOverviewItem; questions: ReportQuestionOut[]; isLoading: boolean; onOpen: () => void }) {
  const pushedBack = useMemo(
    () =>
      questions
        .filter((q) => q.feedback?.needs_attention)
        .sort((a, b) => (b.feedback!.thumbs_down - b.feedback!.thumbs_up) - (a.feedback!.thumbs_down - a.feedback!.thumbs_up)),
    [questions],
  )
  const shown = pushedBack.slice(0, 5)

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14.5px] font-semibold text-foreground">Answers students pushed back on</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>
            {session.title} · more thumbs-down than thumbs-up
          </p>
        </div>
        {pushedBack.length > 0 && (
          <span
            className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-[11.5px] flex-shrink-0 border"
            style={{ color: 'var(--status-critical)', borderColor: 'color-mix(in srgb, var(--status-critical) 30%, transparent)', background: 'color-mix(in srgb, var(--status-critical) 6%, transparent)' }}
          >
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {pushedBack.length} open
          </span>
        )}
      </div>

      <div className="mt-3.5 flex flex-col gap-2">
        {isLoading && [1, 2, 3].map((i) => <div key={i} className="h-14 rounded-[10px] bg-muted animate-pulse" />)}

        {!isLoading && pushedBack.length === 0 && (
          <div className="flex items-center gap-2 py-4 text-sm" style={{ color: 'var(--status-good)' }}>
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            <span>Nothing pushed back on in {session.title}.</span>
          </div>
        )}

        {!isLoading && shown.map((q) => {
          const ups = q.feedback!.thumbs_up
          const downs = q.feedback!.thumbs_down
          const pages = citedPages(q)
          return (
            <button
              key={q.question_id}
              type="button"
              onClick={onOpen}
              className="w-full text-left rounded-[10px] border border-border px-3.5 py-3 hover:bg-[var(--hover-row)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3.5">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium leading-[1.4] text-foreground">{q.content}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
                    <span style={{ color: 'var(--status-critical)' }}>{downs} of {ups + downs} marked it unhelpful</span>
                    {pages && <><span aria-hidden>·</span><span>cited {pages}</span></>}
                    {q.comment_count > 0 && <><span aria-hidden>·</span><span>{q.comment_count} repl{q.comment_count === 1 ? 'y' : 'ies'}</span></>}
                    {q.category && <><span aria-hidden>·</span><span>{q.category}</span></>}
                  </div>
                </div>
                {/* TODO(backend): "Post a correction" needs a write path that supersedes an answer (design/README.md). */}
                <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ink-3)' }} aria-hidden />
              </div>
            </button>
          )
        })}
      </div>

      {!isLoading && pushedBack.length > shown.length && (
        <button type="button" onClick={onOpen} className="mt-3 self-start text-xs text-primary hover:underline">
          See all {pushedBack.length} in the lecture report
        </button>
      )}
    </Card>
  )
}

/* ── Participation ──────────────────────────────────────────────────────── */

function attendanceChip(student: StudentSummaryItem) {
  const { sessions_active, total_sessions } = student
  if (total_sessions === 0) return null
  const rate = sessions_active / total_sessions
  if (rate === 0 && total_sessions >= 2)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--status-critical)' }}>
        <AlertTriangle className="h-3 w-3" aria-hidden /> Never asked
      </span>
    )
  if (rate < 0.5)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--status-warning-text)' }}>
        <AlertTriangle className="h-3 w-3" aria-hidden style={{ color: 'var(--status-warning)' }} /> Fading
      </span>
    )
  return null
}

function ParticipationTable({ students }: { students: StudentSummaryItem[] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[440px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2"><Eyebrow>Student</Eyebrow></th>
            <th className="text-right py-2 px-2"><Eyebrow>Lectures active</Eyebrow></th>
            <th className="text-right py-2 px-2"><Eyebrow>Questions</Eyebrow></th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.student_id} className="border-b border-border/60 last:border-0 hover:bg-[var(--hover-row)] transition-colors">
              <td className="py-2 px-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-6 w-6 rounded-full bg-secondary text-foreground text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                    {s.display_name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-[13px] text-foreground truncate">{s.display_name}</span>
                  {attendanceChip(s)}
                </div>
              </td>
              <td className="py-2 px-2 text-right">
                <div className="inline-flex items-center gap-2 justify-end">
                  <span className="h-[5px] w-16 rounded-[3px] bg-muted overflow-hidden hidden sm:block">
                    <span
                      className="block h-full rounded-[3px]"
                      style={{ width: s.total_sessions > 0 ? `${(s.sessions_active / s.total_sessions) * 100}%` : '0%', background: CHART_HUE }}
                    />
                  </span>
                  <span className="tabular-nums text-[13px] text-foreground">{s.sessions_active} / {s.total_sessions}</span>
                </div>
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-[13px] font-semibold text-foreground">{s.total_questions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function ProfessorReportsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()

  const { data: overview, isLoading } = useQuery({
    queryKey: ['course-overview', courseId],
    queryFn: () => getCourseOverview(courseId!),
    enabled: !!courseId,
  })

  const sessions = overview?.sessions ?? []
  const recurringTopics = overview?.recurring_topics ?? []
  const studentSummary = overview?.student_summary ?? []

  const latest = sessions[sessions.length - 1]
  const previous = sessions.length >= 2 ? sessions[sessions.length - 2] : undefined

  // The lead section needs question-level feedback, which only the per-lecture report carries.
  const { data: latestReport, isLoading: reportLoading } = useQuery({
    queryKey: ['session-report', latest?.session_id],
    queryFn: () => getProfessorSessionReport(latest!.session_id),
    enabled: !!latest,
  })
  const latestQuestions = useMemo(
    () => (latestReport?.groups ?? []).flatMap((g) => g.questions),
    [latestReport],
  )
  const ratedCount = latestQuestions.reduce(
    (n, q) => n + (q.feedback ? q.feedback.thumbs_up + q.feedback.thumbs_down : 0), 0,
  )
  const topRepeat = latestReport?.repeating_questions?.[0]

  const enrolled = studentSummary.length
  const delta = latest && previous ? latest.question_count - previous.question_count : null

  const openLecture = (id: string) => navigate(`/sessions/${id}/report`)

  const lectureRows = (fmt: (s: SessionOverviewItem) => string | number) =>
    sessions.map((s, i) => [`L${i + 1} · ${s.title}`, fmt(s)])

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-[18px]">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-1 text-[13px] hover:text-foreground transition-colors"
            style={{ color: 'var(--ink-2)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to course
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-.024em] text-foreground">What the class asked</h1>
              <p className="mt-1.5 text-[13px]" style={{ color: 'var(--ink-2)' }}>
                {latest
                  ? `${latest.title} · ${formatDate(latest.started_at)} · ${latest.question_count} question${latest.question_count !== 1 ? 's' : ''}`
                  : 'Aggregated across every ended lecture'}
              </p>
            </div>
            {/* TODO(backend): term filter and Export need endpoints; the artboard's buttons are omitted until then. */}
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <Card>
            <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
              No ended lectures yet. This board fills in once a lecture is ended.
            </p>
          </Card>
        )}

        {!isLoading && latest && (
          <>
            {/* ── Stat tiles ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <Card>
                <Eyebrow>Questions in {latest.title}</Eyebrow>
                <div className="mt-2 text-[31px] font-semibold leading-none tracking-[-.028em] tabular-nums text-foreground">{latest.question_count}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {delta == null
                    ? 'first ended lecture'
                    : delta === 0
                      ? `same as ${previous!.title}`
                      : `${Math.abs(delta)} ${delta > 0 ? 'more' : 'fewer'} than ${previous!.title}`}
                </div>
              </Card>

              <Card>
                <Eyebrow>Students who asked</Eyebrow>
                <div className="mt-2 text-[31px] font-semibold leading-none tracking-[-.028em] tabular-nums text-foreground">
                  {latest.participant_count}
                  {enrolled > 0 && <span className="text-base font-normal" style={{ color: 'var(--ink-2)' }}> of {enrolled}</span>}
                </div>
                <div className="mt-2.5 h-[5px] rounded-[3px] bg-muted overflow-hidden">
                  <span
                    className="block h-full rounded-[3px]"
                    style={{ width: enrolled > 0 ? `${Math.min(100, (latest.participant_count / enrolled) * 100)}%` : '0%', background: CHART_HUE }}
                  />
                </div>
              </Card>

              <Card>
                <Eyebrow>Answers marked helpful</Eyebrow>
                <div className="mt-2 text-[31px] font-semibold leading-none tracking-[-.028em] tabular-nums text-foreground">
                  {latest.satisfaction_pct != null ? `${latest.satisfaction_pct}%` : '—'}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {reportLoading ? '…' : ratedCount > 0 ? `of ${ratedCount} rating${ratedCount !== 1 ? 's' : ''} by students` : 'no ratings yet'}
                </div>
              </Card>

              <div
                className="rounded-xl border p-4 sm:p-[16px_18px]"
                style={{
                  borderColor: 'color-mix(in srgb, var(--status-critical) 25%, transparent)',
                  background: 'color-mix(in srgb, var(--status-critical) 5%, hsl(var(--card)))',
                }}
              >
                <Eyebrow color="var(--status-critical)">Needs your attention</Eyebrow>
                <div className="mt-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--status-critical)' }} aria-hidden />
                  <span className="text-[31px] font-semibold leading-none tracking-[-.028em] tabular-nums" style={{ color: 'var(--status-critical)' }}>
                    {latest.needs_attention_count}
                  </span>
                </div>
                <div className="mt-2 text-xs" style={{ color: 'var(--status-critical)', opacity: 0.85 }}>
                  answer{latest.needs_attention_count !== 1 ? 's' : ''} students pushed back on
                </div>
              </div>
            </div>

            {/* ── Lead: answers students pushed back on ── */}
            <AttentionCard
              session={latest}
              questions={latestQuestions}
              isLoading={reportLoading}
              onOpen={() => openLecture(latest.session_id)}
            />

            {topRepeat && topRepeat.count > 1 && (
              <div className="rounded-xl border border-border bg-card px-4 py-3 sm:px-[18px]">
                <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
                  {topRepeat.count} students asked some version of{' '}
                  <span className="font-medium text-foreground">"{topRepeat.summary}"</span> — worth two minutes at the start of the next lecture.
                  {/* TODO(backend): "Add to next lecture" needs a lecture-plan write path. */}
                </p>
              </div>
            )}

            {/* ── Per-lecture overview + recurring topics ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-3.5">
              <ChartCard
                title="Questions per lecture"
                subtitle={`${sessions.length} ended lecture${sessions.length !== 1 ? 's' : ''} · ${latest.title} highlighted`}
                table={<DataTable columns={['Lecture', 'Questions']} rows={lectureRows((s) => s.question_count)} />}
              >
                <LectureBarChart sessions={sessions} value={(s) => s.question_count} unit=" questions" highlightId={latest.session_id} />
              </ChartCard>

              <ChartCard
                title="Where they got stuck"
                subtitle={recurringTopics.length > 0 ? 'Every lecture, grouped by topic' : 'Topics appear once questions are categorised'}
                table={<DataTable columns={['Topic', 'Questions', 'Lectures']} rows={recurringTopics.map((t) => [t.category, t.question_count, t.session_count])} />}
              >
                {recurringTopics.length > 0
                  ? <TopicBars topics={recurringTopics.slice(0, 6)} />
                  : <p className="text-xs" style={{ color: 'var(--ink-2)' }}>No categorised questions yet.</p>}
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              <ChartCard
                title="Students who asked"
                subtitle={enrolled > 0 ? `Per lecture · ${enrolled} enrolled` : 'Per lecture'}
                table={<DataTable columns={['Lecture', 'Students']} rows={lectureRows((s) => s.participant_count)} />}
              >
                <LectureBarChart sessions={sessions} value={(s) => s.participant_count} unit=" students" highlightId={latest.session_id} domainMax={enrolled > 0 ? enrolled : undefined} />
              </ChartCard>

              <ChartCard
                title="Answers marked helpful"
                subtitle="Share of thumbs-up per lecture"
                table={<DataTable columns={['Lecture', 'Helpful']} rows={lectureRows((s) => (s.satisfaction_pct != null ? `${s.satisfaction_pct}%` : '—'))} />}
              >
                <LectureBarChart sessions={sessions} value={(s) => s.satisfaction_pct} unit="%" highlightId={latest.session_id} domainMax={100} />
              </ChartCard>
            </div>

            <Card>
              <h2 className="text-[14.5px] font-semibold text-foreground">Lectures</h2>
              <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>Open a lecture for its full report</p>
              <div className="mt-3 overflow-x-auto -mx-1">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2"><Eyebrow>Lecture</Eyebrow></th>
                      <th className="text-right py-2 px-2"><Eyebrow>Questions</Eyebrow></th>
                      <th className="text-right py-2 px-2"><Eyebrow>Students</Eyebrow></th>
                      <th className="text-right py-2 px-2"><Eyebrow>Helpful</Eyebrow></th>
                      <th className="text-left py-2 px-2"><Eyebrow>Top topic</Eyebrow></th>
                      <th className="text-right py-2 px-2"><Eyebrow>Pushed back</Eyebrow></th>
                      <th className="w-6" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {[...sessions].reverse().map((s) => (
                      <tr
                        key={s.session_id}
                        onClick={() => openLecture(s.session_id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLecture(s.session_id) } }}
                        tabIndex={0}
                        role="link"
                        className="border-b border-border/60 last:border-0 hover:bg-[var(--hover-row)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-[var(--hover-row)]"
                      >
                        <td className="py-2.5 px-2">
                          <p className="text-[13px] font-medium text-foreground truncate max-w-[280px]">{s.title}</p>
                          <p className="text-[11px]" style={{ color: 'var(--ink-2)' }}>{formatDate(s.started_at)}</p>
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-foreground">{s.question_count}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-foreground">{s.participant_count}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-foreground">{s.satisfaction_pct != null ? `${s.satisfaction_pct}%` : '—'}</td>
                        <td className="py-2.5 px-2 text-[12px] text-foreground truncate max-w-[180px]">{s.top_category ?? '—'}</td>
                        <td className="py-2.5 px-2 text-right">
                          {s.needs_attention_count > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[12px] font-medium tabular-nums" style={{ color: 'var(--status-critical)' }}>
                              <AlertTriangle className="h-3 w-3" aria-hidden /> {s.needs_attention_count}
                            </span>
                          ) : <span className="text-[12px]" style={{ color: 'var(--ink-3)' }}>0</span>}
                        </td>
                        <td className="py-2.5 pr-1 text-right"><ChevronRight className="h-4 w-4 inline" style={{ color: 'var(--ink-3)' }} aria-hidden /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* ── Citation heat + participation ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-3.5">
              <CitationMapCard sessionId={latest.session_id} lectureTitle={latest.title} />

              <Card>
                <h2 className="text-[14.5px] font-semibold text-foreground">Participation</h2>
                <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>
                  {enrolled} enrolled · across {sessions.length} lecture{sessions.length !== 1 ? 's' : ''}
                </p>
                <div className="mt-3">
                  {studentSummary.length > 0
                    ? <ParticipationTable students={studentSummary} />
                    : <p className="text-xs" style={{ color: 'var(--ink-2)' }}>No students enrolled yet.</p>}
                </div>
              </Card>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
