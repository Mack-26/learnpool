import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const LABELS = [
  { label: 'Discussed in class', short: '✓ Discussed',   color: '#10b981' },
  { label: 'Interesting Question', short: '⚡ Interesting', color: '#3b82f6' },
  { label: 'Good Analogy',       short: '🎯 Analogy',     color: '#10b981' },
  { label: 'Wrong Answer',       short: '❌ Wrong',        color: '#ef4444' },
  { label: 'Misleading',         short: '⚠️ Misleading',  color: '#eab308' },
  { label: 'Deep Understanding', short: '🧠 Deep',         color: '#8b5cf6' },
  { label: 'Surface Level',      short: '📄 Surface',      color: '#94a3b8' },
  { label: 'Needs Follow-up',    short: '🔄 Follow-up',    color: '#f97316' },
]

const LABEL_COLORS_ACTIVE: Record<string, string> = {
  'Discussed in class':  '#059669',
  'Interesting Question': '#2563eb',
  'Good Analogy':        '#059669',
  'Wrong Answer':        '#dc2626',
  'Misleading':          '#ca8a04',
  'Deep Understanding':  '#7c3aed',
  'Surface Level':       '#64748b',
  'Needs Follow-up':     '#ea580c',
}

interface LabelBarChartProps {
  data: { label: string; count: number }[]
  activeLabel: string | null
  onLabelClick: (label: string | null) => void
}

export default function LabelBarChart({ data, activeLabel, onLabelClick }: LabelBarChartProps) {
  const chartData = LABELS.map(({ label, short }) => {
    const found = data.find((d) => d.label === label)
    return { label, short, count: found?.count ?? 0 }
  })

  const handleClick = (entry: { label: string }) => {
    onLabelClick(activeLabel === entry.label ? null : entry.label)
  }

  const colorFor = (label: string) => LABELS.find((l) => l.label === label)?.color ?? '#6366f1'

  return (
    <div className="w-full">
      {activeLabel && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          <button
            onClick={() => onLabelClick(null)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            {activeLabel} ✕
          </button>
        </div>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="short"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
            formatter={(value) => [value as number, 'threads']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            onClick={(data) => handleClick(data as unknown as { label: string })}
            cursor="pointer"
          >
            {chartData.map((entry) => {
              const isActive = activeLabel === entry.label
              const color = isActive
                ? LABEL_COLORS_ACTIVE[entry.label] ?? colorFor(entry.label)
                : colorFor(entry.label)
              return (
                <Cell
                  key={entry.label}
                  fill={color}
                  opacity={activeLabel && !isActive ? 0.35 : 1}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
