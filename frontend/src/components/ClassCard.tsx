import StatusChip from './StatusChip'
import { normalizeStatus, type LegacyCardStatus } from './cardStatus'

interface ClassCardProps {
  name: string
  professor?: string
  /** Optional. CourseOut carries no live state, so most callers omit this and the card shows no chip. */
  status?: LegacyCardStatus
  /** Number of lectures (sessions) in the course. */
  sessionCount?: number
  /** @deprecated legacy alias for sessionCount — existing callers pass course.session_count here. */
  students?: number
  onClick?: () => void
}

/**
 * Same card language as SessionCard: hairline surface, quiet meta, one plain
 * "Open" action. A live chip appears only when a caller knows the class is live.
 */
export default function ClassCard({ name, professor, status, sessionCount, students, onClick }: ClassCardProps) {
  const s = status ? normalizeStatus(status) : null
  const isLive = s === 'active'
  const count = sessionCount ?? students

  const surface = isLive
    ? 'bg-accent border-[var(--ai-border)]'
    : 'bg-card border-border hover:border-input'
  const metaColor = isLive ? 'text-[var(--ai-meta)]' : 'text-[var(--ink-2)]'

  const metaParts: string[] = []
  if (professor) metaParts.push(professor)
  if (typeof count === 'number') metaParts.push(`${count} ${count === 1 ? 'lecture' : 'lectures'}`)

  return (
    // Whole surface clickable; the inner button is the focus target and its click bubbles here.
    <div
      onClick={onClick}
      className={`group flex h-full min-h-[44px] cursor-pointer flex-col rounded-xl border px-4 py-4 text-left text-foreground transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:hover-shadow sm:px-[17px] ${surface}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="mono text-[9.5px] uppercase tracking-[0.09em] text-[var(--ink-3)]">Course</span>
        {isLive && <StatusChip status={s} />}
      </div>

      <h3 className="mt-2 line-clamp-2 text-[15px] font-medium leading-[1.35] tracking-[-0.014em] text-foreground">
        {name}
      </h3>

      {metaParts.length > 0 && (
        <p className={`mt-2 truncate text-xs leading-relaxed ${metaColor}`}>{metaParts.join(' · ')}</p>
      )}
      {/* TODO(backend): last-seen — "2 new" since you were here goes here once per-user last-seen exists. */}

      <div className="mt-auto pt-3">
        {isLive ? (
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-[9px] bg-primary px-[18px] text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ask a question
          </button>
        ) : (
          <button
            type="button"
            className="-mb-2 -ml-2 inline-flex min-h-[44px] items-center gap-1 rounded-md px-2 text-[12.5px] font-medium text-primary transition-colors hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        )}
      </div>
    </div>
  )
}
