import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { AlertTriangle, BookOpen, Users, TrendingUp } from 'lucide-react'
import { getCourseOverview } from '../api/professor'
import DashboardLayout from '@/components/DashboardLayout'
import type { StudentSummaryItem } from '../types/api'

function attendanceBadge(student: StudentSummaryItem) {
  const { sessions_active, total_sessions } = student
  if (total_sessions === 0) return null
  const rate = sessions_active / total_sessions
  if (rate === 0 && total_sessions >= 2)
    return <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-md font-medium">Disengaged</span>
  if (rate < 0.5)
    return <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-medium">Fading</span>
  return null
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-pink-500', 'bg-amber-500', 'bg-slate-500', 'bg-sky-500',
]

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

  // Pulse metrics
  const totalLectures = sessions.length
  const avgQuestionsPerLecture = totalLectures > 0
    ? Math.round(sessions.reduce((s, r) => s + r.question_count, 0) / totalLectures)
    : 0
  const satisfactionValues = sessions.filter((s) => s.satisfaction_pct != null).map((s) => s.satisfaction_pct!)
  const overallSatisfaction = satisfactionValues.length > 0
    ? Math.round(satisfactionValues.reduce((a, b) => a + b, 0) / satisfactionValues.length)
    : null

  // Trend chart data
  const trendData = sessions.map((s, i) => ({
    name: `L${i + 1}`,
    Questions: s.question_count,
    Satisfaction: s.satisfaction_pct ?? null,
    Participants: s.participant_count,
  }))

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Course
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Course Analytics</h1>
        <p className="text-muted-foreground mb-6">Aggregated insights across all lectures</p>

        {isLoading && <p className="text-muted-foreground">Loading analytics…</p>}

        {!isLoading && sessions.length === 0 && (
          <p className="text-muted-foreground">No completed lectures yet. Analytics appear once a lecture is ended.</p>
        )}

        {!isLoading && sessions.length > 0 && (
          <>
            {/* ── Section A: Course Pulse ── */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Total Lectures</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalLectures}</p>
                <p className="text-xs text-muted-foreground mt-0.5">completed sessions</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Avg Questions / Lecture</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{avgQuestionsPerLecture}</p>
                <p className="text-xs text-muted-foreground mt-0.5">questions on average</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Avg AI Satisfaction</span>
                </div>
                <p className={`text-2xl font-bold ${overallSatisfaction != null ? (overallSatisfaction >= 70 ? 'text-emerald-600' : overallSatisfaction >= 50 ? 'text-amber-600' : 'text-red-600') : 'text-foreground'}`}>
                  {overallSatisfaction != null ? `${overallSatisfaction}%` : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">across all lectures</p>
              </div>
            </div>

            {/* ── Section B: Lecture Trend ── */}
            {sessions.length >= 2 && (
              <div className="rounded-xl border border-border bg-card p-4 mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-0.5">Lecture-by-Lecture Trend</h3>
                <p className="text-xs text-muted-foreground mb-4">How engagement and AI quality change over time</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="Questions" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Satisfaction" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" dataKey="Participants" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── Section C: Recurring Topics ── */}
            {recurringTopics.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-0.5">Recurring Confusion</h3>
                <p className="text-xs text-muted-foreground mb-4">Topics that keep coming back across lectures — consider spending more time here</p>
                <div className="flex flex-wrap gap-3">
                  {recurringTopics.map((t) => {
                    const sizeClass = t.session_count >= 3 ? 'text-sm' : t.session_count >= 2 ? 'text-xs' : 'text-xs'
                    const bgClass = t.session_count >= 3
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : t.session_count >= 2
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-muted border-border text-muted-foreground'
                    return (
                      <div
                        key={t.category}
                        className={`border rounded-lg px-3 py-2 ${bgClass}`}
                      >
                        <p className={`font-semibold ${sizeClass}`}>{t.category}</p>
                        <p className="text-[10px] mt-0.5 opacity-70">
                          {t.session_count} lecture{t.session_count !== 1 ? 's' : ''} · {t.question_count} questions
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Section D: Student Roster Health ── */}
            {studentSummary.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-0.5">Student Roster Health</h3>
                <p className="text-xs text-muted-foreground mb-4">Engagement per student across all lectures</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lectures Active</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Questions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentSummary.map((student, i) => (
                        <tr key={student.student_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors last:border-0">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-7 w-7 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {student.display_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-foreground">{student.display_name}</span>
                              {attendanceBadge(student)}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-sm text-foreground font-medium">
                              {student.sessions_active} / {student.total_sessions}
                            </span>
                            <div className="mt-1 h-1.5 rounded-full bg-muted w-20 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: student.total_sessions > 0 ? `${(student.sessions_active / student.total_sessions) * 100}%` : '0%' }}
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-sm font-semibold text-foreground">{student.total_questions}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Section E: Per-Lecture Cards ── */}
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-foreground mb-0.5">Lecture Breakdown</h3>
              <p className="text-xs text-muted-foreground mb-4">Click a lecture to view its full class dashboard</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...sessions].reverse().map((session, i) => {
                const date = new Date(session.started_at).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric',
                })
                return (
                  <motion.div
                    key={session.session_id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                  >
                    <button
                      onClick={() => navigate(`/sessions/${session.session_id}/report`)}
                      className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{session.title}</p>
                          <p className="text-xs text-muted-foreground">{date}</p>
                        </div>
                        {session.needs_attention_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            <AlertTriangle className="h-3 w-3" />
                            {session.needs_attention_count}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-base font-bold text-foreground">{session.question_count}</p>
                          <p className="text-[10px] text-muted-foreground">questions</p>
                        </div>
                        <div>
                          <p className="text-base font-bold text-foreground">{session.participant_count}</p>
                          <p className="text-[10px] text-muted-foreground">students</p>
                        </div>
                        <div>
                          <p className={`text-base font-bold ${session.satisfaction_pct != null ? (session.satisfaction_pct >= 70 ? 'text-emerald-600' : session.satisfaction_pct >= 50 ? 'text-amber-600' : 'text-red-600') : 'text-muted-foreground'}`}>
                            {session.satisfaction_pct != null ? `${session.satisfaction_pct}%` : '—'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">satisfaction</p>
                        </div>
                      </div>
                      {session.top_category && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <span className="text-[10px] text-muted-foreground">Top category: </span>
                          <span className="text-[10px] font-semibold text-foreground">{session.top_category}</span>
                        </div>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
