import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Play, BarChart3, CalendarPlus, Pencil, Trash2 } from 'lucide-react'
import {
  getProfessorSessionsForCourse,
  createSession,
  updateSessionStatus,
  deleteSession,
} from '../api/professor'
import DashboardLayout from '@/components/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ClassCard from '@/components/ClassCard'
import type { SessionSummary } from '../types/api'

function toCardStatus(s: SessionSummary['status']): 'live' | 'upcoming' | 'past' {
  if (s === 'active') return 'live'
  if (s === 'released' || s === 'upcoming') return 'upcoming'
  return 'past'
}

export default function ProfessorCourseViewPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [newSessionTitle, setNewSessionTitle] = useState('')

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['professor-sessions', courseId],
    queryFn: () => getProfessorSessionsForCourse(courseId!),
    enabled: !!courseId,
  })

  const createMutation = useMutation({
    mutationFn: (params: { title: string; scheduled: boolean }) =>
      createSession(courseId!, params.title, { scheduled: params.scheduled }),
    onSuccess: (session, variables) => {
      queryClient.invalidateQueries({ queryKey: ['professor-sessions', courseId] })
      setNewSessionTitle('')
      if (!variables.scheduled) {
        navigate(`/sessions/${session.id}/report`)
      }
    },
  })

  const endMutation = useMutation({
    mutationFn: (sessionId: string) => updateSessionStatus(sessionId, 'ended'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor-sessions', courseId] })
    },
  })

  const startMutation = useMutation({
    mutationFn: (sessionId: string) => updateSessionStatus(sessionId, 'active'),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['professor-sessions', courseId] })
      navigate(`/sessions/${session.id}/report`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor-sessions', courseId] })
    },
  })

  const handleDeleteLecture = (session: { id: string; title: string }) => {
    if (window.confirm(`Delete "${session.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(session.id)
    }
  }

  const activeSession = sessions.find((s) => s.status === 'active')
  const sorted = [...sessions].sort((a, b) =>
    a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0
  )

  const handleStartSession = () => {
    const title = newSessionTitle.trim() || `Lecture ${new Date().toLocaleDateString()}`
    createMutation.mutate({ title, scheduled: false })
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate('/instructor')}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Lectures</h1>
        <p className="text-muted-foreground mb-8">Manage your lectures</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 max-w-5xl mb-8">
          {/* Start Lecture */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="p-6 rounded-xl border-2 border-primary/30 bg-accent"
          >
            <div className="h-12 w-12 rounded-xl gradient-primary text-white flex items-center justify-center mb-4">
              <Play className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-1">Start Lecture</h3>
            <p className="text-sm text-muted-foreground mb-4">Launch a live lecture</p>

            {activeSession ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="gradient-primary text-white border-0 animate-pulse">● Live</Badge>
                  <span className="text-sm text-muted-foreground">{activeSession.title}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => endMutation.mutate(activeSession.id)}
                  disabled={endMutation.isPending}
                  className="w-full"
                >
                  End Lecture
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="Lecture title (optional)"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
                <Button
                  onClick={handleStartSession}
                  disabled={createMutation.isPending}
                  className="w-full gradient-primary text-white hover:opacity-90"
                >
                  {createMutation.isPending ? 'Starting…' : 'Start Now'}
                </Button>
              </div>
            )}
          </motion.div>

          {/* Schedule Lecture */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            onClick={() => navigate(`/instructor/courses/${courseId}/schedule`)}
            className="p-6 rounded-xl border-2 border-border bg-card text-left hover:border-primary/40 hover:hover-shadow transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <CalendarPlus className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-1">Schedule Lecture</h3>
            <p className="text-sm text-muted-foreground">Set date, time, location & documents</p>
          </motion.button>

          {/* Reports */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            onClick={() => navigate(`/instructor/courses/${courseId}/reports`)}
            className="p-6 rounded-xl border-2 border-border bg-card text-left hover:border-primary/40 hover:hover-shadow transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-1">Reports</h3>
            <p className="text-sm text-muted-foreground">View class analytics and engagement data</p>
          </motion.button>

        </div>

        {/* Lecture list */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Lecture History</h3>
          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {sorted.length === 0 && !isLoading && (
            <p className="text-muted-foreground text-sm">No lectures yet. Start one above.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((session, i) => {
              const date = new Date(session.started_at).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric',
              })
              const isUpcoming = session.status === 'upcoming'
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.05, duration: 0.35 }}
                  className="relative"
                >
                  <ClassCard
                    name={session.title}
                    professor={date}
                    status={toCardStatus(session.status)}
                    onClick={() =>
                      isUpcoming ? undefined : navigate(`/sessions/${session.id}/report`)
                    }
                  />
                  {isUpcoming && (
                    <div className="absolute bottom-3 right-3 flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/instructor/courses/${courseId}/schedule/${session.id}`)
                        }}
                        className="text-xs h-7 px-2"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteLecture(session)
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => startMutation.mutate(session.id)}
                        disabled={startMutation.isPending}
                        className="gradient-primary text-white text-xs h-7 px-2"
                      >
                        {startMutation.isPending ? 'Starting…' : 'Start'}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
