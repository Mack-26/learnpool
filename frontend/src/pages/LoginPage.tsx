import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, BookOpen, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

type RoleChoice = 'student' | 'instructor' | null

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [roleChoice, setRoleChoice] = useState<RoleChoice>(null)
  const [email, setEmail] = useState('alice@example.com')
  const [password, setPassword] = useState('devpassword')

  // Update email placeholder when role changes
  const handleRoleChange = (role: RoleChoice) => {
    setRoleChoice(role)
    if (role === 'instructor') setEmail('prof@example.com')
    else if (role === 'student') setEmail('alice@example.com')
  }
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!roleChoice) {
      setError('Please select Student or Instructor.')
      return
    }
    setIsLoading(true)
    try {
      const data = await login(email, password)
      const backendRole = data.role
      const expectedRole = roleChoice === 'instructor' ? 'professor' : 'student'
      if (backendRole !== expectedRole) {
        setError(
          roleChoice === 'instructor'
            ? 'This account is a Student. Please select Student to sign in.'
            : 'This account is an Instructor. Please select Instructor to sign in.'
        )
        setIsLoading(false)
        return
      }
      setAuth(data.access_token, {
        user_id: data.user_id,
        display_name: data.display_name,
        role: data.role,
      })
      navigate(backendRole === 'professor' ? '/instructor' : '/classes')
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number; data?: { detail?: string | unknown } } }).response
        : null
      if (res?.status === 422) {
        const d = res.data?.detail
        const msg = Array.isArray(d)
          ? d.map((x: { msg?: string }) => x.msg).filter(Boolean).join(', ')
          : typeof d === 'string'
            ? d
            : 'Invalid request format. Check email and password.'
        setError(msg || 'Invalid request format.')
      } else {
        setError('Invalid email or password.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left gradient panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/20"
              style={{
                width: `${200 + i * 120}px`,
                height: `${200 + i * 120}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center px-12"
        >
          <div className="h-36 w-36 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 overflow-hidden">
            <img src="/logo.png" alt="LearnPool" className="h-32 w-32 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">LearnPool</h1>
          <p className="text-white/80 text-lg max-w-md">
            AI-powered classroom engagement. Smarter questions, deeper understanding.
          </p>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="LearnPool" className="h-20 w-20 rounded-xl object-contain" />
            <span className="text-xl font-bold text-foreground">LearnPool</span>
          </div>

          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
          </div>
          <p className="text-muted-foreground mb-6">Sign in to access your dashboard</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                roleChoice === 'student'
                  ? 'border-primary bg-accent'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <BookOpen className={`h-6 w-6 ${roleChoice === 'student' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${roleChoice === 'student' ? 'text-primary' : 'text-foreground'}`}>
                Student
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('instructor')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                roleChoice === 'instructor'
                  ? 'border-primary bg-accent'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <Users className={`h-6 w-6 ${roleChoice === 'instructor' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${roleChoice === 'instructor' ? 'text-primary' : 'text-foreground'}`}>
                Instructor
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading || !roleChoice}
              className="w-full gradient-primary text-white hover:opacity-90 transition-opacity border-0"
              size="lg"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Demo: Student alice@example.com / Instructor prof@example.com — devpassword
          </p>
        </motion.div>
      </div>
    </div>
  )
}
