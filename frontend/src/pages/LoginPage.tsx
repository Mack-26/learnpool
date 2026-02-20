import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

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
      navigate('/sessions')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px 36px',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: 380,
      }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 700, color: '#1e293b' }}>LearnPool</h1>
        <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: 15 }}>Sign in to join your class session</p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </label>

          {error && (
            <p style={{ color: '#ef4444', fontSize: 14, margin: '0 0 16px' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '11px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
