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

/* Single series over nominal categories → one hue (--chart-1), never a ramp.
   Click a bar (or a table row) to filter; the active bar stays solid. */

const CATEGORIES = ['Homework', 'Doubts', 'Summaries', 'Exam Prep']

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

interface CategoryData {
  category: string
  count: number
}

interface CategoryBarChartProps {
  data: CategoryData[]
  activeCategory: string | null
  onCategoryClick: (category: string | null) => void
  fillHeight?: boolean
}

export default function CategoryBarChart({ data, activeCategory, onCategoryClick, fillHeight }: CategoryBarChartProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  // Merge data with full category list (some may be 0)
  const chartData = CATEGORIES.map((cat) => {
    const found = data.find((d) => d.category === cat)
    return { category: cat, count: found?.count ?? 0 }
  })

  const toggle = (category: string) => {
    onCategoryClick(activeCategory === category ? null : category)
  }

  return (
    <div className={fillHeight ? 'w-full h-full flex flex-col' : 'w-full'}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {activeCategory && (
            <>
              <span className="text-xs" style={{ color: 'var(--ink-2)' }}>Filtered by</span>
              <button
                type="button"
                onClick={() => onCategoryClick(null)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground border hover:bg-muted transition-colors"
                style={{ borderColor: 'var(--ai-border)' }}
              >
                {activeCategory} ✕
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
          <table className="w-full min-w-[240px] text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Category</th>
                <th className="text-right py-1.5 px-2 font-medium" style={{ color: 'var(--ink-2)' }}>Questions</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr
                  key={row.category}
                  onClick={() => toggle(row.category)}
                  className={`border-b border-border/60 last:border-0 cursor-pointer hover:bg-[var(--hover-row)] transition-colors ${activeCategory === row.category ? 'bg-accent' : ''}`}
                >
                  <td className="py-1.5 px-2 text-foreground">{row.category}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-foreground">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={fillHeight ? '100%' : 180} className={fillHeight ? 'flex-1' : ''}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="category" tick={AXIS_TICK} axisLine={{ stroke: 'var(--grid)' }} tickLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--hover-row)' }}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: 'inherit', padding: 0 }}
              labelStyle={{ color: 'inherit', fontWeight: 500 }}
              formatter={(value) => [`${value} question${value === 1 ? '' : 's'}`, '']}
              separator=""
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
              isAnimationActive={false}
              onClick={(item) => {
                const category = (item.payload as { category?: string } | undefined)?.category
                if (category) toggle(category)
              }}
              cursor="pointer"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.category}
                  fill="var(--chart-1)"
                  fillOpacity={activeCategory && activeCategory !== entry.category ? 0.35 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
