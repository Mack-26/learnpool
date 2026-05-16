import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getSessionsForCourse, getCourses } from '../api/sessions'
import type { SessionSummary } from '../types/api'
import CourseLayout from '@/components/CourseLayout'
import SessionCard from '@/components/SessionCard'

function toCardStatus(status: SessionSummary['status']): 'live' | 'upcoming' | 'past' {
  if (status === 'active') return 'live'
  if (status === 'released') return 'upcoming'
  return 'past'
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

  const courseName = courses?.find((c) => c.id === courseId)?.name

  const sorted = sessions
    ? [...sessions].sort((a, b) =>
        a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0
      )
    : []

  return (
    <CourseLayout
      courseId={courseId!}
      courseName={courseName}
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
      >
        <h2 className="text-lg font-semibold text-foreground mb-1">Lectures</h2>
        <p className="text-sm text-muted-foreground mb-6">Click a lecture to join the Q&amp;A</p>

        {isLoading && <p className="text-muted-foreground text-sm">Loading lectures…</p>}
        {error && <p className="text-destructive text-sm">Failed to load lectures.</p>}
        {sessions && sessions.length === 0 && (
          <p className="text-muted-foreground text-sm">No lectures yet for this class.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((session, i) => {
            const date = new Date(session.started_at).toLocaleDateString(undefined, {
              weekday: 'short', month: 'short', day: 'numeric',
            })
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
              >
                <SessionCard
                  title={session.title}
                  date={date}
                  status={toCardStatus(session.status)}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                />
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </CourseLayout>
  )
}
