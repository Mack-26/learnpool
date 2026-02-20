import { useState } from 'react'
import type { QuestionOut } from '../types/api'
import CitationCard from './CitationCard'

interface Props {
  question: QuestionOut
}

export default function MessageBubble({ question }: Props) {
  const [citationsOpen, setCitationsOpen] = useState(false)
  const { answer } = question

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Student question — right aligned */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <div style={{
          maxWidth: '70%',
          backgroundColor: '#3b82f6',
          color: '#fff',
          borderRadius: '16px 16px 4px 16px',
          padding: '10px 14px',
          fontSize: 15,
          lineHeight: 1.5,
        }}>
          {question.content}
        </div>
      </div>

      {/* AI answer — left aligned */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ maxWidth: '75%' }}>
          <div style={{
            backgroundColor: '#f1f5f9',
            borderRadius: '16px 16px 16px 4px',
            padding: '10px 14px',
            fontSize: 15,
            lineHeight: 1.5,
            color: '#1e293b',
          }}>
            {answer
              ? answer.content
              : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Generating answer…</span>
            }
          </div>

          {/* Model label + citations toggle */}
          {answer && (
            <div style={{ marginTop: 6, paddingLeft: 4 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{answer.model_used}</span>
              {answer.citations.length > 0 && (
                <button
                  onClick={() => setCitationsOpen((o) => !o)}
                  style={{
                    marginLeft: 10,
                    fontSize: 12,
                    color: '#3b82f6',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {citationsOpen ? '▾ Hide sources' : `▸ Sources (${answer.citations.length})`}
                </button>
              )}
            </div>
          )}

          {/* Citations */}
          {citationsOpen && answer && (
            <div style={{ marginTop: 8 }}>
              {answer.citations.map((c) => (
                <CitationCard key={c.chunk_id} citation={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
