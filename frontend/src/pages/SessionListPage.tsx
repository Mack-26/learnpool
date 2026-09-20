import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getSessionsForCourse, getCourses } from '../api/sessions'
import type { SessionSummary } from '../types/api'
import CourseLayout from '@/components/CourseLayout'
import SessionCard from '@/components/SessionCard'

const DAY_MS = 24 * 60 * 60 * 1000

/** "When" for each status, from the only time field the API has (started_at). */
function formatWhen(session: SessionSummary, now: Date): string {
  const at = new Date(session.started_at)
  if (Number.isNaN(at.getTime())) return ''

  if (session.status === 'active') {
    const mins = Math.max(0, Math.round((now.getTime() - at.getTime()) / 60000))
    if (mins < 1) return 'Started just now'
    if (mins < 60) return `Started ${mins} minute${mins === 1 ? '' : 's'} ago`
    const hrs = Math.round(mins / 60)
    if (hrs < 24) return `Started ${hrs} hour${hrs === 1 ? '' : 's'} ago`
    return `Started ${at.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
  }

  const time = at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (session.status === 'upcoming') {
    const withinWeek = at.getTime() - now.getTime() < 7 * DAY_MS
    const day = withinWeek
      ? at.toLocaleDateString(undefined, { weekday: 'long' })
      : at.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return `${day} · ${time}`
  }

  return at.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono text-[9.5px] uppercase tracking-[0.09em] text-[var(--ink-3)]">{children}</span>
  )
}

export default function SessionListPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', courseId],
    queryFn: () => getSessionsForCourse(courseId!),
    enabled: !!courseId,
  })

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  const course = courses?.find((c) => c.id === courseId)
  const now = new Date()

  const byStart = (dir: 1 | -1) => (a: SessionSummary, b: SessionSummary) =>
    dir * (new Date(a.started_at).getTime() - new Date(b.started_at).getTime())

  const live = (sessions ?? []).filter((s) => s.status === 'active').sort(byStart(-1))
  const nextUp = (sessions ?? []).filter((s) => s.status === 'upcoming').sort(byStart(1))
  const earlier = (sessions ?? [])
    .filter((s) => s.status === 'ended' || s.status === 'released')
    .sort(byStart(-1))

  const open = (session: SessionSummary) => () => navigate(`/sessions/${session.id}`)

  const courseMeta = course
    ? [course.professor_name, `${course.session_count} ${course.session_count === 1 ? 'lecture' : 'lectures'}`]
        .filter(Boolean)
        .join(' · ')
    : null

  return (
    <CourseLayout
      courseId={courseId!}
      courseName={course?.name}
      backPath="/classes"
      backLabel="All Classes"
      navItems={[
        { label: 'Lectures', path: `/classes/${courseId}` },
        { label: 'People', path: `/classes/${courseId}/people` },
      ]}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-6"
      >
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">Lectures</h2>
          {courseMeta && <p className="mt-1 text-[13px] text-[var(--ink-2)]">{courseMeta}</p>}
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading lectures…</p>}
        {error && <p className="text-sm text-destructive">Failed to load lectures.</p>}
        {sessions && sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">No lectures yet for this class.</p>
        )}

        {live.length > 0 && (
          <section>
            <Eyebrow>Happening now</Eyebrow>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {live.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <SessionCard
                    title={session.title}
                    date={formatWhen(session, now)}
                    status={session.status}
                    onClick={open(session)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {nextUp.length > 0 && (
          <section>
            <Eyebrow>Next up</Eyebrow>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {nextUp.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.35 }}
                >
                  <SessionCard
                    title={session.title}
                    date={formatWhen(session, now)}
                    status={session.status}
                    onClick={open(session)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {earlier.length > 0 && (
          <section>
            <div className="flex items-center justify-between">
              <Eyebrow>Earlier this term</Eyebrow>
              <span className="text-xs text-[var(--ai-meta)]">
                All {earlier.length} {earlier.length === 1 ? 'lecture' : 'lectures'}
              </span>
            </div>
            {/* TODO(backend): last-seen — "3 new since you were here" per card needs a per-user last-seen timestamp. */}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {earlier.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
                >
                  <SessionCard
                    title={session.title}
                    date={formatWhen(session, now)}
                    status={session.status}
                    onClick={open(session)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </CourseLayout>
  )
}
