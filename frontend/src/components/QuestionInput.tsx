import { useState, type KeyboardEvent } from 'react'

interface Props {
  onSubmit: (content: string) => void
  disabled: boolean
}

export default function QuestionInput({ onSubmit, disabled }: Props) {
  const [text, setText] = useState('')

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length < 5 || disabled) return
    onSubmit(trimmed)
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const tooShort = text.trim().length > 0 && text.trim().length < 5
  const tooLong = text.length > 2000

  return (
    <div style={{
      borderTop: '1px solid #e2e8f0',
      padding: '14px 24px',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-end',
      backgroundColor: '#fff',
    }}>
      <div style={{ flex: 1 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the lecture… (Shift+Enter to send)"
          disabled={disabled}
          rows={3}
          style={{
            width: '100%',
            resize: 'none',
            border: tooLong ? '1px solid #ef4444' : '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 15,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            opacity: disabled ? 0.6 : 1,
          }}
        />
        {tooShort && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#ef4444' }}>At least 5 characters required</p>}
        {tooLong && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#ef4444' }}>{text.length}/2000 characters</p>}
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || tooShort || tooLong || text.trim().length === 0}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontSize: 15,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: (disabled || text.trim().length < 5 || tooLong) ? 0.5 : 1,
          whiteSpace: 'nowrap',
          marginBottom: 2,
        }}
      >
        {disabled ? 'Generating…' : 'Ask'}
      </button>
    </div>
  )
}
