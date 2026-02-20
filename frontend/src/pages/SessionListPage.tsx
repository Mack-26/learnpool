import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getSessions } from '../api/sessions'
import { useAuthStore } from '../store/authStore'
import type { SessionSummary } from '../types/api'

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active:   { bg: '#dcfce7', text: '#15803d', label: 'Live' },
  ended:    { bg: '#f1f5f9', text: '#64748b', label: 'Ended' },
  released: { bg: '#dbeafe', text: '#1d4ed8', label: 'Released' },
}

function SessionCard({ session }: { session: SessionSummary }) {
  const navigate = useNavigate()
  const badge = STATUS_COLORS[session.status] ?? STATUS_COLORS.ended
  const date = new Date(session.started_at).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  return (
    <div
      onClick={() => navigate(`/sessions/${session.id}`)}
      style={{
        border: `1px solid ${session.status === 'active' ? '#86efac' : '#e2e8f0'}`,
        borderRadius: 12,
        padding: '18px 20px',
        cursor: 'pointer',
        backgroundColor: '#fff',
        boxShadow: session.status === 'active' ? '0 2px 12px rgba(59,130,246,0.08)' : 'none',
        transition: 'box-shadow 0.15s',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>{session.title}</h3>
        <span style={{ fontSize: 13, color: '#64748b' }}>{date}</span>
      </div>
      <span style={{
        padding: '4px 10px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: badge.bg,
        color: badge.text,
      }}>
        {badge.label}
      </span>
    </div>
  )
}

export default function SessionListPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#1e293b' }}>LearnPool</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>{user?.display_name}</span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            style={{ fontSize: 13, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Your Sessions</h2>

        {isLoading && <p style={{ color: '#64748b' }}>Loading sessions…</p>}
        {error && <p style={{ color: '#ef4444' }}>Failed to load sessions.</p>}

        {sessions && sessions.length === 0 && (
          <p style={{ color: '#64748b' }}>You are not enrolled in any courses yet.</p>
        )}

        {sessions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Active sessions first */}
            {[...sessions].sort((a, b) =>
              a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0
            ).map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
