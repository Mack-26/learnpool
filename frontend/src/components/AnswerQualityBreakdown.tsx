import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import type { ReportQuestionOut } from '../types/api'

/* Answer quality — one metric per row (share of thumbs-up) drawn as a single
   hue meter on a neutral track. Tier is a status chip (icon + label), never a
   bar colour. Leads with the answers students pushed back on (App UX rule 8). */

type Tier = 'flagged' | 'mixed' | 'good'

interface QualityRow {
  question: ReportQuestionOut
  ups: number
  downs: number
  total: number
  satisfactionPct: number
  tier: Tier
}

function classifyTier(ups: number, downs: number, total: number): Tier {
  if (total < 1) return 'good'
  if (downs > ups && total >= 2) return 'flagged'
  if (ups / total < 0.8) return 'mixed'
  return 'good'
}

function TierChip({ tier }: { tier: Tier }) {
  if (tier === 'flagged')
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap" style={{ color: 'var(--status-critical)' }}>
        <AlertTriangle className="h-3 w-3" aria-hidden /> Pushed back
      </span>
    )
  if (tier === 'mixed')
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap" style={{ color: 'var(--status-warning-text)' }}>
        <AlertTriangle className="h-3 w-3" aria-hidden style={{ color: 'var(--status-warning)' }} /> Mixed
      </span>
    )
  return null
}

function Meter({ pct, ups, downs }: { pct: number; ups: number; downs: number }) {
  return (
    <div className="relative group flex-1 min-w-[80px]" tabIndex={0}>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 bottom-full -translate-x-1/2 -translate-y-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity z-10"
        style={{ background: 'var(--dark)', color: 'hsl(var(--background))' }}
      >
        {ups} helpful · {downs} unhelpful
      </span>
      <span className="block h-[9px] rounded-[4px] overflow-hidden" style={{ background: 'var(--seq-none)' }}>
        <span className="block h-full rounded-r-[4px]" style={{ width: `${pct}%`, background: 'var(--chart-1)' }} />
      </span>
    </div>
  )
}

function Row({ row }: { row: QualityRow }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/60 last:border-0">
      <div className="min-w-0 basis-[38%] flex-shrink-0">
        <p className="text-xs font-medium text-foreground truncate">{row.question.content}</p>
        <p className="text-[10.5px] truncate" style={{ color: 'var(--ink-2)' }}>
          {row.question.category ?? 'Doubts'} · {row.question.anonymous_name}
        </p>
      </div>
      <Meter pct={row.satisfactionPct} ups={row.ups} downs={row.downs} />
      <span className="w-10 text-right text-sm font-semibold tabular-nums text-foreground flex-shrink-0">{row.satisfactionPct}%</span>
      <span className="w-[88px] flex-shrink-0"><TierChip tier={row.tier} /></span>
    </div>
  )
}

function QualityTable({ rows }: { rows: QualityRow[] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[520px] text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Question</th>
            <th className="text-right py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Helpful</th>
            <th className="text-right py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Unhelpful</th>
            <th className="text-right py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Share</th>
            <th className="text-left py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.question.question_id} className="border-b border-border/60 last:border-0">
              <td className="py-1.5 px-2 text-foreground truncate max-w-[280px]">{r.question.content}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-foreground">{r.ups}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-foreground">{r.downs}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-foreground">{r.satisfactionPct}%</td>
              <td className="py-1.5 px-2"><TierChip tier={r.tier} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AnswerQualityBreakdown({ questions }: { questions: ReportQuestionOut[] }) {
  const [showGood, setShowGood] = useState(false)
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const rows: QualityRow[] = questions
    .filter((q) => q.feedback && (q.feedback.thumbs_up + q.feedback.thumbs_down) > 0)
    .map((q) => {
      const ups = q.feedback!.thumbs_up
      const downs = q.feedback!.thumbs_down
      const total = ups + downs
      const satisfactionPct = total > 0 ? Math.round((ups / total) * 100) : 0
      return { question: q, ups, downs, total, satisfactionPct, tier: classifyTier(ups, downs, total) }
    })
    .sort((a, b) => a.satisfactionPct - b.satisfactionPct)

  const flagged = rows.filter((r) => r.tier === 'flagged')
  const mixed = rows.filter((r) => r.tier === 'mixed')
  const good = rows.filter((r) => r.tier === 'good')

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-[16px_18px] mb-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14.5px] font-semibold text-foreground">How answers landed</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>
            Share of students who marked each answer helpful · {rows.length} rated
          </p>
        </div>
        <button
          type="button"
          aria-pressed={view === 'table'}
          onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
          className="h-[27px] px-2.5 rounded-[7px] border border-border bg-card text-[11.5px] text-muted-foreground hover:bg-muted hover:border-input transition-colors flex-shrink-0"
        >
          {view === 'chart' ? 'Table' : 'Chart'}
        </button>
      </div>

      {view === 'table' ? (
        <div className="mt-4"><QualityTable rows={rows} /></div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[520px]">
            {flagged.length > 0 && (
              <div className="mb-3">
                <div className="mono text-[9.5px] tracking-[.09em] uppercase pb-1.5 border-b border-border" style={{ color: 'var(--status-critical)' }}>
                  Pushed back on · needs your attention
                </div>
                {flagged.map((r) => <Row key={r.question.question_id} row={r} />)}
              </div>
            )}

            {mixed.length > 0 && (
              <div className="mb-3">
                <div className="mono text-[9.5px] tracking-[.09em] uppercase pb-1.5 border-b border-border" style={{ color: 'var(--status-warning-text)' }}>
                  Mixed · worth a look
                </div>
                {mixed.map((r) => <Row key={r.question.question_id} row={r} />)}
              </div>
            )}

            {good.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowGood((v) => !v)}
                  className="flex items-center gap-1 w-full mono text-[9.5px] tracking-[.09em] uppercase pb-1.5 border-b border-border hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--ink-3)' }}
                >
                  Well received ({good.length})
                  {showGood ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
                </button>
                {showGood && good.map((r) => <Row key={r.question.question_id} row={r} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
