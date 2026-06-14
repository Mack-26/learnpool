import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { TimelineBucket } from '../types/api'

const CATEGORY_COLORS = {
  doubts:    '#6366f1',
  homework:  '#f59e0b',
  exam_prep: '#10b981',
  summaries: '#8b5cf6',
}

const CATEGORY_LABELS: Record<string, string> = {
  doubts:    'Doubts',
  homework:  'Homework',
  exam_prep: 'Exam Prep',
  summaries: 'Summaries',
}

export default function QuestionTimeline({ data }: { data: TimelineBucket[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Question Timeline</h3>
        <p className="text-xs text-muted-foreground">No timeline data — questions were asked before the session start time was recorded.</p>
      </div>
    )
  }

  const chartData = data.map((b) => ({
    label: `${b.bucket_start_min}m`,
    Doubts: b.doubts,
    Homework: b.homework,
    'Exam Prep': b.exam_prep,
    Summaries: b.summaries,
  }))

  const peakBucket = data.reduce((a, b) => (b.count > a.count ? b : a), data[0])
  const totalQuestions = data.reduce((s, b) => s + b.count, 0)

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Question Timeline</h3>
          <p className="text-xs text-muted-foreground">
            {totalQuestions} questions — busiest at minute {peakBucket.bucket_start_min}
          </p>
        </div>
      </div>

      <div className="mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={14} barCategoryGap="30%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={20}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
            <Bar dataKey="Doubts"    stackId="a" fill={CATEGORY_COLORS.doubts}    radius={[0, 0, 0, 0]} />
            <Bar dataKey="Homework"  stackId="a" fill={CATEGORY_COLORS.homework}  radius={[0, 0, 0, 0]} />
            <Bar dataKey="Exam Prep" stackId="a" fill={CATEGORY_COLORS.exam_prep} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Summaries" stackId="a" fill={CATEGORY_COLORS.summaries} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
