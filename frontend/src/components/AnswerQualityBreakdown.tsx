import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ReportQuestionOut } from '../types/api'

interface QualityRow {
  question: ReportQuestionOut
  ups: number
  downs: number
  total: number
  satisfactionPct: number
  tier: 'flagged' | 'mixed' | 'good'
}

function classifyTier(ups: number, downs: number, total: number): 'flagged' | 'mixed' | 'good' {
  if (total < 1) return 'good'
  const pct = ups / total
  if (pct < 0.5 && total >= 2) return 'flagged'
  if (pct < 0.8) return 'mixed'
  return 'good'
}

function DivergingBar({ ups, downs, total }: { ups: number; downs: number; total: number }) {
  const upPct = total > 0 ? Math.round((ups / total) * 100) : 0
  const downPct = total > 0 ? Math.round((downs / total) * 100) : 0
  return (
    <div className="flex-1 min-w-0">
      <div className="flex h-2 rounded-full overflow-hidden bg-muted gap-0.5">
        {upPct > 0 && (
          <div
            className="h-full rounded-l-full"
            style={{ width: `${upPct}%`, background: 'linear-gradient(90deg, #34d399, #10b981)' }}
          />
        )}
        {downPct > 0 && (
          <div
            className="h-full rounded-r-full"
            style={{ width: `${downPct}%`, background: 'linear-gradient(90deg, #f87171, #ef4444)' }}
          />
        )}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] text-muted-foreground">{total} votes</span>
        <span className="text-[10px] text-muted-foreground">{ups} agree · {downs} disagree</span>
      </div>
    </div>
  )
}

function QualityRow({ row }: { row: QualityRow }) {
  const pctColor =
    row.tier === 'flagged' ? 'text-red-600' :
    row.tier === 'mixed'   ? 'text-amber-600' :
    'text-emerald-600'

  const badge =
    row.tier === 'flagged' ? (
      <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0">
        Flagged
      </span>
    ) : row.tier === 'mixed' ? (
      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0">
        Review
      </span>
    ) : null

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0" style={{ maxWidth: '35%' }}>
        <p className="text-xs font-medium text-foreground truncate">{row.question.content}</p>
        <p className="text-[10px] text-muted-foreground">{row.question.category ?? 'Doubts'} · {row.question.anonymous_name}</p>
      </div>
      <DivergingBar ups={row.ups} downs={row.downs} total={row.total} />
      <div className="w-10 text-right flex-shrink-0">
        <span className={`text-sm font-bold ${pctColor}`}>{row.satisfactionPct}%</span>
      </div>
      <div className="w-16 flex-shrink-0">{badge}</div>
    </div>
  )
}

export default function AnswerQualityBreakdown({ questions }: { questions: ReportQuestionOut[] }) {
  const [showGood, setShowGood] = useState(false)

  const rows: QualityRow[] = questions
    .filter((q) => q.feedback && (q.feedback.thumbs_up + q.feedback.thumbs_down) > 0)
    .map((q) => {
      const ups = q.feedback!.thumbs_up
      const downs = q.feedback!.thumbs_down
      const total = ups + downs
      const satisfactionPct = total > 0 ? Math.round((ups / total) * 100) : 0
      return {
        question: q,
        ups,
        downs,
        total,
        satisfactionPct,
        tier: classifyTier(ups, downs, total),
      }
    })
    .sort((a, b) => a.satisfactionPct - b.satisfactionPct)

  const flagged = rows.filter((r) => r.tier === 'flagged')
  const mixed   = rows.filter((r) => r.tier === 'mixed')
  const good    = rows.filter((r) => r.tier === 'good')

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-5">
      <h3 className="text-sm font-semibold text-foreground mb-0.5">Answer Quality Breakdown</h3>
      <p className="text-xs text-muted-foreground mb-4">Student feedback on AI answers · sorted by agreement rate</p>

      {flagged.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2 pb-1.5 border-b border-border">
            Flagged · needs your attention
          </div>
          {flagged.map((r) => <QualityRow key={r.question.question_id} row={r} />)}
        </div>
      )}

      {mixed.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2 pb-1.5 border-b border-border">
            Mixed · worth reviewing
          </div>
          {mixed.map((r) => <QualityRow key={r.question.question_id} row={r} />)}
        </div>
      )}

      {good.length > 0 && (
        <div>
          <button
            onClick={() => setShowGood((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2 pb-1.5 border-b border-border w-full hover:opacity-70 transition-opacity"
          >
            Well received ({good.length})
            {showGood ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showGood && good.map((r) => <QualityRow key={r.question.question_id} row={r} />)}
        </div>
      )}

      <div className="flex gap-4 mt-4 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-6 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #34d399, #10b981)' }} />
          Positive feedback
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-6 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #f87171, #ef4444)' }} />
          Negative feedback
        </div>
      </div>
    </div>
  )
}
