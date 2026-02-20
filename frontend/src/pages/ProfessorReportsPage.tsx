import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getProfessorSessionsForCourse } from '../api/professor'
import DashboardLayout from '@/components/DashboardLayout'
import ClassCard from '@/components/ClassCard'
import type { SessionSummary } from '../types/api'

function toCardStatus(s: SessionSummary['status']): 'live' | 'upcoming' | 'past' {
  if (s === 'active') return 'live'
  if (s === 'released') return 'upcoming'
  return 'past'
}

export default function ProfessorReportsPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['professor-sessions', courseId],
    queryFn: () => getProfessorSessionsForCourse(courseId!),
    enabled: !!courseId,
  })

  const sorted = [...sessions].sort((a, b) =>
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  )

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate(`/instructor/courses/${courseId}`)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Course
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Lecture Reports</h1>
        <p className="text-muted-foreground mb-6">View Q&A analytics for each lecture</p>

        {isLoading && <p className="text-muted-foreground">Loading lectures…</p>}
        {sorted.length === 0 && !isLoading && (
          <p className="text-muted-foreground">No lectures yet.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((session, i) => {
            const date = new Date(session.started_at).toLocaleDateString(undefined, {
              weekday: 'short', month: 'short', day: 'numeric',
            })
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
              >
                <ClassCard
                  name={session.title}
                  professor={date}
                  status={toCardStatus(session.status)}
                  onClick={() => navigate(`/sessions/${session.id}/report`)}
                />
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
