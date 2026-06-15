interface ClassCardProps {
  name: string
  professor?: string
  status: 'live' | 'upcoming' | 'past' | 'active' | 'ended'
  students?: number
  onClick?: () => void
}

const BANNER_COLORS = [
  '#0e7490',  // teal
  '#7c3aed',  // violet
  '#1d4ed8',  // blue
  '#047857',  // emerald
  '#9333ea',  // purple
  '#0369a1',  // sky
  '#b45309',  // amber
  '#be123c',  // rose
]

function pickColor(name: string) {
  const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return BANNER_COLORS[code % BANNER_COLORS.length]
}

export default function ClassCard({ name, professor, status, onClick }: ClassCardProps) {
  const isLive = status === 'live' || status === 'active'
  const bannerColor = pickColor(name)
  const initial = professor ? professor.charAt(0).toUpperCase() : '?'

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
      {/* Banner */}
      <div
        className="relative flex flex-col justify-between p-4 overflow-hidden"
        style={{ background: bannerColor, minHeight: '120px' }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', bottom: '-20px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.10)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10px', right: '40px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />

        {/* Live badge */}
        {isLive && (
          <div className="flex justify-start">
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse"
              style={{ background: '#dcfce7', color: '#166534' }}
            >
              ● Live
            </span>
          </div>
        )}

        {/* Course name */}
        <h3
          className="font-semibold text-white leading-snug line-clamp-2 mt-auto"
          style={{
            fontFamily: "'Newsreader', 'Georgia', serif",
            fontSize: '1.05rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            position: 'relative',
          }}
        >
          {name}
        </h3>
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderTop: '1px solid rgba(134,134,172,0.12)' }}
      >
        <div
          className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
          style={{ background: bannerColor }}
        >
          {initial}
        </div>
        {professor && (
          <p
            className="text-xs truncate"
            style={{ color: '#505081', fontFamily: "'Manrope', sans-serif" }}
          >
            {professor}
          </p>
        )}
      </div>
    </button>
  )
}
