import { useEffect, useRef } from 'react'
import type { QuestionOut } from '../types/api'
import MessageBubble, { AnsweringCard, QuestionCard, type MessageBubbleProps } from './MessageBubble'

interface Props {
  questions: QuestionOut[]
  /** A question that has been sent but not yet echoed back by the server. */
  pending: { content: string; anonymous: boolean } | null
  /** Names of the materials in scope, for the empty state and the answering label. */
  materialNames: string[]
  initials: string
  bubbleProps: (q: QuestionOut) => Omit<MessageBubbleProps, 'question' | 'initials' | 'readingLabel'>
}

function readingLabel(materialNames: string[]): string {
  if (materialNames.length === 0) return 'Thinking…'
  if (materialNames.length === 1) return `Reading ${materialNames[0]}…`
  return `Reading ${materialNames[0]} and ${materialNames.length - 1} more…`
}

function EmptyState({ materialNames }: { materialNames: string[] }) {
  const n = materialNames.length
  const scope =
    n === 0
      ? 'No materials are active for this lecture yet, so Horizon has nothing to cite. You can still ask — your professor sees every question.'
      : `Horizon answers from the ${n === 1 ? 'material' : `${n} materials`} your professor activated for this lecture, and shows you the page it used.`
  return (
    <div className="flex h-full items-center">
      <div className="w-full rounded-[13px] border bg-card px-7 py-[26px] max-md:px-5 max-md:py-5" style={{ borderColor: 'hsl(var(--input))' }}>
        <h2 className="text-[21px] font-semibold tracking-[-0.02em] text-foreground">Be the first to ask.</h2>
        <p className="mt-2 max-w-[420px] text-sm leading-[1.6] text-muted-foreground">{scope}</p>
        {n > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs" style={{ color: 'var(--ink-2)' }}>
            <span>Answers from</span>
            {materialNames.map((name) => (
              <span key={name} className="inline-flex h-[26px] items-center rounded-md border px-2 text-[11.5px]" style={{ background: 'var(--chip)', borderColor: 'hsl(var(--input))', color: 'var(--ai-text)' }}>
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessageList({ questions, pending, materialNames, initials, bubbleProps }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [questions, pending])

  if (questions.length === 0 && !pending) {
    return <EmptyState materialNames={materialNames} />
  }

  const label = readingLabel(materialNames)

  return (
    <div className="flex flex-col gap-3.5 max-md:gap-[11px]">
      {questions.map((q) => (
        <MessageBubble key={q.question_id} question={q} initials={initials} readingLabel={label} {...bubbleProps(q)} />
      ))}

      {pending && (
        <div className="flex flex-col gap-3.5 max-md:gap-[11px]">
          <QuestionCard content={pending.content} initials={initials} anonymous={pending.anonymous} pending />
          <AnsweringCard readingLabel={label} />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
