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
  if (status === 'active') return <Badge className="text-xs border-0" style={{ background: '#dcfce7', color: '#166534' }}>● Live</Badge>
  if (status === 'upcoming') return <Badge variant="secondary" className="text-xs">Upcoming</Badge>
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
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.6rem 0.9rem', borderRadius: '0.6rem',
                  border: `1.5px solid ${dropdownOpen ? '#272757' : 'rgba(39,39,87,0.18)'}`,
                  background: '#fff', cursor: 'pointer', transition: 'border-color 0.15s',
                  boxShadow: dropdownOpen ? '0 0 0 3px rgba(39,39,87,0.08)' : 'none',
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {courses.find((c) => c.id === effectiveCourseId)?.name ?? 'Select a course'}
                </span>
                <ChevronDown
                  style={{
                    width: '1rem', height: '1rem', color: '#8686AC', flexShrink: 0, marginLeft: '0.5rem',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s',
                  }}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.13 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 0.4rem)', left: 0, right: 0, zIndex: 50,
                      background: '#fff', borderRadius: '0.75rem',
                      boxShadow: '0 8px 32px rgba(39,39,87,0.16), 0 1px 4px rgba(39,39,87,0.08)',
                      border: '1px solid rgba(39,39,87,0.1)', padding: '0.35rem',
                      maxHeight: '240px', overflowY: 'auto',
                    }}
                  >
                    {courses.map((c) => {
                      const active = c.id === effectiveCourseId
                      return (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCourseId(c.id); setDropdownOpen(false) }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: 'none',
                            background: active ? 'rgba(39,39,87,0.07)' : 'transparent',
                            cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(39,39,87,0.04)' }}
                          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500, color: active ? '#272757' : '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.name}
                            </p>
                            {c.professor_name && !isProfessor && (
                              <p style={{ fontSize: '0.72rem', color: '#8686AC', margin: '0.1rem 0 0' }}>{c.professor_name}</p>
                            )}
                          </div>
                          {active && <Check style={{ width: '0.85rem', height: '0.85rem', color: '#272757', flexShrink: 0 }} />}
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
              : 'No lectures yet. Materials will appear when your instructor adds them.'}
          </p>
        ) : (
          <div className="space-y-6">
            {sessionsWithDocs.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                className="rounded-xl border-2 border-border bg-card overflow-hidden"
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
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.3rem 0.7rem', borderRadius: '99px',
                          background: session.status === 'active' ? '#272757' : 'rgba(39,39,87,0.09)',
                          color: session.status === 'active' ? '#fff' : '#272757',
                          border: session.status === 'active' ? 'none' : '1.5px solid rgba(39,39,87,0.2)',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          whiteSpace: 'nowrap', transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                      >
                        <MessageCircle style={{ width: '0.75rem', height: '0.75rem', flexShrink: 0 }} />
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
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-accent/50 transition-colors text-left"
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
