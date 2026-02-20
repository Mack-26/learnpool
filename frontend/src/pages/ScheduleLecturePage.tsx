import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, MapPin, FileText, Plus, Upload } from 'lucide-react'
import {
  getCourseDocuments,
  getSessionDetail,
  scheduleLecture,
  updateSession,
  addDocument,
  uploadDocument,
} from '../api/professor'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'

function formatDateForInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatTimeForInput(d: Date): string {
  return d.toTimeString().slice(0, 5)
}

export default function ScheduleLecturePage() {
  const { courseId, sessionId } = useParams<{ courseId: string; sessionId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const now = new Date()
  const isEdit = !!sessionId

  const [title, setTitle] = useState(`lecture ${formatDateForInput(now)}`)
  const [scheduledDate, setScheduledDate] = useState(formatDateForInput(now))
  const [scheduledTime, setScheduledTime] = useState(formatTimeForInput(now))
  const [location, setLocation] = useState('')
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [docMode, setDocMode] = useState<'text' | 'file'>('text')
  const [docTitle, setDocTitle] = useState('')
  const [docContent, setDocContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pendingDocs, setPendingDocs] = useState<Array<{ type: 'text'; title: string; content: string } | { type: 'file'; file: File; title: string }>>([])

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session-detail', sessionId],
    queryFn: () => getSessionDetail(sessionId!),
    enabled: isEdit && !!sessionId,
  })

  useEffect(() => {
    if (session) {
      setTitle(session.title)
      const d = new Date(session.scheduled_at || session.started_at)
      setScheduledDate(formatDateForInput(d))
      setScheduledTime(formatTimeForInput(d))
      setLocation(session.location || '')
      setSelectedDocIds(session.document_ids || [])
    }
  }, [session])

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['course-documents', courseId],
    queryFn: () => getCourseDocuments(courseId!),
    enabled: !!courseId,
  })

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (isEdit && sessionId) {
        const session = await updateSession(sessionId, {
          title: title.trim(),
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          location: location.trim(),
          document_ids: selectedDocIds,
        })
        return { session, isEdit: true }
      }
      const session = await scheduleLecture(courseId!, {
        title: title.trim(),
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        location: location.trim(),
        document_ids: selectedDocIds,
      })
      return { session, isEdit: false }
    },
    onSuccess: async (result) => {
      const sessionIdToUse = result.session.id
      const ids = [sessionIdToUse]

      for (const doc of pendingDocs) {
        if (doc.type === 'text') {
          await addDocument(courseId!, {
            title: doc.title,
            content: doc.content,
            session_ids: ids,
          })
        } else {
          await uploadDocument(courseId!, doc.file, doc.title || doc.file.name, ids)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['professor-sessions', courseId] })
      queryClient.invalidateQueries({ queryKey: ['course-documents', courseId] })
      navigate(`/instructor/courses/${courseId}`, {
        state: { successMessage: result.isEdit ? 'Lecture updated successfully.' : 'Future lecture scheduled successfully.' },
      })
    },
  })

  const toggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    )
  }

  const addDocMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No session')
      if (docMode === 'text' && docTitle.trim() && docContent.trim().length >= 10) {
        return addDocument(courseId!, {
          title: docTitle.trim(),
          content: docContent.trim(),
          session_ids: [sessionId],
        })
      }
      if (docMode === 'file' && selectedFile) {
        return uploadDocument(
          courseId!,
          selectedFile,
          docTitle.trim() || selectedFile.name,
          [sessionId]
        )
      }
      throw new Error('Invalid document')
    },
    onSuccess: (doc) => {
      setSelectedDocIds((prev) => [...prev, doc.id])
      setDocTitle('')
      setDocContent('')
      setSelectedFile(null)
      setShowAddDoc(false)
      queryClient.invalidateQueries({ queryKey: ['course-documents', courseId] })
    },
  })

  const handleAddDoc = () => {
    if (isEdit && sessionId) {
      addDocMutation.mutate()
    } else {
      if (docMode === 'text' && docTitle.trim() && docContent.trim().length >= 10) {
        setPendingDocs((prev) => [...prev, { type: 'text', title: docTitle.trim(), content: docContent.trim() }])
      } else if (docMode === 'file' && selectedFile) {
        setPendingDocs((prev) => [...prev, { type: 'file', file: selectedFile, title: docTitle.trim() || selectedFile.name }])
      }
      setDocTitle('')
      setDocContent('')
      setSelectedFile(null)
      setShowAddDoc(false)
    }
  }

  const removePendingDoc = (index: number) => {
    setPendingDocs((prev) => prev.filter((_, i) => i !== index))
  }

  const canAddDoc =
    (docMode === 'text' && docTitle.trim() && docContent.trim().length >= 10) ||
    (docMode === 'file' && selectedFile)
  const canSubmit = title.trim().length > 0
  const isLoading = (isEdit && sessionLoading) || docsLoading

  if (isEdit && sessionLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-xl">
          <p className="text-muted-foreground">Loading lecture…</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl"
      >
        <button
          onClick={() => navigate(`/instructor/courses/${courseId}`)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Lectures
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">
          {isEdit ? 'Edit Lecture' : 'Schedule Lecture'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isEdit
            ? 'Update the date, time, location, and materials for your scheduled lecture'
            : 'Set the date, time, location, and materials for your lecture'}
        </p>

        <div className="space-y-6 p-6 rounded-xl border-2 border-border bg-card">
          {/* Lecture title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Lecture title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. lecture 2025-02-20"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>

          {/* Date & time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="h-4 w-4 inline mr-1.5" />
                Lecture date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => {
                  const d = e.target.value
                  setScheduledDate(d)
                  if (!isEdit) setTitle(`lecture ${d}`)
                }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Lecture time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <MapPin className="h-4 w-4 inline mr-1.5" />
              Lecture location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Room 101, Building A"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>

          {/* Lecture documents */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <FileText className="h-4 w-4 inline mr-1.5" />
              Lecture materials
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Select existing documents or add new ones. Students will see them when the lecture is active.
            </p>

            {/* Select existing */}
            {docsLoading ? (
              <p className="text-sm text-muted-foreground mb-3">Loading documents…</p>
            ) : documents.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {documents.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={() => toggleDoc(doc.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{doc.filename}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {/* Pending (new) docs */}
            {pendingDocs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {pendingDocs.map((doc, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-accent text-sm"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {doc.type === 'text' ? doc.title : doc.file.name}
                    <button
                      type="button"
                      onClick={() => removePendingDoc(i)}
                      className="text-muted-foreground hover:text-foreground ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add new document */}
            {!showAddDoc ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDoc(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add document (paste or upload)
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
              >
                <div className="flex gap-2">
                  <Button
                    variant={docMode === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDocMode('text')}
                    className={docMode === 'text' ? 'gradient-primary text-white' : ''}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Paste text
                  </Button>
                  <Button
                    variant={docMode === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDocMode('file')}
                    className={docMode === 'file' ? 'gradient-primary text-white' : ''}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload file
                  </Button>
                </div>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Title (e.g. Lecture 1 — Introduction)"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
                {docMode === 'text' ? (
                  <textarea
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Paste content… (min 10 characters)"
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-y"
                  />
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    />
                    {selectedFile ? (
                      <span className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedFile.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Upload className="h-5 w-5" />
                        Click to select PDF, TXT, or DOCX
                      </span>
                    )}
                  </label>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddDoc}
                    disabled={!canAddDoc || addDocMutation.isPending}
                    className="gradient-primary text-white"
                  >
                    {addDocMutation.isPending ? 'Adding…' : 'Add to lecture'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddDoc(false)
                      setDocTitle('')
                      setDocContent('')
                      setSelectedFile(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => scheduleMutation.mutate()}
              disabled={!canSubmit || scheduleMutation.isPending || isLoading}
              className="gradient-primary text-white"
            >
              {scheduleMutation.isPending
                ? isEdit
                  ? 'Saving…'
                  : 'Scheduling…'
                : isEdit
                  ? 'Save Changes'
                  : 'Schedule Lecture'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/instructor/courses/${courseId}`)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
