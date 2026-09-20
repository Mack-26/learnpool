import { useState } from 'react'
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

/* Threads by professor label — a single series over nominal labels, so one
   hue (--chart-1). Status colours are reserved for status chips, not series. */

const LABELS = [
  { label: 'Discussed in class', short: 'Discussed' },
  { label: 'Interesting Question', short: 'Interesting' },
  { label: 'Good Analogy', short: 'Analogy' },
  { label: 'Wrong Answer', short: 'Wrong' },
  { label: 'Misleading', short: 'Misleading' },
  { label: 'Deep Understanding', short: 'Deep' },
  { label: 'Surface Level', short: 'Surface' },
  { label: 'Needs Follow-up', short: 'Follow-up' },
]

const TOOLTIP_STYLE = {
  background: 'var(--dark)',
  border: 0,
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 11,
  lineHeight: 1.3,
  color: 'hsl(var(--background))',
}
const AXIS_TICK = { fontSize: 10, fill: 'var(--ink-3)' }

interface LabelBarChartProps {
  data: { label: string; count: number }[]
  activeLabel: string | null
  onLabelClick: (label: string | null) => void
}

export default function LabelBarChart({ data, activeLabel, onLabelClick }: LabelBarChartProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const chartData = LABELS.map(({ label, short }) => {
    const found = data.find((d) => d.label === label)
    return { label, short, count: found?.count ?? 0 }
  })

  const toggle = (label: string) => {
    onLabelClick(activeLabel === label ? null : label)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {activeLabel && (
            <>
              <span className="text-xs" style={{ color: 'var(--ink-2)' }}>Filtered by</span>
              <button
                type="button"
                onClick={() => onLabelClick(null)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground border hover:bg-muted transition-colors"
                style={{ borderColor: 'var(--ai-border)' }}
              >
                {activeLabel} ✕
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          aria-pressed={view === 'table'}
          onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
          className="h-[27px] px-2.5 rounded-[7px] border border-border bg-card text-[11.5px] text-muted-foreground hover:bg-muted hover:border-input transition-colors flex-shrink-0"
        >
          {view === 'chart' ? 'Table' : 'Chart'}
        </button>
      </div>

      {view === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Label</th>
                <th className="text-right py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Threads</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr
                  key={row.label}
                  onClick={() => toggle(row.label)}
                  className={`border-b border-border/60 last:border-0 cursor-pointer hover:bg-[var(--hover-row)] transition-colors ${activeLabel === row.label ? 'bg-accent' : ''}`}
                >
                  <td className="py-1.5 px-2 text-foreground">{row.label}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-foreground">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="short" tick={AXIS_TICK} axisLine={{ stroke: 'var(--grid)' }} tickLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--hover-row)' }}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: 'inherit', padding: 0 }}
              labelStyle={{ color: 'inherit', fontWeight: 500 }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
              formatter={(value) => [`${value} thread${value === 1 ? '' : 's'}`, '']}
              separator=""
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
              isAnimationActive={false}
              onClick={(item) => {
                const label = (item.payload as { label?: string } | undefined)?.label
                if (label) toggle(label)
              }}
              cursor="pointer"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.label}
                  fill="var(--chart-1)"
                  fillOpacity={activeLabel && activeLabel !== entry.label ? 0.35 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
