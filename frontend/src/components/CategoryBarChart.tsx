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

const CATEGORIES = ['Homework', 'Doubts', 'Summaries', 'Exam Prep']

const CATEGORY_COLORS: Record<string, string> = {
  Homework:   '#6366f1',
  Doubts:     '#3b82f6',
  Summaries:  '#10b981',
  'Exam Prep': '#f59e0b',
}

const CATEGORY_COLORS_ACTIVE: Record<string, string> = {
  Homework:   '#4f46e5',
  Doubts:     '#2563eb',
  Summaries:  '#059669',
  'Exam Prep': '#d97706',
}

interface CategoryData {
  category: string
  count: number
}

interface CategoryBarChartProps {
  data: CategoryData[]
  activeCategory: string | null
  onCategoryClick: (category: string | null) => void
}

export default function CategoryBarChart({ data, activeCategory, onCategoryClick }: CategoryBarChartProps) {
  // Merge data with full category list (some may be 0)
  const chartData = CATEGORIES.map((cat) => {
    const found = data.find((d) => d.category === cat)
    return { category: cat, count: found?.count ?? 0 }
  })

  const handleClick = (entry: { category: string }) => {
    onCategoryClick(activeCategory === entry.category ? null : entry.category)
  }

  return (
    <div className="w-full">
      {activeCategory && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          <button
            onClick={() => onCategoryClick(null)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            {activeCategory} ✕
          </button>
        </div>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
            formatter={(value) => [value as number, 'questions']}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            onClick={(data) => handleClick(data as unknown as { category: string })}
            cursor="pointer"
          >
            {chartData.map((entry) => {
              const isActive = activeCategory === entry.category
              const color = isActive
                ? CATEGORY_COLORS_ACTIVE[entry.category] ?? '#6366f1'
                : CATEGORY_COLORS[entry.category] ?? '#6366f1'
              return (
                <Cell
                  key={entry.category}
                  fill={color}
                  opacity={activeCategory && !isActive ? 0.4 : 1}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
