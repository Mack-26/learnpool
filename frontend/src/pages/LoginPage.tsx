import { useState, type FormEvent } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import HorizonLogo from '../components/HorizonLogo'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Only allow same-origin paths so the param can't bounce users off-site.
  const rawNext = searchParams.get('next')
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null
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
      navigate(next && data.role === 'student' ? next : data.role === 'professor' ? '/instructor' : '/home')
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

  const inputClass = 'w-full h-11 px-3.5 rounded-lg border border-input bg-background text-[15px] text-foreground placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-ring/30'
  const labelClass = 'block mb-1.5 mono text-[10px] uppercase tracking-[.09em] text-[var(--ink-3)]'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <HorizonLogo variant="dark" size="2.5rem" />
          </Link>
          <Link to="/" className="mono text-[10px] uppercase tracking-[.09em] text-[var(--ink-3)] hover:text-foreground transition-colors">
            ← Back
          </Link>
        </div>

        <div className="rounded-2xl bg-card border border-border card-shadow p-6 sm:p-8">
          {/* Heading */}
          <h1 className="text-xl font-semibold text-foreground tracking-[-0.02em] mb-1">
            Welcome back.
          </h1>
          <p className="text-xs text-[var(--ink-2)] mb-5">
            Sign in to your Horizon account.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className={labelClass}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-11 text-[15px]" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="mono text-[10px] uppercase tracking-[.09em] text-[var(--ink-3)]">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Link
            to="/signup"
            className="block w-full h-11 leading-[2.75rem] text-center rounded-lg border border-border bg-card text-[15px] font-medium text-foreground hover:bg-[var(--hover-row)] transition-colors"
          >
            Create an account →
          </Link>
        </div>
      </div>
    </div>
  )
}
