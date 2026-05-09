import { Users } from 'lucide-react'

interface ClassCardProps {
  name: string
  professor?: string
  status: 'live' | 'upcoming' | 'past' | 'active' | 'ended'
  students?: number
  onClick?: () => void
}

// Deterministic gradient from course name
const HEADER_GRADIENTS = [
  'linear-gradient(135deg, #0F0E47 0%, #272757 100%)',
  'linear-gradient(135deg, #272757 0%, #505081 100%)',
  'linear-gradient(135deg, #1a1a5e 0%, #272757 100%)',
  'linear-gradient(135deg, #0d0d3b 0%, #505081 100%)',
  'linear-gradient(135deg, #272757 0%, #3a3a7a 100%)',
]

function pickGradient(name: string) {
  const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return HEADER_GRADIENTS[code % HEADER_GRADIENTS.length]
}

export default function ClassCard({ name, professor, status, students, onClick }: ClassCardProps) {
  const isLive = status === 'live' || status === 'active'
  const isUpcoming = status === 'upcoming'
  const gradient = pickGradient(name)

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden flex flex-col transition-all"
      style={{
        background: '#ffffff',
        boxShadow: '0 1px 4px rgba(15,14,71,0.08), 0 1px 2px rgba(15,14,71,0.04)',
        minHeight: '200px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 8px 28px -4px rgba(39,39,87,0.18), 0 4px 10px -4px rgba(15,14,71,0.10)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 1px 4px rgba(15,14,71,0.08), 0 1px 2px rgba(15,14,71,0.04)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Header band */}
      <div
        className="relative flex flex-col justify-between p-4"
        style={{ background: gradient, minHeight: '108px' }}
      >
        {/* Status badge top-right */}
        <div className="flex justify-end">
          {isLive ? (
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse"
              style={{ background: '#dcfce7', color: '#166534' }}
            >
              ● Live
            </span>
          ) : isUpcoming ? (
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: '#fef9c3', color: '#854d0e' }}
            >
              Upcoming
            </span>
          ) : (
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
            >
              Past
            </span>
          )}
        </div>

        {/* Course name */}
        <h3
          className="font-semibold text-white leading-snug line-clamp-2"
          style={{
            fontFamily: "'Newsreader', 'Georgia', serif",
            fontSize: '1.05rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {name}
        </h3>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-between px-4 py-3">
        {professor && (
          <p className="text-xs truncate" style={{ color: '#505081', fontFamily: "'Manrope', sans-serif" }}>
            {professor}
          </p>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-end mt-3 pt-2"
          style={{ borderTop: '1px solid rgba(134,134,172,0.12)' }}
        >
          {students != null && (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#8686AC' }}>
              <Users className="h-3 w-3" />
              {students}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
