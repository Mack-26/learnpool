import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCourses } from '../api/sessions'
import DashboardLayout from '@/components/DashboardLayout'
import ClassCard from '@/components/ClassCard'

export default function ClassListPage() {
  const navigate = useNavigate()

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">My Classes</h1>
        <p className="text-muted-foreground mb-6">Select a class to view its lectures</p>

        {isLoading && (
          <p className="text-muted-foreground">Loading classes…</p>
        )}
        {error && (
          <p className="text-destructive text-sm">Failed to load classes.</p>
        )}
        {courses && courses.length === 0 && (
          <p className="text-muted-foreground">You are not enrolled in any classes yet.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                status="past"
                students={course.session_count}
                onClick={() => navigate(`/classes/${course.id}`)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
