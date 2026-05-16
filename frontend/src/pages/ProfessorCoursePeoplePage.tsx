import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Copy, RefreshCw, Check } from 'lucide-react'
import {
  getProfessorCourses,
  getCourseInviteCode,
  regenerateCourseInviteCode,
  getCourseStudents,
} from '../api/professor'
import CourseLayout from '@/components/CourseLayout'
import { Button } from '@/components/ui/button'

export default function ProfessorCoursePeoplePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)

  const { data: courses } = useQuery({
    queryKey: ['professor-courses'],
    queryFn: getProfessorCourses,
  })
  const courseName = courses?.find((c) => c.id === courseId)?.name

  const { data: inviteData, refetch: refetchInvite } = useQuery({
    queryKey: ['invite-code', courseId],
    queryFn: () => getCourseInviteCode(courseId!),
    enabled: !!courseId,
  })

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['course-students', courseId],
    queryFn: () => getCourseStudents(courseId!),
    enabled: !!courseId,
  })

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateCourseInviteCode(courseId!),
    onSuccess: () => {
      refetchInvite()
      queryClient.invalidateQueries({ queryKey: ['invite-code', courseId] })
      setConfirmRegenerate(false)
    },
  })

  const handleCopy = () => {
    if (inviteData?.invite_code) {
      navigator.clipboard.writeText(inviteData.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <CourseLayout
      courseId={courseId!}
      courseName={courseName}
      backPath="/instructor"
      backLabel="All Courses"
      navItems={[
        { label: 'Lectures', path: `/instructor/courses/${courseId}` },
        { label: 'People', path: `/instructor/courses/${courseId}/people` },
      ]}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-1">People</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {isLoading ? 'Loading…' : `${students.length} student${students.length !== 1 ? 's' : ''} enrolled`}
        </p>

        {/* Invite code */}
        {inviteData && (
          <div className="rounded-xl border border-border bg-card p-4 mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Course Invite Code</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-2xl font-bold tracking-widest text-primary select-all">
                {inviteData.invite_code}
              </span>
              <Button size="sm" variant="outline" onClick={handleCopy} className="h-8 px-2">
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              {confirmRegenerate ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Regenerate?</span>
                  <Button size="sm" variant="destructive" className="h-7 text-xs px-2"
                    onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending}>
                    Yes
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                    onClick={() => setConfirmRegenerate(false)}>
                    No
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground"
                  onClick={() => setConfirmRegenerate(true)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Share this code with students to let them join</p>
          </div>
        )}

        {/* Student roster */}
        {isLoading && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
          </div>
        )}

        {!isLoading && students.length === 0 && (
          <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
        )}

        {!isLoading && students.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {students.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 px-4 py-3 ${i < students.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold text-muted-foreground">
                  {s.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium shrink-0">
                  Student
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </CourseLayout>
  )
}
