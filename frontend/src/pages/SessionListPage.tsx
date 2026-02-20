import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getSessionsForCourse } from '../api/sessions'
import type { SessionSummary } from '../types/api'
import DashboardLayout from '@/components/DashboardLayout'
import ClassCard from '@/components/ClassCard'

function toCardStatus(status: SessionSummary['status']): 'live' | 'upcoming' | 'past' | 'active' | 'ended' {
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
  })

  const sorted = sessions
    ? [...sessions].sort((a, b) =>
        a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0
      )
    : []

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate('/classes')}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Classes
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Sessions</h1>
        <p className="text-muted-foreground mb-6">Click a session to join the AI chat</p>

        {isLoading && <p className="text-muted-foreground">Loading sessions…</p>}
        {error && <p className="text-destructive text-sm">Failed to load sessions.</p>}
        {sessions && sessions.length === 0 && (
          <p className="text-muted-foreground">No sessions yet for this class.</p>
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
                transition={{ delay: i * 0.1, duration: 0.35 }}
              >
                <ClassCard
                  name={session.title}
                  professor={date}
                  status={toCardStatus(session.status)}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                />
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
