import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import HorizonLogo from '../components/HorizonLogo'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const data = await login(email, password)
      setAuth(data.access_token, {
        user_id: data.user_id,
        display_name: data.display_name,
        role: data.role,
      })
      navigate(data.role === 'professor' ? '/instructor' : '/classes')
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number; data?: { detail?: string | unknown } } }).response
        : null
      if (res?.status === 422) {
        const d = res.data?.detail
        const msg = Array.isArray(d)
          ? d.map((x: { msg?: string }) => x.msg).filter(Boolean).join(', ')
          : typeof d === 'string' ? d : 'Invalid request format.'
        setError(msg || 'Invalid request format.')
      } else {
        setError('Invalid email or password.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(182,177,217,0.15)',
    borderRadius: '0.65rem',
    padding: '0.75rem 1rem',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.95rem',
    color: '#f5f3ff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#211d45',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '-8rem', left: '50%', transform: 'translateX(-50%)',
        width: '40rem', height: '24rem',
        background: 'radial-gradient(ellipse, rgba(124,131,245,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>

        {/* Logo */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/">
            <HorizonLogo variant="light" size="2rem" />
          </Link>
          <Link to="/" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.06em', color: 'rgba(182,177,217,0.45)', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(182,177,217,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(182,177,217,0.45)')}>
            ← BACK
          </Link>
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: '2rem',
          fontWeight: 400,
          color: '#f5f3ff',
          margin: '0 0 0.4rem 0',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}>
          Welcome back.
        </h1>
        <p style={{ color: '#b6b1d9', fontSize: '0.9rem', margin: '0 0 2rem 0', lineHeight: 1.6 }}>
          Sign in to your Horizon account.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{
              fontFamily: "'DM Mono', monospace", fontSize: '0.65rem',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'rgba(182,177,217,0.5)', display: 'block', marginBottom: '0.5rem',
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(124,131,245,0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,131,245,0.1)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(182,177,217,0.15)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div>
            <label style={{
              fontFamily: "'DM Mono', monospace", fontSize: '0.65rem',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'rgba(182,177,217,0.5)', display: 'block', marginBottom: '0.5rem',
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(124,131,245,0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,131,245,0.1)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(182,177,217,0.15)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {error && (
            <p style={{
              fontSize: '0.8rem', color: '#f87171', margin: 0,
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: '0.5rem', padding: '0.75rem 1rem',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.25rem',
              width: '100%',
              background: isLoading ? 'rgba(182,177,217,0.15)' : '#ede9fe',
              color: isLoading ? '#b6b1d9' : '#211d45',
              border: 'none',
              borderRadius: '0.65rem',
              padding: '0.875rem',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : '0 8px 32px rgba(124,131,245,0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(182,177,217,0.1)' }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: 'rgba(182,177,217,0.3)', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(182,177,217,0.1)' }} />
        </div>

        <Link
          to="/signup"
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            background: 'transparent',
            color: '#b6b1d9',
            border: '1px solid rgba(182,177,217,0.15)',
            borderRadius: '0.65rem',
            padding: '0.875rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: '0.95rem',
            boxSizing: 'border-box',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(182,177,217,0.3)'
            ;(e.currentTarget as HTMLElement).style.color = '#f5f3ff'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(182,177,217,0.15)'
            ;(e.currentTarget as HTMLElement).style.color = '#b6b1d9'
          }}
        >
          Create an account →
        </Link>
      </div>
    </div>
  )
}
