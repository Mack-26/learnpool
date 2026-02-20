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

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 rounded-xl border-2 border-border bg-card hover:border-primary/40 hover:hover-shadow transition-all group card-shadow"
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        {isLive ? (
          <Badge className="gradient-primary text-white border-0 animate-pulse text-xs">
            ● Live
          </Badge>
        ) : isUpcoming ? (
          <Badge variant="secondary" className="text-xs">Upcoming</Badge>
        ) : (
          <span />
        )}
        {students != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {students}
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-foreground text-base mb-1 group-hover:text-primary transition-colors">
        {name}
      </h3>

      {/* Professor */}
      {professor && (
        <p className="text-sm text-muted-foreground">{professor}</p>
      )}
    </button>
  )
}
