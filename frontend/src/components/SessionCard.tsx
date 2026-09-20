import StatusChip from './StatusChip'
import { normalizeStatus, OPEN_STATE, type LegacyCardStatus } from './cardStatus'

interface SessionCardProps {
  title: string
  /** "When" — already formatted by the caller (e.g. "Thu · 2:00 pm", "Oct 12", "Started 24 min ago"). */
  date: string
  status: LegacyCardStatus
  /** "What changed" — optional one-liner under the title. Omitted when the backend has nothing to say. */
  meta?: string
  onClick?: () => void
}

/**
 * One card system for every lecture (App UX rules 1–3).
 * Status is a chip. The live lecture differs by exactly one tinted surface and
 * one primary button; every other status gets a plain "Open" action.
 * Each card answers: what it is, when, is it open, and what changed.
 */
export default function SessionCard({ title, date, status, meta, onClick }: SessionCardProps) {
  const s = normalizeStatus(status)
  const isLive = s === 'active'

  const surface = isLive
    ? 'bg-accent border-[var(--ai-border)]'
    : 'bg-card border-border hover:border-input'
  const metaColor = isLive ? 'text-[var(--ai-meta)]' : 'text-[var(--ink-2)]'

  return (
    // The whole surface is clickable; the inner button is the keyboard/focus target.
    // Its click bubbles up here, so onClick fires exactly once either way.
    <div
      onClick={onClick}
      className={`group flex h-full min-h-[44px] cursor-pointer flex-col rounded-xl border px-4 py-4 text-left text-foreground transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:hover-shadow sm:px-[17px] ${surface}`}
    >
      {/* When + is it open */}
      <div className="flex items-center justify-between gap-3">
        <span className={`truncate text-[11.5px] ${metaColor}`}>{date}</span>
        <StatusChip status={s} />
      </div>

      {/* What it is */}
      <h3 className="mt-2 line-clamp-2 text-[15px] font-medium leading-[1.35] tracking-[-0.014em] text-foreground">
        {title}
      </h3>

      {/* Is it open · what changed */}
      <p className={`mt-2 text-xs leading-relaxed ${metaColor}`}>
        {OPEN_STATE[s]}
        {meta && <> · {meta}</>}
        {/* TODO(backend): last-seen — "3 new since you were here" goes here once per-user last-seen exists. */}
      </p>

      {/* One primary action per card */}
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
