import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { UsersRound } from 'lucide-react'
import { signup } from '../api/auth'
import { getInvitePreview, joinGroup } from '../api/groups'
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

/**
 * Invite landing page. Signed-in students are joined and dropped into the group
 * immediately; everyone else gets the group preview and a one-form sign-up.
 */
export default function JoinPage() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { token, user, setAuth } = useAuthStore()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: invite, isLoading, isError } = useQuery({
    queryKey: ['invite', code],
    queryFn: () => getInvitePreview(code),
    retry: false,
  })

  const join = useMutation({
    mutationFn: () => joinGroup(code),
    onSuccess: (res) => navigate(`/groups/${res.group.id}`, { replace: true }),
    onError: (err) => setError(errorMessage(err, "Couldn't join this group.")),
  })

  const isStudent = !!token && user?.role === 'student'
  const isProfessor = !!token && user?.role === 'professor'

  // Already signed in as a student: skip the form entirely.
  const joinMutate = join.mutate
  const joinIdle = join.isIdle
  useEffect(() => {
    if (isStudent && invite && joinIdle) joinMutate()
  }, [isStudent, invite, joinIdle, joinMutate])

  const createAndJoin = useMutation({
    mutationFn: async () => {
      const data = await signup({ email: email.trim(), password, display_name: displayName.trim(), role: 'student' })
      setAuth(data.access_token, { user_id: data.user_id, display_name: data.display_name, role: data.role })
      return joinGroup(code)
    },
    onSuccess: (res) => navigate(`/groups/${res.group.id}`, { replace: true }),
    onError: (err) => setError(errorMessage(err, "Couldn't create your account. Please try again.")),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!displayName.trim() || !email.trim() || password.length < 8) {
      setError(password.length < 8 ? 'Password needs at least 8 characters.' : 'Please fill in every field.')
      return
    }
    createAndJoin.mutate()
  }

  const busy = createAndJoin.isPending || join.isPending

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-background">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
        <div className="flex justify-center mb-6"><HorizonLogo variant="dark" size="2.5rem" /></div>

        <div className="rounded-2xl bg-card border border-border card-shadow p-6 sm:p-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center">Loading invite…</p>
          ) : isError || !invite ? (
            <div className="text-center">
              <p className="text-base font-semibold text-foreground mb-1">This invite link isn't valid</p>
              <p className="text-sm text-muted-foreground mb-5">It may have been mistyped. Ask your classmate to send it again.</p>
              <Link to="/" className="text-sm text-primary hover:underline">Go to Horizon</Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <span className="h-12 w-12 rounded-xl flex items-center justify-center text-primary bg-accent border border-[var(--ai-border)] shrink-0">
                  <UsersRound className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="mono text-[10px] uppercase tracking-[.09em] text-[var(--ink-3)]">{invite.owner_first_name} invited you to study together</p>
                  <h1 className="text-xl font-semibold text-foreground tracking-[-0.02em] truncate">{invite.name}</h1>
                  <p className="text-xs text-[var(--ink-2)] truncate">
                    {invite.subject ? `${invite.subject} · ` : ''}{invite.member_count} member{invite.member_count === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              {isStudent ? (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">{join.isError ? error : 'Joining…'}</p>
                  {join.isError && <Button className="mt-3 h-9" onClick={() => join.mutate()}>Try again</Button>}
                </div>
              ) : isProfessor ? (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">Study groups are for student accounts. Sign in with a student account to join.</p>
                  <Link to={`/login?next=/join/${code}`} className="inline-block mt-3 text-sm text-primary hover:underline">Switch account</Link>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3">
                  <p className="text-sm text-muted-foreground -mt-1 mb-2">Create a free account to join. Takes ten seconds.</p>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    aria-label="Your name"
                    autoComplete="name"
                    autoFocus
                    maxLength={80}
                    className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-[15px] text-foreground placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    aria-label="Email"
                    autoComplete="email"
                    inputMode="email"
                    className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-[15px] text-foreground placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (8+ characters)"
                    aria-label="Password"
                    autoComplete="new-password"
                    className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-[15px] text-foreground placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button type="submit" className="w-full h-11 text-[15px]" disabled={busy}>
                    {busy ? 'Joining…' : `Join ${invite.name}`}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Already have an account?{' '}
                    <Link to={`/login?next=/join/${code}`} className="text-primary hover:underline">Sign in</Link>
                  </p>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-[11.5px] text-center mt-5 text-[var(--ink-3)]">
          Horizon — study together with AI grounded in your class materials.
        </p>
      </motion.div>
    </div>
  )
}
