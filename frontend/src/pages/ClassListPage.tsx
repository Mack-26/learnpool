import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { getCourses, joinCourseByCode } from '../api/sessions'
import DashboardLayout from '@/components/DashboardLayout'
import ClassCard from '@/components/ClassCard'
import { Button } from '@/components/ui/button'

export default function ClassListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [joinOpen, setJoinOpen] = useState(false)
  const [code, setCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  const joinMutation = useMutation({
    mutationFn: (inviteCode: string) => joinCourseByCode(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setCode('')
      setJoinOpen(false)
      setJoinError(null)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) setJoinError('Invalid course code — check with your teaching assistant.')
      else if (status === 409) setJoinError('You are already enrolled in this course.')
      else setJoinError('Something went wrong. Please try again.')
    },
  })

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setJoinError(null)
    joinMutation.mutate(code.trim())
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[25px] font-semibold tracking-[-0.024em] text-foreground">My Classes</h1>
            <p className="mt-1.5 text-[13px] text-[var(--ink-2)]">Open a class to see its lectures</p>
          </div>
          <Button
            variant="outline"
            onClick={() => { setJoinOpen(true); setJoinError(null) }}
            className="min-h-11 shrink-0 gap-1.5 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            Join a Course
          </Button>
        </div>

        {/* Join Course modal */}
        {joinOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setJoinOpen(false); setCode(''); setJoinError(null) }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground">Join a Course</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => { setJoinOpen(false); setCode(''); setJoinError(null) }}
                  className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Enter the invite code shared by your teaching assistant.</p>
              <form onSubmit={handleJoin} className="space-y-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A3F8B2C1"
                  maxLength={20}
                  className="mono w-full min-h-11 rounded-lg border border-border bg-background px-3 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
                {joinError && (
                  <p className="text-xs text-destructive">{joinError}</p>
                )}
                <Button type="submit" className="w-full min-h-11" disabled={!code.trim() || joinMutation.isPending}>
                  {joinMutation.isPending ? 'Joining…' : 'Join Course'}
                </Button>
              </form>
            </motion.div>
          </div>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Loading classes…</p>}
        {error && <p className="text-sm text-destructive">Failed to load classes.</p>}
        {courses && courses.length === 0 && (
          <p className="text-sm text-muted-foreground">You are not enrolled in any classes yet. Use "Join a Course" to get started.</p>
        )}

        {/* TODO(backend): last-seen — "2 new" per class needs a per-user last-seen timestamp. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {courses?.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.35 }}
            >
              <ClassCard
                name={course.name}
                professor={course.professor_name}
                sessionCount={course.session_count}
                onClick={() => navigate(`/classes/${course.id}`)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
