import { AlertTriangle } from 'lucide-react'
import type { StudentActivityItem } from '../types/api'

/* Per-student participation for one lecture. Participation numbers are the
   professor's view (App UX rule 9). Counts are plain tabular numerals; the only
   colour is the reserved status chip for students who did not ask. */

function Num({ value }: { value: number }) {
  if (!value) return <span className="text-xs" style={{ color: 'var(--ink-3)' }}>—</span>
  return <span className="tabular-nums text-[13px] text-foreground">{value}</span>
}

export default function StudentActivityTable({ data }: { data: StudentActivityItem[] }) {
  if (data.length === 0) return null

  const silent = data.filter((s) => s.question_count === 0).length

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-[16px_18px] mb-5">
      <h2 className="text-[14.5px] font-semibold text-foreground">Who took part</h2>
      <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>
        {data.length} student{data.length !== 1 ? 's' : ''} this lecture{silent > 0 ? ` · ${silent} did not ask` : ''}
      </p>

      <div className="mt-3 overflow-x-auto -mx-1">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 mono text-[9.5px] tracking-[.09em] uppercase font-normal" style={{ color: 'var(--ink-3)' }}>Student</th>
              <th className="text-right py-2 px-2 mono text-[9.5px] tracking-[.09em] uppercase font-normal" style={{ color: 'var(--ink-3)' }}>Questions</th>
              <th className="text-right py-2 px-2 mono text-[9.5px] tracking-[.09em] uppercase font-normal" style={{ color: 'var(--ink-3)' }}>Forks</th>
              <th className="text-right py-2 px-2 mono text-[9.5px] tracking-[.09em] uppercase font-normal" style={{ color: 'var(--ink-3)' }}>Comments</th>
              <th className="text-right py-2 px-2 mono text-[9.5px] tracking-[.09em] uppercase font-normal" style={{ color: 'var(--ink-3)' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map((student, i) => (
              <tr key={student.student_id} className="border-b border-border/60 last:border-0 hover:bg-[var(--hover-row)] transition-colors">
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-6 w-6 rounded-full bg-secondary text-foreground text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                      {student.display_name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-[13px] font-medium text-foreground truncate">{student.display_name}</span>
                    {student.question_count === 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap" style={{ color: 'var(--status-warning-text)' }}>
                        <AlertTriangle className="h-3 w-3" aria-hidden style={{ color: 'var(--status-warning)' }} /> Did not ask
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2 text-right"><Num value={student.question_count} /></td>
                <td className="py-2 px-2 text-right"><Num value={student.fork_count} /></td>
                <td className="py-2 px-2 text-right"><Num value={student.comment_count} /></td>
                <td className="py-2 px-2 text-right whitespace-nowrap">
                  <span className="tabular-nums text-[13px] font-semibold text-foreground">{student.score}</span>
                  <span className="ml-1.5 mono text-[10px]" style={{ color: 'var(--ink-3)' }}>#{i + 1}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px]" style={{ color: 'var(--ink-3)' }}>
        Score weighs questions, forks and comments.
      </p>
    </div>
  )
}
