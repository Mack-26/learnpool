import type { StudentActivityItem } from '../types/api'

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-pink-500', 'bg-amber-500', 'bg-slate-500', 'bg-sky-500', 'bg-rose-500',
]

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-500'
}

function Chip({ value, color }: { value: number; color: string }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${color}`}>
      {value}
    </span>
  )
}

export default function StudentActivityTable({ data }: { data: StudentActivityItem[] }) {
  if (data.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-5">
      <h3 className="text-sm font-semibold text-foreground mb-0.5">Student Activity</h3>
      <p className="text-xs text-muted-foreground mb-4">Participation breakdown per student this lecture</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Questions</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Forks</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comments</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map((student, i) => (
              <tr key={student.student_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors last:border-0">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {student.display_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground text-sm">{student.display_name}</span>
                    {student.question_count === 0 && (
                      <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-md font-medium">Silent</span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <Chip value={student.question_count} color="bg-violet-100 text-violet-700" />
                </td>
                <td className="py-2.5 px-3">
                  <Chip value={student.fork_count} color="bg-sky-100 text-sky-700" />
                </td>
                <td className="py-2.5 px-3">
                  <Chip value={student.comment_count} color="bg-emerald-100 text-emerald-700" />
                </td>
                <td className="py-2.5 px-3">
                  <span className={`font-bold text-sm ${scoreColor(student.score)}`}>
                    {student.score}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">#{i + 1}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-3 italic">
        Score = weighted composite of questions, forks, and comments
      </p>
    </div>
  )
}
