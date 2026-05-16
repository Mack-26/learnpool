import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getCourseClassmates, getCourses } from '../api/sessions'
import CourseLayout from '@/components/CourseLayout'

export default function ClassmatesPage() {
  const { courseId } = useParams<{ courseId: string }>()

  const { data: classmates = [], isLoading } = useQuery({
    queryKey: ['classmates', courseId],
    queryFn: () => getCourseClassmates(courseId!),
    enabled: !!courseId,
  })

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  const courseName = courses?.find((c) => c.id === courseId)?.name

  const professors = classmates.filter((c) => c.role === 'professor')
  const students = classmates.filter((c) => c.role === 'student')

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
        <h2 className="text-lg font-semibold text-foreground mb-1">People</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {isLoading ? 'Loading…' : `${classmates.length} member${classmates.length !== 1 ? 's' : ''}`}
        </p>

        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="space-y-6">
            {professors.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Instructor{professors.length > 1 ? 's' : ''} ({professors.length})
                </h3>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  {professors.map((person, i) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-center gap-3 px-4 py-3 ${i < professors.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                        style={{ background: 'linear-gradient(135deg, #272757 0%, #505081 100%)', color: '#fff' }}>
                        {person.display_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{person.display_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Instructor
                      </span>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {students.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Students ({students.length})
                </h3>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  {students.map((person, i) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.03 }}
                      className={`flex items-center gap-3 px-4 py-3 ${i < students.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold text-muted-foreground">
                        {person.display_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{person.display_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        Student
                      </span>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {classmates.length === 0 && (
              <p className="text-sm text-muted-foreground">No one here yet.</p>
            )}
          </div>
        )}
      </motion.div>
    </CourseLayout>
  )
}
