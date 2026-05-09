import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getSessionCitationMap } from '../api/professor'
import { getStudentCitationMap } from '../api/sessions'
import { useAuthStore } from '../store/authStore'
import type { DocumentCitationOut } from '../types/api'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'

function relevanceColor(avg: number): string {
  if (avg >= 0.8) return '#10b981'
  if (avg >= 0.6) return '#3b82f6'
  return '#94a3b8'
}

function DocCitationSection({ doc }: { doc: DocumentCitationOut }) {
  const [showAll, setShowAll] = useState(false)
  const MAX_SHOWN = 10

  // Inline text docs have a single null page entry
  const isInline = doc.pages.length === 1 && doc.pages[0].page_number === null

  const sortedPages = [...doc.pages].sort((a, b) => b.citation_count - a.citation_count)
  const displayPages = showAll ? sortedPages : sortedPages.slice(0, MAX_SHOWN)

  const chartData = displayPages.map((p) => ({
    name: p.page_number != null ? `p.${p.page_number}` : 'doc',
    count: p.citation_count,
    avg: p.avg_relevance,
  }))

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30">
        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground flex-1 truncate">{doc.filename}</span>
        <span className="text-xs text-muted-foreground shrink-0">
          {doc.total_citations} citation{doc.total_citations !== 1 ? 's' : ''}
        </span>
      </div>

      {isInline ? (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          {doc.total_citations} total citation{doc.total_citations !== 1 ? 's' : ''} (inline document)
        </p>
      ) : (
        <div className="p-3">
          <ResponsiveContainer width="100%" height={Math.max(80, displayPages.length * 22)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={38}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value, _name, props) => [
                  `${value} citation${(value as number) !== 1 ? 's' : ''} · relevance ${props.payload?.avg?.toFixed(2)}`,
                  '',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={relevanceColor(entry.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {sortedPages.length > MAX_SHOWN && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAll ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showAll ? 'Show less' : `Show ${sortedPages.length - MAX_SHOWN} more pages`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface CitationMapCardProps {
  sessionId: string
}

export default function CitationMapCard({ sessionId }: CitationMapCardProps) {
  const role = useAuthStore((s) => s.user?.role)
  const isProfessor = role === 'professor'

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['citation-map', sessionId],
    queryFn: () => isProfessor ? getSessionCitationMap(sessionId) : getStudentCitationMap(sessionId),
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="h-4 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (docs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-xs text-muted-foreground py-8">
        No citation data yet — citations appear once questions are answered.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-1">Material Coverage</h3>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
        <span>Which pages students asked about most</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#10b981' }} /> high relevance
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#3b82f6' }} /> medium
        </span>
      </div>
      <div className="space-y-3">
        {docs.map((doc) => (
          <DocCitationSection key={doc.document_id} doc={doc} />
        ))}
      </div>
    </div>
  )
}
