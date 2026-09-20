import { useState } from 'react'
import { Bookmark, Check, Copy, EyeOff, RefreshCw, Share2, ThumbsDown, ThumbsUp } from 'lucide-react'
import type { CitationOut, QuestionOut } from '../types/api'
import { renderAnswerWithCitations } from './AnswerRenderer'
import CitationCard from './CitationCard'

// ─── small helpers ─────────────────────────────────────────────────────────────

/** The Horizon mark: a horizon line with an arc rising over it. */
export function HorizonMark({ muted = false, size = 14 }: { muted?: boolean; size?: number }) {
  const stroke = muted ? 'var(--ink-2)' : 'hsl(var(--primary))'
  return (
    <svg width={size} height={size} viewBox="0 0 19 19" aria-hidden="true">
      <path d="M1.4 13.2h16.2" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M4.2 13.2a5.3 5.3 0 0 1 10.6 0" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}

/** Unique material names behind a set of citations, in citation order. */
function sourceNames(citations: CitationOut[]): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const c of [...citations].sort((a, b) => a.citation_order - b.citation_order)) {
    const n = c.filename || 'a source'
    if (!seen.has(n)) { seen.add(n); names.push(n) }
  }
  return names
}

function joinNames(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

const ghostBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border bg-card text-[12.5px] transition-colors hover:bg-secondary disabled:opacity-50'

// ─── Question card ─────────────────────────────────────────────────────────────

export function QuestionCard({
  content,
  initials,
  askedAt,
  anonymous,
  pending = false,
}: {
  content: string
  initials: string
  askedAt?: string
  anonymous: boolean
  pending?: boolean
}) {
  return (
    <article className="rounded-xl border border-border bg-card px-[19px] py-4 max-md:px-[14px] max-md:py-[13px]">
      <div className="flex items-center gap-2.5 text-xs" style={{ color: 'var(--ink-2)' }}>
        <span
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground max-md:h-[22px] max-md:w-[22px] max-md:text-[9px]"
          style={{ background: 'var(--dark)' }}
          aria-hidden="true"
        >
          {anonymous ? '?' : initials}
        </span>
        <span className="text-[13.5px] font-semibold text-foreground max-md:text-[12.5px]">You</span>
        <span>{pending ? 'just now' : askedAt ? `asked · ${timeAgo(askedAt)}` : ''}</span>
        {anonymous && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[11.5px]" style={{ background: 'var(--chip)', color: 'var(--ink-2)' }}>
            <EyeOff className="h-3 w-3" /> Anonymous
          </span>
        )}
      </div>
      <p className="mt-[11px] text-[17px] leading-[1.45] tracking-[-0.014em] text-foreground max-md:mt-2.5 max-md:text-[15.5px]">
        {content}
      </p>
    </article>
  )
}

// ─── Answering (pending) card ──────────────────────────────────────────────────

export function AnsweringCard({ readingLabel }: { readingLabel: string }) {
  return (
    <article
      className="rounded-xl border px-[19px] py-4 max-md:px-[14px] max-md:py-[13px]"
      style={{ background: 'var(--ai-surface)', borderColor: 'var(--ai-border)' }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-card" style={{ border: '1px solid var(--ai-border)' }}>
          <HorizonMark />
        </span>
        <span className="text-[13.5px] font-semibold text-accent-foreground">Horizon</span>
        <span className="text-xs" style={{ color: 'var(--ai-meta)' }}>{readingLabel}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2" aria-hidden="true">
        {[92, 78, 46].map((w, i) => (
          <span
            key={w}
            className="block h-[9px] rounded animate-pulse motion-reduce:animate-none"
            style={{ width: `${w}%`, background: 'var(--ai-border)', animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <p className="mt-3.5 text-[11.5px]" style={{ color: 'var(--ink-2)' }}>Sources appear with the answer.</p>
    </article>
  )
}

// ─── Answer card ───────────────────────────────────────────────────────────────

interface AnswerCardProps {
  question: QuestionOut
  isSaved: boolean
  justSaved: boolean
  onToggleSave: (answerId: string) => void
  onUndoSave: (answerId: string) => void
  onFollowUp: () => void
  onRegenerate: (content: string) => void
  onShareThis: () => void
  onOpenCitation?: (citation: CitationOut) => void
  onFeedback?: (answerId: string, feedback: 'up' | 'down') => void
  onTextSelect: () => void
}

function AnswerCard({
  question, isSaved, justSaved, onToggleSave, onUndoSave, onFollowUp, onRegenerate, onShareThis, onOpenCitation, onFeedback, onTextSelect,
}: AnswerCardProps) {
  const answer = question.answer!
  const [copied, setCopied] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const citations = [...answer.citations].sort((a, b) => a.citation_order - b.citation_order)
  const first = citations[0]
  const rest = citations.slice(1)
  const names = sourceNames(citations)

  // TODO(backend): similarity floor in rag_service — until then "nothing to cite" is
  // purely "the answer came back with zero citations"; we never fake a match %.
  const nothingToCite = citations.length === 0

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(answer.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const giveFeedback = (fb: 'up' | 'down') => {
    setFeedback(fb)
    onFeedback?.(answer.answer_id, fb)
  }

  if (nothingToCite) {
    return (
      <article className="rounded-xl border border-border bg-background px-[19px] py-4 max-md:px-[14px] max-md:py-[13px]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-border bg-card">
            <HorizonMark muted />
          </span>
          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ai-text)' }}>Horizon</span>
          <span className="text-xs" style={{ color: 'var(--ink-2)' }}>Nothing to cite</span>
        </div>
        <p className="mt-[11px] text-xs" style={{ color: 'var(--ink-2)' }}>
          None of this lecture's materials matched closely enough to quote, so treat this as a best guess. Your classmates or your professor will know.
        </p>
        <div className="mt-2.5 text-sm leading-[1.6]" style={{ color: 'var(--ai-text)' }} onMouseUp={onTextSelect}>
          {renderAnswerWithCitations(answer.content, answer.citations)}
        </div>
        <div className="mt-[13px] flex flex-wrap items-center gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); onShareThis() }} className={`${ghostBtn} h-[34px] px-3.5 max-md:h-11 max-md:flex-1`}>
            <Share2 className="h-3.5 w-3.5" /> Ask the class instead
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onRegenerate(question.content) }} className={`${ghostBtn} h-[34px] px-3.5 max-md:h-11`}>
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      </article>
    )
  }

  return (
    <article
      className="rounded-xl border px-[19px] py-4 max-md:px-[14px] max-md:py-[13px]"
      style={{ background: 'var(--ai-surface)', borderColor: 'var(--ai-border)' }}
    >
      {/* author + scope */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-card" style={{ border: '1px solid var(--ai-border)' }}>
          <HorizonMark />
        </span>
        <span className="text-[13.5px] font-semibold text-accent-foreground">Horizon</span>
        <span className="min-w-0 truncate text-xs" style={{ color: 'var(--ai-meta)' }}>From {joinNames(names)}</span>
      </div>

      {/* answer body */}
      <div
        className="mt-3 text-[15px] leading-[1.66] max-md:text-sm"
        style={{ color: 'var(--ai-text)', userSelect: 'text', cursor: 'text' }}
        onMouseUp={onTextSelect}
      >
        {renderAnswerWithCitations(answer.content, answer.citations)}
      </div>

      {/* first source open by default; the rest are one click */}
      <div className="mt-3.5 flex flex-col gap-2">
        <CitationCard citation={first} onOpen={onOpenCitation} />
        {moreOpen && rest.map((c) => <CitationCard key={c.chunk_id} citation={c} onOpen={onOpenCitation} />)}
      </div>
      {rest.length > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMoreOpen((v) => !v) }}
          className={`${ghostBtn} mt-2 h-[29px] px-[11px] text-xs max-md:h-11`}
          style={{ borderColor: 'var(--ai-border)', color: 'var(--ai-text)' }}
          aria-expanded={moreOpen}
        >
          {moreOpen
            ? 'Hide the other sources'
            : `${rest.length} more source${rest.length === 1 ? '' : 's'} — ${rest[0].filename || 'Source'}${rest[0].page_number != null ? `, p. ${rest[0].page_number}` : ''}`}
        </button>
      )}

      {/* saved confirmation */}
      {justSaved && (
        <div
          className="mt-3.5 flex items-center gap-2.5 rounded-[10px] border bg-card px-3.5 py-[11px] text-[13px] text-accent-foreground"
          style={{ borderColor: 'var(--ai-border)' }}
          role="status"
        >
          <Check className="h-4 w-4 shrink-0 text-primary" />
          <span>Saved to your notes</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUndoSave(answer.answer_id) }}
            className="ml-auto text-[12.5px] text-primary hover:underline max-md:min-h-11"
          >
            Undo
          </button>
        </div>
      )}

      {/* actions */}
      <div className="mt-[15px] flex flex-wrap items-center gap-2 border-t pt-[13px]" style={{ borderColor: 'var(--ai-border)' }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSave(answer.answer_id) }}
          className={`${ghostBtn} h-8 px-3 max-md:h-11 max-md:flex-1`}
          style={{ borderColor: 'var(--ai-border)', color: 'var(--ai-text)' }}
          aria-pressed={isSaved}
        >
          <Bookmark className="h-3.5 w-3.5" fill={isSaved ? 'currentColor' : 'none'} />
          {isSaved ? 'Saved' : 'Save to notes'}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onShareThis() }}
          className={`${ghostBtn} h-8 px-3 max-md:h-11 max-md:flex-1`}
          style={{ borderColor: 'var(--ai-border)', color: 'var(--ai-text)' }}
        >
          <Share2 className="h-3.5 w-3.5" /> Share with class
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFollowUp() }}
          className={`${ghostBtn} h-8 px-3 max-md:hidden`}
          style={{ borderColor: 'var(--ai-border)', color: 'var(--ai-text)' }}
        >
          Ask a follow-up
        </button>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy answer"
          aria-label="Copy answer"
          className={`${ghostBtn} h-8 w-8 max-md:h-11 max-md:w-12`}
          style={{ borderColor: 'var(--ai-border)', color: copied ? 'var(--status-good)' : 'var(--ai-text)' }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRegenerate(question.content) }}
          title="Ask again"
          aria-label="Ask again"
          className={`${ghostBtn} h-8 w-8 max-md:h-11 max-md:w-12`}
          style={{ borderColor: 'var(--ai-border)', color: 'var(--ai-text)' }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-2 max-md:w-full max-md:justify-end">
          <span className="text-xs" style={{ color: 'var(--ink-2)' }}>{feedback ? 'Thanks' : 'Did this help?'}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); giveFeedback('up') }}
            disabled={feedback !== null}
            aria-label="This helped"
            aria-pressed={feedback === 'up'}
            className={`${ghostBtn} h-8 w-8 max-md:h-11 max-md:w-11`}
            style={{ borderColor: 'var(--ai-border)', color: feedback === 'up' ? 'var(--status-good)' : 'var(--ai-text)' }}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); giveFeedback('down') }}
            disabled={feedback !== null}
            aria-label="This did not help"
            aria-pressed={feedback === 'down'}
            className={`${ghostBtn} h-8 w-8 max-md:h-11 max-md:w-11`}
            style={{ borderColor: 'var(--ai-border)', color: feedback === 'down' ? 'var(--status-warning-text)' : 'var(--ai-text)' }}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── Exchange: question + answer, selectable for sharing ──────────────────────

export interface MessageBubbleProps extends AnswerCardProps {
  initials: string
  readingLabel: string
  selectMode: boolean
  isSelected: boolean
  onToggleSelect: (questionId: string) => void
}

export default function MessageBubble(props: MessageBubbleProps) {
  const { question, initials, readingLabel, selectMode, isSelected, onToggleSelect } = props

  return (
    <div
      className={`relative rounded-xl transition-colors ${selectMode ? 'cursor-pointer pl-8 pr-2 py-2' : ''}`}
      style={{ background: isSelected ? 'var(--ai-surface)' : 'transparent', outline: isSelected ? '1px solid var(--ai-border)' : 'none' }}
      onClick={selectMode ? () => onToggleSelect(question.question_id) : undefined}
      role={selectMode ? 'checkbox' : undefined}
      aria-checked={selectMode ? isSelected : undefined}
    >
      {selectMode && (
        <span
          className="absolute left-2 top-5 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2"
          style={{ borderColor: 'hsl(var(--primary))', background: isSelected ? 'hsl(var(--primary))' : 'transparent' }}
          aria-hidden="true"
        >
          {isSelected && <span className="h-2 w-2 rounded-full bg-card" />}
        </span>
      )}

      <div className="flex flex-col gap-3.5 max-md:gap-[11px]">
        <QuestionCard content={question.content} initials={initials} askedAt={question.asked_at} anonymous={question.anonymous} />
        {question.answer
          ? <AnswerCard {...props} />
          : <AnsweringCard readingLabel={readingLabel} />}
      </div>
    </div>
  )
}
