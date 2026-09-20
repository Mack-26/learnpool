import type { KeyboardEvent, RefObject } from 'react'
import { ArrowRight, Eye, EyeOff, FileText, Mic, MicOff } from 'lucide-react'

export const MIN_QUESTION_LENGTH = 5
export const MAX_QUESTION_LENGTH = 2000

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  /** A question is in flight — composer locks until the answer lands. */
  pending: boolean
  /** Active materials this lecture answers from (App UX rule 5 — scope is visible while asking). */
  materialNames: string[]
  anonymous: boolean
  onAnonymousChange: (anonymous: boolean) => void
  voice?: { supported: boolean; listening: boolean; onToggle: () => void }
  error: string | null
  inputRef: RefObject<HTMLTextAreaElement | null>
  isMobile: boolean
  /** Mobile only: open the materials sheet. */
  onOpenMaterials: () => void
  questionsUsed?: number
  questionsLimit?: number
}

const AUDIENCE_LINE = 'Your professor sees every question. Share an answer as a thread to show the class.'

function AnonymousToggle({ anonymous, onChange, tall }: { anonymous: boolean; onChange: (v: boolean) => void; tall: boolean }) {
  const h = tall ? 'h-[38px]' : 'h-[26px]'
  const opt = (active: boolean) =>
    `inline-flex ${h} items-center gap-1.5 rounded-md px-2.5 text-[11.5px] transition-colors ${active ? 'bg-card font-medium text-foreground shadow-[0_1px_2px_rgba(25,24,22,0.06)]' : 'text-muted-foreground'}`
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border p-[3px]"
      style={{ background: 'hsl(var(--secondary))', borderColor: 'hsl(var(--input))' }}
      role="radiogroup"
      aria-label="Who sees your name"
    >
      <button type="button" role="radio" aria-checked={!anonymous} onClick={() => onChange(false)} className={opt(!anonymous)}>
        <Eye className="h-3 w-3 text-primary" /> With my name
      </button>
      <button type="button" role="radio" aria-checked={anonymous} onClick={() => onChange(true)} className={opt(anonymous)}>
        <EyeOff className="h-3 w-3" /> Anonymous
      </button>
    </div>
  )
}

export default function QuestionInput({
  value, onChange, onSubmit, pending, materialNames, anonymous, onAnonymousChange,
  voice, error, inputRef, isMobile, onOpenMaterials, questionsUsed, questionsLimit,
}: Props) {
  const trimmed = value.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_QUESTION_LENGTH
  const tooLong = value.length > MAX_QUESTION_LENGTH
  const canSend = !pending && trimmed.length >= MIN_QUESTION_LENGTH && !tooLong

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const placeholder = voice?.listening ? 'Listening…' : pending ? 'Horizon is answering…' : 'Ask about this lecture…'

  const quota = questionsLimit !== undefined && questionsUsed !== undefined ? (
    <span
      className="text-[11.5px] tabular-nums"
      style={{
        color: questionsUsed >= questionsLimit - 1
          ? 'hsl(var(--destructive))'
          : questionsUsed >= Math.floor(questionsLimit * 0.7) ? 'var(--status-warning-text)' : 'var(--ink-3)',
      }}
    >
      {questionsUsed}/{questionsLimit} questions
    </span>
  ) : null

  const validation = (
    <>
      {error && <p className="mt-1.5 text-xs" style={{ color: 'hsl(var(--destructive))' }}>{error}</p>}
      {!error && tooShort && <p className="mt-1.5 text-xs" style={{ color: 'hsl(var(--destructive))' }}>At least {MIN_QUESTION_LENGTH} characters.</p>}
      {value.length > MAX_QUESTION_LENGTH - 200 && (
        <p className="mt-1.5 text-xs tabular-nums" style={{ color: tooLong ? 'hsl(var(--destructive))' : 'var(--ink-3)' }}>
          {value.length} / {MAX_QUESTION_LENGTH}
        </p>
      )}
    </>
  )

  const micButton = voice?.supported ? (
    <button
      type="button"
      onClick={voice.onToggle}
      aria-label={voice.listening ? 'Stop recording' : 'Start voice input'}
      aria-pressed={voice.listening}
      className={`flex shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-secondary ${isMobile ? 'h-11 w-11' : 'h-8 w-8'} ${voice.listening ? 'animate-pulse motion-reduce:animate-none' : ''}`}
      style={{ color: voice.listening ? 'hsl(var(--destructive))' : 'var(--ink-2)' }}
    >
      {voice.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  ) : null

  // ── phone: one-thumb bottom bar, ≥44px targets ──────────────────────────────
  if (isMobile) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="border-t border-border bg-card px-4 pb-5 pt-3">
        <div className="flex items-center gap-2">
          <AnonymousToggle anonymous={anonymous} onChange={onAnonymousChange} tall />
          <button
            type="button"
            onClick={onOpenMaterials}
            className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-[9px] border border-dashed bg-card px-2.5 text-[11.5px] text-muted-foreground"
            style={{ borderColor: 'hsl(var(--input))' }}
          >
            <FileText className="h-3.5 w-3.5" style={{ color: 'var(--ink-2)' }} />
            {materialNames.length} material{materialNames.length === 1 ? '' : 's'}
          </button>
        </div>
        <div className="mt-2.5 flex items-end gap-2">
          <div className="flex min-h-12 min-w-0 flex-1 items-center gap-1 rounded-xl border bg-background pl-3.5 pr-1" style={{ borderColor: 'hsl(var(--input))' }}>
            <label htmlFor="ask-lecture" className="sr-only">Ask about this lecture</label>
            <textarea
              id="ask-lecture"
              ref={inputRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={pending}
              rows={1}
              className="max-h-[120px] min-h-6 flex-1 resize-none bg-transparent py-3 text-[14.5px] leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
              style={{ color: voice?.listening ? 'hsl(var(--destructive))' : undefined }}
            />
            {micButton}
          </div>
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Ask"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors disabled:opacity-40"
          >
            <ArrowRight className="h-[17px] w-[17px]" />
          </button>
        </div>
        {validation}
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--ink-3)' }}>
          <span className="min-w-0 truncate">{AUDIENCE_LINE}</span>
          {quota}
        </div>
      </form>
    )
  }

  // ── desktop: composer card with scope + audience strip ──────────────────────
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
      <div
        className="overflow-hidden rounded-[13px] border bg-card"
        style={{ borderColor: 'hsl(var(--input))', boxShadow: '0 1px 2px rgba(25,24,22,.05), 0 10px 26px -20px rgba(25,24,22,.2)' }}
      >
        <div className="flex items-end gap-2 px-4 pt-[13px]">
          <label htmlFor="ask-lecture" className="sr-only">Ask about this lecture</label>
          <textarea
            id="ask-lecture"
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={pending}
            rows={1}
            className="max-h-[120px] min-h-6 flex-1 resize-none bg-transparent text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
            style={{ color: voice?.listening ? 'hsl(var(--destructive))' : undefined }}
          />
          {micButton}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-border bg-background py-[11px] pl-4 pr-3">
          <span className="text-[11.5px]" style={{ color: 'var(--ink-2)' }}>Answers from</span>
          {materialNames.length === 0 ? (
            <span className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>no active materials</span>
          ) : (
            materialNames.map((name) => (
              <span
                key={name}
                className="inline-flex h-[26px] max-w-[220px] items-center truncate rounded-md border px-2 text-[11.5px]"
                style={{ background: 'var(--chip)', borderColor: 'hsl(var(--input))', color: 'var(--ai-text)' }}
                title={name}
              >
                {name}
              </span>
            ))
          )}
          <div className="ml-auto flex items-center gap-2.5">
            {quota}
            <AnonymousToggle anonymous={anonymous} onChange={onAnonymousChange} tall={false} />
            <button
              type="submit"
              disabled={!canSend}
              className="h-[34px] rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-40"
            >
              Ask
            </button>
          </div>
        </div>
      </div>
      {validation}
      <p className="mt-2 text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{AUDIENCE_LINE}</p>
    </form>
  )
}
