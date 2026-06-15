const sans = "'Manrope', sans-serif"
const serif = "'Newsreader', 'Georgia', serif"

interface SessionCardProps {
  title: string
  date: string
  status: 'live' | 'upcoming' | 'past'
  onClick?: () => void
}

const VARIANTS = {
  live: {
    card: { background: '#1e2a5e', border: 'none' },
    label: { color: '#4ade80', fontWeight: 700 },
    labelText: '● LIVE NOW',
    datePill: { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' },
    title: { color: '#ffffff' },
    btn: {
      background: '#ea580c', color: '#ffffff',
      border: 'none', cursor: 'pointer',
    },
    btnText: 'JOIN SESSION →',
  },
  upcoming: {
    card: { background: '#ffffff', border: '1px solid rgba(134,134,172,0.25)' },
    label: { color: '#272757', fontWeight: 600 },
    labelText: 'UPCOMING',
    datePill: { background: 'rgba(39,39,87,0.07)', color: '#505081' },
    title: { color: '#1e2a5e' },
    btn: {
      background: 'transparent', color: '#272757',
      border: '1.5px solid rgba(39,39,87,0.35)', cursor: 'pointer',
    },
    btnText: 'VIEW THREADS →',
  },
  past: {
    card: { background: '#f0f0f8', border: 'none' },
    label: { color: '#8686AC', fontWeight: 500 },
    labelText: 'ENDED',
    datePill: { background: 'rgba(134,134,172,0.15)', color: '#8686AC' },
    title: { color: '#272757' },
    btn: {
      background: 'transparent', color: '#8686AC',
      border: '1.5px solid rgba(134,134,172,0.4)', cursor: 'pointer',
    },
    btnText: 'VIEW ARCHIVE →',
  },
}

export default function SessionCard({ title, date, status, onClick }: SessionCardProps) {
  const v = VARIANTS[status]

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        textAlign: 'left',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        minHeight: '180px',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        boxSizing: 'border-box',
        ...v.card,
        boxShadow: status === 'live'
          ? '0 4px 20px rgba(30,42,94,0.35)'
          : '0 1px 4px rgba(15,14,71,0.07)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow =
          status === 'live'
            ? '0 8px 32px rgba(30,42,94,0.45)'
            : '0 6px 20px rgba(15,14,71,0.12)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow =
          status === 'live'
            ? '0 4px 20px rgba(30,42,94,0.35)'
            : '0 1px 4px rgba(15,14,71,0.07)'
      }}
    >
      {/* Top row: status label + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{
          fontFamily: sans,
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          ...v.label,
        }}>
          {v.labelText}
        </span>
        <span style={{
          fontFamily: sans,
          fontSize: '0.65rem',
          fontWeight: 500,
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          whiteSpace: 'nowrap',
          ...v.datePill,
        }}>
          {date}
        </span>
      </div>

      {/* Title */}
      <p style={{
        fontFamily: serif,
        fontSize: '1.15rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
        margin: '0.75rem 0',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        ...v.title,
      }}>
        {title}
      </p>

      {/* CTA button */}
      <div>
        <span style={{
          display: 'inline-block',
          fontFamily: sans,
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '0.45rem 1.1rem',
          borderRadius: '999px',
          ...v.btn,
        }}>
          {v.btnText}
        </span>
      </div>
    </button>
  )
}
