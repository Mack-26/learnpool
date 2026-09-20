import type { CitationOut } from '../types/api'

interface Props {
  citation: CitationOut
  /** Called when the reader wants to open the cited material. Omitted → no link shown. */
  onOpen?: (citation: CitationOut) => void
}

/**
 * One source under an answer: `[n] · filename · Page p`, the match percentage,
 * and the passage itself. App UX rule 4 — the first one sits open under the answer.
 */
export default function CitationCard({ citation, onOpen }: Props) {
  const excerpt = citation.content.length > 260
    ? citation.content.slice(0, 260).trimEnd() + '…'
    : citation.content
  const matchPct = Math.round(citation.relevance_score * 100)
  const label = [
    `[${citation.citation_order}]`,
    citation.filename || 'Source',
    citation.page_number != null ? `Page ${citation.page_number}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div
      className="rounded-[9px] border bg-card px-[15px] py-[13px]"
      style={{ borderColor: 'var(--ai-border)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-xs font-semibold text-accent-foreground">{label}</span>
        <span className="flex shrink-0 items-center gap-2.5 text-xs" style={{ color: 'var(--ink-2)' }}>
          <span className="tabular-nums">{matchPct}% match</span>
          {onOpen && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpen(citation) }}
              className="text-primary hover:underline"
            >
              Open{citation.page_number != null ? ` page ${citation.page_number}` : ''}
            </button>
          )}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-[1.6]" style={{ color: 'var(--ai-text)' }}>
        “{excerpt}”
      </p>
    </div>
  )
}
