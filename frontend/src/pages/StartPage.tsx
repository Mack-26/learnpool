import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { UsersRound } from 'lucide-react'
import { signup } from '../api/auth'
import { createGroup } from '../api/groups'
import HorizonLogo from '../components/HorizonLogo'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '../store/authStore'

function errorMessage(err: unknown, fallback: string): string {
  const res = (err as { response?: { status?: number; data?: { detail?: unknown } } })?.response
  const d = res?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map((x: { msg?: string }) => x.msg).filter(Boolean).join(', ') || fallback
  return fallback
}

const inputClass = 'w-full px-3.5 py-3 rounded-xl border border-border bg-background text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30'

/** Landing-page CTA target: create an account and the first study group in one step. */
export default function StartPage() {
  const navigate = useNavigate()
  const { token, user, setAuth } = useAuthStore()
  const signedInStudent = !!token && user?.role === 'student'

  const [groupName, setGroupName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const start = useMutation({
    mutationFn: async () => {
      if (!signedInStudent) {
        const data = await signup({ email: email.trim(), password, display_name: displayName.trim(), role: 'student' })
        setAuth(data.access_token, { user_id: data.user_id, display_name: data.display_name, role: data.role })
      }
      return createGroup(groupName.trim())
    },
    onSuccess: (group) => navigate(`/groups/${group.id}`, { replace: true }),
    onError: (err) => setError(errorMessage(err, "Couldn't create your group. Please try again.")),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!groupName.trim()) return setError('Give your group a name — your class works well.')
    if (!signedInStudent && (!displayName.trim() || !email.trim())) return setError('Please fill in every field.')
    if (!signedInStudent && password.length < 8) return setError('Password needs at least 8 characters.')
    start.mutate()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{ background: '#1b1a3f' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Link to="/"><HorizonLogo variant="light" size="2.5rem" /></Link></div>

        <div className="rounded-3xl bg-white p-6 sm:p-8" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
          <div className="flex items-center gap-3 mb-5">
            <span className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #272757, #505081)' }}>
              <UsersRound className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-foreground">Create a study group</h1>
              <p className="text-xs text-muted-foreground">You'll get a link to invite classmates right after.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name, e.g. EECS 551"
              aria-label="Group name"
              autoFocus
              maxLength={200}
              className={inputClass}
            />
            {!signedInStudent && (
              <>
                <div className="pt-1 pb-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Your account</div>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" aria-label="Your name" autoComplete="name" maxLength={80} className={inputClass} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" autoComplete="email" inputMode="email" className={inputClass} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" aria-label="Password" autoComplete="new-password" className={inputClass} />
              </>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full h-11 text-[15px]" disabled={start.isPending}>
              {start.isPending ? 'Creating…' : 'Create group'}
            </Button>
            {!signedInStudent && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                Already have an account?{' '}
                <Link to="/login?next=/start" className="text-primary hover:underline">Sign in</Link>
                <span className="mx-1.5">·</span>
                Teaching a course?{' '}
                <Link to="/signup" className="text-primary hover:underline">Instructor sign-up</Link>
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  )
}
