import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ClassCardProps {
  name: string
  professor?: string
  status: 'live' | 'upcoming' | 'past' | 'active' | 'ended'
  students?: number
  onClick?: () => void
}

export default function ClassCard({ name, professor, status, students, onClick }: ClassCardProps) {
  const isLive = status === 'live' || status === 'active'
  const isUpcoming = status === 'upcoming'

  const accentColor = isLive
    ? 'bg-emerald-500'
    : isUpcoming
    ? 'bg-amber-400'
    : 'bg-muted-foreground/30'

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all group overflow-hidden flex min-h-[140px]"
    >
      {/* Left accent bar */}
      <div className={`w-1 shrink-0 ${accentColor}`} />

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        {/* Top row: status badge + students */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-h-[22px]">
            {isLive ? (
              <Badge className="gradient-primary text-white border-0 animate-pulse text-xs">
                ● Live
              </Badge>
            ) : isUpcoming ? (
              <Badge className="text-xs bg-amber-500 text-white border-0">
                Upcoming
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                Past
              </Badge>
            )}
          </div>
          {students != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Users className="h-3 w-3" />
              {students}
            </span>
          )}
        </div>

        {/* Name */}
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {name}
          </h3>
        </div>

        {/* Bottom: date/professor */}
        <div className="mt-2">
          {professor && (
            <p className="text-xs text-muted-foreground truncate">{professor}</p>
          )}
        </div>
      </div>
    </button>
  )
}
