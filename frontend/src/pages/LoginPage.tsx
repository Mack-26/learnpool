import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles } from 'lucide-react'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

// ─── Feature Slide Mocks ────────────────────────────────────────────────────

function SlideAsk() {
  return (
    <div className="w-full space-y-2.5">
      {[
        { text: 'What is the difference between bias and variance?', tag: 'Doubts', delay: 0 },
        { text: 'Can you summarize today\'s lecture on gradient descent?', tag: 'Summary', delay: 0.08 },
        { text: 'Will the normal equation be on the exam?', tag: 'Exam Prep', delay: 0.16 },
      ].map((q, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: q.delay, duration: 0.4, ease: 'easeOut' }}
          className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex items-start gap-3"
        >
          <div className="mt-0.5 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-3 h-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/90 text-sm leading-snug">{q.text}</p>
            <span className="inline-block mt-1.5 text-[10px] font-semibold tracking-wide uppercase bg-white/20 text-white/80 rounded-full px-2 py-0.5">
              {q.tag}
            </span>
          </div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="bg-white/10 rounded-xl px-4 py-3 border border-white/20 border-dashed flex items-center gap-2"
      >
        <div className="flex-1 text-sm text-white/40 italic">Ask your question…</div>
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white/70" />
        </div>
      </motion.div>
    </div>
  )
}

function SlideInsights() {
  const categories = [
    { label: 'Doubts', count: 8, pct: 100 },
    { label: 'Homework', count: 5, pct: 62 },
    { label: 'Exam Prep', count: 4, pct: 50 },
    { label: 'Summary', count: 2, pct: 25 },
  ]
  return (
    <div className="w-full space-y-3">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3"
      >
        <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3">Question categories · Today</p>
        <div className="space-y-2.5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.07 + 0.1 }}
            >
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>{cat.label}</span>
                <span className="font-semibold">{cat.count}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.pct}%` }}
                  transition={{ delay: i * 0.07 + 0.25, duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-white/60 rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="grid grid-cols-2 gap-2"
      >
        {[
          { label: 'Questions asked', value: '19' },
          { label: 'Repeating topics', value: '3' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/15 rounded-xl px-4 py-3 text-center">
            <p className="text-white text-2xl font-bold">{stat.value}</p>
            <p className="text-white/60 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function SlideSession() {
  return (
    <div className="w-full space-y-2">
      {/* Card 1 — a classmate's question + AI answer, visible to all */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
            🦊
          </div>
          <span className="text-white/50 text-xs">Clever Fox · asked just now</span>
          <span className="ml-auto text-[10px] bg-amber-300/20 text-amber-200 rounded-full px-2 py-0.5 font-medium">Doubts</span>
        </div>
        <p className="text-white/85 text-xs leading-snug mb-2">
          Why does the learning rate matter so much in gradient descent?
        </p>
        <div className="border-t border-white/10 pt-2 flex items-start gap-2">
          <Sparkles className="w-3 h-3 text-amber-300 mt-0.5 flex-shrink-0" />
          <p className="text-white/55 text-[11px] leading-relaxed line-clamp-2">
            The learning rate α controls step size. Too large and you overshoot the minimum; too small and training takes forever…
          </p>
        </div>
      </motion.div>

      {/* Card 2 — another student forking/building on that question */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="bg-white/10 rounded-xl px-3.5 py-3 border border-white/15"
      >
        <div className="flex items-center gap-1.5 mb-2">
          {/* Fork indent line */}
          <div className="w-0.5 h-5 bg-white/25 rounded-full ml-1 mr-1" />
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] flex-shrink-0">
            🐢
          </div>
          <span className="text-white/45 text-[11px]">Wise Turtle built on this</span>
          <span className="ml-auto text-[10px] text-white/40 italic">forked</span>
        </div>
        <p className="text-white/75 text-xs leading-snug pl-4">
          Is there a rule of thumb for picking a learning rate, or do we always need to tune it?
        </p>
      </motion.div>

      {/* Card 3 — a third student reacting, showing peer signal */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.4 }}
        className="flex items-center gap-3 bg-white/10 rounded-xl px-3.5 py-2.5"
      >
        <div className="flex -space-x-1.5">
          {['🐺', '🦁', '🐸'].map((emoji) => (
            <div key={emoji} className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] border border-white/10">
              {emoji}
            </div>
          ))}
        </div>
        <p className="text-white/55 text-[11px]">
          <span className="text-white/80 font-medium">3 classmates</span> had the same question
        </p>
        <div className="ml-auto flex items-center gap-1 text-white/40 text-[11px]">
          <span>👍</span>
          <span>12</span>
        </div>
      </motion.div>
    </div>
  )
}

const SLIDES = [
  {
    label: 'Students ask questions',
    sublabel: 'AI answers instantly from course materials',
    Component: SlideAsk,
  },
  {
    label: 'Professor sees patterns',
    sublabel: 'Category breakdown, repeating topics, confusion clusters',
    Component: SlideInsights,
  },
  {
    label: 'Learn from each other, anonymously',
    sublabel: 'See classmates\' questions and build on them — no names, just curiosity',
    Component: SlideSession,
  },
]

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4500)
    return () => clearInterval(t)
  }, [paused])

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

  const CurrentSlide = SLIDES[slide].Component

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#d8d8e8',
    border: 'none',
    borderBottom: '2px solid #8686AC',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    fontFamily: "'Manrope', sans-serif",
    fontSize: '0.95rem',
    color: '#0F0E47',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden', background: '#f7f7fc' }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[58%] flex-shrink-0 relative"
        style={{
          background: 'linear-gradient(145deg, #0F0E47 0%, #272757 50%, #505081 100%)',
          clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)',
        }}
      >
        {/* Ambient glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(134,134,172,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-16 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(80,80,129,0.3) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-10" style={{ paddingRight: '14%' }}>

          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span style={{ fontFamily: "'Newsreader', 'Georgia', serif", fontSize: '1.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em', userSelect: 'none' }}>
              VibeLearning
            </span>
          </motion.div>

          {/* Hero text */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="my-8">
            <h1 style={{ fontFamily: "'Newsreader', 'Georgia', serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 700, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>
              AI-powered Q&amp;A<br />
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>for every classroom.</span>
            </h1>
            <p style={{ fontFamily: "'Manrope', sans-serif", marginTop: '1rem', color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.65, maxWidth: '28rem' }}>
              Students ask. AI answers from your materials. Professors see exactly where the class is confused.
            </p>
          </motion.div>

          {/* Feature slideshow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.2 }}
            className="flex-1 flex flex-col justify-end"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="mb-4 h-10">
              <AnimatePresence mode="wait">
                <motion.div key={slide} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                  <p style={{ fontFamily: "'Manrope', sans-serif", color: '#fff', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{SLIDES[slide].label}</p>
                  <p style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '0.2rem', margin: '0.2rem 0 0 0' }}>{SLIDES[slide].sublabel}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative min-h-[220px]">
              {/* Prev arrow */}
              <button
                onClick={() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)}
                style={{ position: 'absolute', left: '-2rem', top: '50%', transform: 'translateY(-50%)', width: '1.75rem', height: '1.75rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >‹</button>
              {/* Next arrow */}
              <button
                onClick={() => setSlide((s) => (s + 1) % SLIDES.length)}
                style={{ position: 'absolute', right: '-2rem', top: '50%', transform: 'translateY(-50%)', width: '1.75rem', height: '1.75rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >›</button>

              <AnimatePresence mode="wait">
                <motion.div key={slide} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}>
                  <CurrentSlide />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex gap-2 mt-6">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? '24px' : '6px', height: '6px', borderRadius: '3px', background: i === slide ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease' }} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f7f7fc' }}>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }} style={{ width: '100%', maxWidth: '420px' }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ marginBottom: '2rem' }}>
            <span style={{ fontFamily: "'Newsreader', 'Georgia', serif", fontSize: '1.8rem', fontWeight: 700, color: '#272757', letterSpacing: '-0.02em' }}>
              VibeLearning
            </span>
          </div>

          <h2 style={{ fontFamily: "'Newsreader', 'Georgia', serif", fontSize: '2rem', fontWeight: 700, color: '#0F0E47', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Welcome back
          </h2>
          <p style={{ fontFamily: "'Manrope', sans-serif", color: '#505081', fontSize: '0.95rem', margin: '0 0 2rem 0' }}>
            Sign in to access your dashboard
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#505081', display: 'block', marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderBottomColor = '#272757')}
                onBlur={e => (e.currentTarget.style.borderBottomColor = '#8686AC')}
              />
            </div>
            <div>
              <label style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#505081', display: 'block', marginBottom: '0.5rem' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderBottomColor = '#272757')}
                onBlur={e => (e.currentTarget.style.borderBottomColor = '#8686AC')}
              />
            </div>

            {error && (
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.8rem', color: '#c0392b', margin: 0, background: 'rgba(186,26,26,0.06)', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '0.25rem',
                width: '100%',
                background: isLoading ? '#8686AC' : 'linear-gradient(135deg, #272757, #505081)',
                color: '#fff',
                border: 'none',
                borderRadius: '9999px',
                padding: '1rem',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 20px 40px -12px rgba(15,14,71,0.12)',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ fontFamily: "'Manrope', sans-serif", textAlign: 'center', fontSize: '0.875rem', color: '#505081', marginTop: '1rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#272757', fontWeight: 700 }}>
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
