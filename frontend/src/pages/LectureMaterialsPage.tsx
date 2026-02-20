import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Eye, X, ChevronDown } from 'lucide-react'
import { getProfessorCourses, getSessionsWithDocuments } from '../api/professor'
import DashboardLayout from '@/components/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import type { DocumentOut } from '../types/api'

function toStatusBadge(status: string) {
  if (status === 'active') return <Badge className="gradient-primary text-white border-0 text-xs">● Live</Badge>
  if (status === 'upcoming') return <Badge variant="secondary" className="text-xs">Upcoming</Badge>
  return <Badge variant="outline" className="text-xs text-muted-foreground">Past</Badge>
}

export default function LectureMaterialsPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [viewingDoc, setViewingDoc] = useState<DocumentOut | null>(null)

  const { data: courses = [] } = useQuery({
    queryKey: ['professor-courses'],
    queryFn: getProfessorCourses,
  })

  const effectiveCourseId = selectedCourseId ?? courses[0]?.id

  const { data: sessionsWithDocs = [], isLoading } = useQuery({
    queryKey: ['sessions-with-documents', effectiveCourseId],
    queryFn: () => getSessionsWithDocuments(effectiveCourseId!),
    enabled: !!effectiveCourseId,
  })

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
        <div className="mb-8">
          <label className="block text-sm font-medium text-foreground mb-2">Course</label>
          <div className="relative max-w-xs">
            <select
              value={effectiveCourseId ?? ''}
              onChange={(e) => setSelectedCourseId(e.target.value || null)}
              className="w-full px-4 py-2.5 pr-10 rounded-lg border border-border bg-background text-sm appearance-none cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Sessions with documents */}
        {!effectiveCourseId ? (
          <p className="text-muted-foreground">No courses yet.</p>
        ) : isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : sessionsWithDocs.length === 0 ? (
          <p className="text-muted-foreground">
            No lectures yet. Schedule a lecture to add materials.
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
                  {toStatusBadge(session.status)}
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
                          onClick={() => setViewingDoc(doc)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-accent/50 transition-colors text-left"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {doc.filename}
                          </span>
                          <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Document viewer modal */}
        {viewingDoc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setViewingDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-card border-2 border-border rounded-xl shadow-xl w-full max-h-[90vh] flex flex-col ${
                viewingDoc.url && viewingDoc.filename.toLowerCase().endsWith('.pdf')
                  ? 'max-w-4xl'
                  : 'max-w-2xl'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <h3 className="font-semibold text-foreground truncate flex-1 mr-4">
                  {viewingDoc.filename}
                </h3>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {viewingDoc.url && viewingDoc.filename.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={viewingDoc.url}
                    className="flex-1 w-full min-h-[400px] border-0"
                    title={viewingDoc.filename}
                  />
                ) : viewingDoc.content ? (
                  <div className="flex-1 overflow-y-auto p-4">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                      {viewingDoc.content}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-muted-foreground text-sm">
                      No preview available for this document.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
