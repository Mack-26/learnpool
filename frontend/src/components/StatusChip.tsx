import { normalizeStatus, STATUS_LABEL, type LegacyCardStatus } from './cardStatus'

interface StatusChipProps {
  status: LegacyCardStatus
  className?: string
}

/**
 * Status is a chip, never a repainted card (App UX rule 1). Only the live
 * state gets a filled chip; everything else is quiet meta text.
 */
export default function StatusChip({ status, className = '' }: StatusChipProps) {
  const s = normalizeStatus(status)

  if (s === 'active') {
    return (
      <span
        className={`inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground ${className}`}
      >
        <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-[var(--seq-1)]" />
        {STATUS_LABEL[s]}
      </span>
    )
  }

  return (
    <span className={`shrink-0 text-[11.5px] text-[var(--ink-3)] ${className}`}>
      {STATUS_LABEL[s]}
    </span>
  )
}
