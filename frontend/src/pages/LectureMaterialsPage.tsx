import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, ExternalLink, FileText, MessageCircle } from 'lucide-react'
import { getProfessorCourses, getSessionsWithDocuments as getProfessorSessionsWithDocs } from '../api/professor'
import { getCourses, getSessionsWithDocuments as getStudentSessionsWithDocs } from '../api/sessions'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/badge'

function toStatusBadge(status: string) {
  if (status === 'active') {
    return (
      <Badge variant="outline" className="text-xs bg-card border-border text-foreground font-medium inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--status-good)' }} />
        Live
      </Badge>
    )
  }
  if (status === 'upcoming') return <Badge variant="outline" className="text-xs bg-card border-border text-muted-foreground font-medium">Upcoming</Badge>
  return null
}

export default function LectureMaterialsPage() {
  const { user } = useAuthStore()
  const isProfessor = user?.role === 'professor'
  const navigate = useNavigate()

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: courses = [] } = useQuery({
    queryKey: isProfessor ? ['professor-courses'] : ['courses'],
    queryFn: isProfessor ? getProfessorCourses : getCourses,
  })

  const effectiveCourseId = selectedCourseId ?? courses[0]?.id

  const { data: sessionsWithDocs = [], isLoading } = useQuery({
    queryKey: ['sessions-with-documents', effectiveCourseId, isProfessor ? 'professor' : 'student'],
    queryFn: () =>
      isProfessor
        ? getProfessorSessionsWithDocs(effectiveCourseId!)
        : getStudentSessionsWithDocs(effectiveCourseId!),
    enabled: !!effectiveCourseId,
  })

  const handleOpenDoc = (doc: { url: string; filename: string; content?: string | null }) => {
    if (doc.url) {
      window.open(doc.url, '_blank', 'noopener,noreferrer')
    } else if (doc.content) {
      // Open inline text content in a new tab
      const blob = new Blob([doc.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    }
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Lecture Materials</h1>
        <p className="text-muted-foreground mb-6">
          View materials organized by scheduled lecture
        </p>

        {/* Course selector */}
        {courses.length > 0 && (
          <div className="mb-8">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Course</label>
            <div ref={dropdownRef} style={{ position: 'relative', maxWidth: 'min(320px, 100%)' }}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border bg-card transition-colors ${
                  dropdownOpen ? 'border-primary ring-2 ring-ring/15' : 'border-input hover:border-primary/50'
                }`}
              >
                <span className="text-sm font-medium text-foreground truncate">
                  {courses.find((c) => c.id === effectiveCourseId)?.name ?? 'Select a course'}
                </span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 ml-2 text-muted-foreground transition-transform duration-200"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.13 }}
                    className="absolute left-0 right-0 z-50 bg-card rounded-xl border border-border p-1.5 max-h-60 overflow-y-auto"
                    style={{ top: 'calc(100% + 0.4rem)', boxShadow: 'var(--shadow-elevated)' }}
                  >
                    {courses.map((c) => {
                      const active = c.id === effectiveCourseId
                      return (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCourseId(c.id); setDropdownOpen(false) }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border-0 text-left transition-colors ${
                            active ? 'bg-accent' : 'bg-transparent hover:bg-[var(--hover-row)]'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className={`text-sm m-0 truncate ${active ? 'font-semibold text-primary' : 'font-medium text-foreground'}`}>
                              {c.name}
                            </p>
                            {c.professor_name && !isProfessor && (
                              <p className="text-xs text-muted-foreground m-0 mt-0.5">{c.professor_name}</p>
                            )}
                          </div>
                          {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Sessions with documents */}
        {!effectiveCourseId ? (
          <p className="text-muted-foreground">No courses yet.</p>
        ) : isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : sessionsWithDocs.length === 0 ? (
          <p className="text-muted-foreground">
            {isProfessor
              ? 'No lectures yet. Schedule a lecture to add materials.'
              : 'No lectures yet. Materials will appear when your teaching assistant adds them.'}
          </p>
        ) : (
          <div className="space-y-6">
            {sessionsWithDocs.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{session.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {new Date(session.started_at).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {toStatusBadge(session.status)}
                    {!isProfessor && session.documents.length > 0 && (session.status === 'active' || session.status === 'released' || session.status === 'ended') && (
                      <button
                        onClick={() => navigate(`/sessions/${session.id}/chat`)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-80 border ${
                          session.status === 'active'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-primary border-border'
                        }`}
                      >
                        <MessageCircle className="h-3 w-3 shrink-0" />
                        Ask AI
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  {session.documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents attached</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {session.documents.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => handleOpenDoc(doc)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-[var(--chip)] hover:border-primary/40 hover:bg-accent transition-colors text-left"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">
                            {doc.filename}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
