import type { CitationOut } from '../types/api'

interface Props {
  citation: CitationOut
}

export default function CitationCard({ citation }: Props) {
  const excerpt = citation.content.length > 200
    ? citation.content.slice(0, 200) + '…'
    : citation.content
  const matchPct = Math.round(citation.relevance_score * 100)

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
      backgroundColor: '#f8fafc',
      marginBottom: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: '#475569' }}>
          [{citation.citation_order}]{citation.page_number != null ? ` · Page ${citation.page_number}` : ''}
        </span>
        <span style={{ color: '#64748b' }}>{matchPct}% match</span>
      </div>
      <p style={{ margin: 0, color: '#334155', lineHeight: 1.5 }}>{excerpt}</p>
    </div>
  )
}
