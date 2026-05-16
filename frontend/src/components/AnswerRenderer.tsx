import { useState } from 'react'
import katex from 'katex'

export type CitationRef = {
  citation_order: number
  filename?: string | null
  page_number?: number | null
  content: string
}

export function CitationBadge({ num, citation }: { num: number; citation: CitationRef }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <sup
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '1rem', height: '1rem', borderRadius: '3px',
          background: '#272757', color: '#fff',
          fontSize: '0.58rem', fontWeight: 700, cursor: 'default',
          verticalAlign: 'super', margin: '0 1px', padding: '0 2px',
          lineHeight: 1, userSelect: 'none',
        }}
      >
        {num}
      </sup>
      {hovered && (
        <span style={{
          position: 'absolute', bottom: '1.6rem', left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: '#fff', borderRadius: '0.75rem',
          padding: '0.85rem 1rem', width: '300px', zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          fontSize: '0.78rem', lineHeight: 1.55, display: 'block', pointerEvents: 'none',
        }}>
          <span style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#a5b4fc', fontSize: '0.8rem' }}>
            {citation.filename || 'Source'}{citation.page_number ? ` · p.${citation.page_number}` : ''}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.8)', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
            {citation.content}
          </span>
        </span>
      )}
    </span>
  )
}

export function renderKatex(latex: string, displayMode: boolean) {
  try {
    return katex.renderToString(latex, { displayMode, throwOnError: false, output: 'html' })
  } catch {
    return latex
  }
}

export function renderInline(text: string, citations: CitationRef[]): React.ReactNode[] {
  const parts = text.split(/(\\\([\s\S]*?\\\)|\*\*[^*]+\*\*|\*[^*]+\*|\[\d+\])/g)
  return parts.map((part, i) => {
    const inlineMath = part.match(/^\\\(([\s\S]*?)\\\)$/)
    const bold = part.match(/^\*\*([^*]+)\*\*$/)
    const italic = part.match(/^\*([^*]+)\*$/)
    const cite = part.match(/^\[(\d+)\]$/)
    if (inlineMath) {
      return <span key={i} dangerouslySetInnerHTML={{ __html: renderKatex(inlineMath[1], false) }} />
    }
    if (bold) return <strong key={i}>{bold[1]}</strong>
    if (italic) return <em key={i}>{italic[1]}</em>
    if (cite) {
      const num = parseInt(cite[1])
      const citation = citations.find(c => c.citation_order === num)
      if (citation) return <CitationBadge key={i} num={num} citation={citation} />
      // Citation number in text has no matching source — render greyed badge
      return (
        <sup key={i} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '1rem', height: '1rem', borderRadius: '3px',
          background: '#d8d8e8', color: '#8686AC',
          fontSize: '0.58rem', fontWeight: 700,
          verticalAlign: 'super', margin: '0 1px', padding: '0 2px', lineHeight: 1,
        }}>{num}</sup>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function renderTextBlock(text: string, citations: CitationRef[], keyPrefix: string): React.ReactNode[] {
  const lines = text.split('\n')
  return lines.map((line, idx) => {
    const key = `${keyPrefix}-${idx}`
    if (line === '') return <div key={key} style={{ height: '0.4rem' }} />
    const numbered = line.match(/^(\d+)\.\s(.*)/)
    const bullet = line.match(/^[-*]\s(.*)/)
    if (numbered) {
      return (
        <div key={key} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.15rem' }}>
          <span style={{ fontWeight: 600, minWidth: '1.2rem', flexShrink: 0 }}>{numbered[1]}.</span>
          <span>{renderInline(numbered[2], citations)}</span>
        </div>
      )
    } else if (bullet) {
      return (
        <div key={key} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.1rem' }}>
          <span style={{ flexShrink: 0 }}>•</span>
          <span>{renderInline(bullet[1], citations)}</span>
        </div>
      )
    }
    return <span key={key} style={{ display: 'block' }}>{renderInline(line, citations)}</span>
  })
}

export function renderAnswerWithCitations(text: string, citations: CitationRef[]): React.ReactNode {
  const segments = text.split(/(\\\[[\s\S]*?\\\])/g)
  const nodes: React.ReactNode[] = []
  segments.forEach((seg, si) => {
    const displayMath = seg.match(/^\\\[([\s\S]*?)\\\]$/)
    if (displayMath) {
      nodes.push(
        <div key={`dm-${si}`} className="my-2 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: renderKatex(displayMath[1].trim(), true) }}
        />
      )
    } else {
      nodes.push(...renderTextBlock(seg, citations, `tb-${si}`))
    }
  })
  return <>{nodes}</>
}
