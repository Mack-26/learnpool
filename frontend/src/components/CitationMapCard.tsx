import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { getSessionCitationMap } from '../api/professor'
import { getStudentCitationMap } from '../api/sessions'
import { useAuthStore } from '../store/authStore'
import type { DocumentCitationOut } from '../types/api'

/* Citation heat — sequential palette --seq-1…5 (light → dark), --seq-none for
   "not cited". Every cell carries a tooltip; the card has a Table toggle. */

const SEQ = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)']

function heat(count: number, max: number): string {
  if (count <= 0) return 'var(--seq-none)'
  const bin = Math.min(SEQ.length, Math.max(1, Math.ceil((count / max) * SEQ.length)))
  return SEQ[bin - 1]
}

interface PageCell {
  page: number | null
  count: number
  avg: number | null
}

/** Fills the page range 1..N (from page_count or the highest cited page) so uncited pages show as "not cited". */
function buildCells(doc: DocumentCitationOut): PageCell[] {
  const cited = new Map<number, { count: number; avg: number }>()
  for (const p of doc.pages) {
    if (p.page_number != null) cited.set(p.page_number, { count: p.citation_count, avg: p.avg_relevance })
  }
  const maxCited = Math.max(0, ...cited.keys())
  const pageCount = Math.max(doc.page_count ?? 0, maxCited)
  const cells: PageCell[] = []
  for (let i = 1; i <= pageCount; i++) {
    const c = cited.get(i)
    cells.push({ page: i, count: c?.count ?? 0, avg: c?.avg ?? null })
  }
  return cells
}

function Cell({ cell, max }: { cell: PageCell; max: number }) {
  const label = cell.count === 0
    ? `p. ${cell.page} · not cited`
    : `p. ${cell.page} · ${cell.count} citation${cell.count !== 1 ? 's' : ''}${cell.avg != null ? ` · ${Math.round(cell.avg * 100)}% match` : ''}`
  return (
    <span className="relative block group" tabIndex={0} aria-label={label}>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 bottom-full -translate-x-1/2 -translate-y-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity z-10"
        style={{ background: 'var(--dark)', color: 'hsl(var(--background))' }}
      >
        {label}
      </span>
      <span
        className="block h-[26px] rounded-[4px] transition-[filter] group-hover:brightness-95"
        style={{ background: heat(cell.count, max) }}
      />
    </span>
  )
}

function DocHeat({ doc, showName }: { doc: DocumentCitationOut; showName: boolean }) {
  const isInline = doc.pages.length === 1 && doc.pages[0].page_number === null
  const cells = isInline ? [] : buildCells(doc)
  const max = Math.max(1, ...cells.map((c) => c.count))
  const cols = Math.min(12, Math.max(1, cells.length))

  return (
    <div>
      {showName && (
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <FileText className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--ink-3)' }} aria-hidden />
          <span className="text-xs font-medium text-foreground truncate flex-1">{doc.filename}</span>
          <span className="text-[11px] tabular-nums flex-shrink-0" style={{ color: 'var(--ink-2)' }}>
            {doc.total_citations} citation{doc.total_citations !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {isInline ? (
        <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
          {doc.total_citations} citation{doc.total_citations !== 1 ? 's' : ''} · pasted text, no pages
        </p>
      ) : (
        <>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {cells.map((c) => <Cell key={c.page} cell={c} max={max} />)}
          </div>
          <div className="mt-2 flex items-center justify-between mono text-[10px]" style={{ color: 'var(--ink-3)' }}>
            <span>p.1</span>
            <span>p.{cells.length}</span>
          </div>
        </>
      )}
    </div>
  )
}

function HeatTable({ docs }: { docs: DocumentCitationOut[] }) {
  const rows = docs.flatMap((d) =>
    [...d.pages]
      .sort((a, b) => (a.page_number ?? Infinity) - (b.page_number ?? Infinity))
      .map((p) => ({
        key: `${d.document_id}-${p.page_number ?? 'doc'}`,
        file: d.filename,
        page: p.page_number != null ? `p. ${p.page_number}` : '—',
        count: p.citation_count,
        avg: `${Math.round(p.avg_relevance * 100)}%`,
      })),
  )
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[360px] text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Material</th>
            <th className="text-left py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Page</th>
            <th className="text-right py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Citations</th>
            <th className="text-right py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Avg match</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-border/60 last:border-0">
              <td className="py-1.5 px-2 text-foreground truncate max-w-[200px]">{r.file}</td>
              <td className="py-1.5 px-2 text-foreground mono">{r.page}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-foreground">{r.count}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-foreground">{r.avg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface CitationMapCardProps {
  sessionId: string
  /** Shown in the subtitle when the card sits on a course-level board. */
  lectureTitle?: string
}

export default function CitationMapCard({ sessionId, lectureTitle }: CitationMapCardProps) {
  const role = useAuthStore((s) => s.user?.role)
  const isProfessor = role === 'professor'
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['citation-map', sessionId],
    queryFn: () => isProfessor ? getSessionCitationMap(sessionId) : getStudentCitationMap(sessionId),
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 h-full">
        <div className="h-4 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  const totalCitations = docs.reduce((n, d) => n + d.total_citations, 0)
  const pagedDocs = docs.filter((d) => !(d.pages.length === 1 && d.pages[0].page_number === null))
  const citedPages = pagedDocs.reduce((n, d) => n + d.pages.filter((p) => p.citation_count > 0).length, 0)
  const maxCount = Math.max(1, ...docs.flatMap((d) => d.pages.map((p) => p.citation_count)))

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-[16px_18px] h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-semibold text-foreground">Which pages they asked about</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>
            {docs.length === 0
              ? 'Citations appear once questions are answered'
              : `${lectureTitle ? `${lectureTitle} · ` : ''}${totalCitations} citation${totalCitations !== 1 ? 's' : ''}${citedPages > 0 ? ` across ${citedPages} page${citedPages !== 1 ? 's' : ''}` : ''}`}
          </p>
        </div>
        {docs.length > 0 && (
          <button
            type="button"
            aria-pressed={view === 'table'}
            onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
            className="h-[27px] px-2.5 rounded-[7px] border border-border bg-card text-[11.5px] text-muted-foreground hover:bg-muted hover:border-input transition-colors flex-shrink-0"
          >
            {view === 'chart' ? 'Table' : 'Chart'}
          </button>
        )}
      </div>

      {docs.length === 0 && (
        <p className="mt-6 text-xs text-center py-4" style={{ color: 'var(--ink-2)' }}>No citation data yet.</p>
      )}

      {docs.length > 0 && view === 'table' && <div className="mt-4"><HeatTable docs={docs} /></div>}

      {docs.length > 0 && view === 'chart' && (
        <>
          <div className="mt-4 flex flex-col gap-4">
            {docs.map((doc) => <DocHeat key={doc.document_id} doc={doc} showName={docs.length > 1} />)}
          </div>

          <div className="mt-auto pt-3.5 flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'var(--ink-2)' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-[13px] h-[13px] rounded-[3px] border border-border" style={{ background: 'var(--seq-none)' }} />
              not cited
            </span>
            <span className="inline-flex items-center gap-1">
              <span>1</span>
              {SEQ.map((c) => <span key={c} className="w-[13px] h-[13px] rounded-[3px]" style={{ background: c }} />)}
              <span>{maxCount} citation{maxCount !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </>
      )}
    </div>
  )
}
