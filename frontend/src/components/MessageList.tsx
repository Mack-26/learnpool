import { useEffect, useRef } from 'react'
import type { QuestionOut } from '../types/api'
import MessageBubble from './MessageBubble'

interface Props {
  questions: QuestionOut[]
}

export default function MessageList({ questions }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [questions.length])

  if (questions.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 15 }}>
        Ask the first question for this lecture.
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      {questions.map((q) => (
        <MessageBubble key={q.question_id} question={q} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
