import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles } from 'lucide-react'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import HorizonLogo from '../components/HorizonLogo'


// ─── Feature Slide Mocks ────────────────────────────────────────────────────

function SlideIntelligence() {
  return (
    <div className="w-full space-y-2.5">
      {/* Student question — retrieval-aware, not generic */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex items-start gap-3"
      >
        <div className="mt-0.5 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/90 text-sm leading-snug">Why did the professor use L2 regularization instead of dropout in Lecture 7?</p>
          <span className="inline-block mt-1.5 text-[10px] font-semibold tracking-wide uppercase bg-white/20 text-white/80 rounded-full px-2 py-0.5">
            Doubts
          </span>
        </div>
      </motion.div>

      {/* AI answer with citation — shows this isn't ChatGPT */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="bg-white/10 rounded-xl px-4 py-3 border border-white/15"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3 h-3 text-amber-300 flex-shrink-0" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">Answered from Lecture 7 · Page 18</span>
        </div>
        <p className="text-white/75 text-xs leading-relaxed mb-2.5">
          L2 penalizes the squared magnitude of weights, keeping all features active with small values. Dropout randomly silences neurons, which…
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] bg-white/10 text-white/50 rounded-full px-2 py-0.5">📄 Lecture 7 · 96% relevance</span>
          <span className="text-[10px] text-white/40">31 students asked this</span>
        </div>
      </motion.div>

      {/* Input box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.32, duration: 0.4 }}
        className="bg-white/10 rounded-xl px-4 py-3 border border-white/20 border-dashed flex items-center gap-2"
      >
        <div className="flex-1 text-sm text-white/40 italic">Ask about your course materials…</div>
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white/70" />
        </div>
      </motion.div>
    </div>
  )
}

function SlideInsights() {
  const categories = [
    { label: 'Doubts', count: 8, pct: 100, trend: '↑ +3' },
    { label: 'Exam Prep', count: 5, pct: 62, trend: '↑ +2' },
    { label: 'Homework', count: 4, pct: 50, trend: '—' },
    { label: 'Summary', count: 2, pct: 25, trend: '↓ -1' },
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
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold ${cat.trend.startsWith('↑') ? 'text-emerald-300' : cat.trend.startsWith('↓') ? 'text-red-300' : 'text-white/40'}`}>{cat.trend} vs last session</span>
                  <span className="font-semibold">{cat.count}</span>
                </div>
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
        style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}
      >
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
        <p style={{ fontSize: '0.75rem', lineHeight: 1.5, color: 'rgba(253,230,138,0.8)', margin: 0 }}>
          <span style={{ fontWeight: 700, color: 'rgb(253,230,138)' }}>6 students</span> asked about learning rate selection — consider addressing it now
        </p>
      </motion.div>
    </div>
  )
}

function SlideArchive() {
  const questions = [
    {
      q: 'What happens when the learning rate is too high?',
      answer: 'If α is too large, the optimizer overshoots the minimum and may diverge entirely…',
      label: '✓ Discussed',
      labelBg: 'rgba(74,222,128,0.15)',
      labelColor: '#4ade80',
    },
    {
      q: 'Is Adam optimizer always better than vanilla SGD?',
      answer: 'In practice, adaptive methods converge faster but may generalize slightly worse…',
      label: '❌ Wrong Answer',
      labelBg: 'rgba(248,113,113,0.15)',
      labelColor: '#f87171',
    },
  ]
  return (
    <div className="w-full space-y-2">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between mb-1"
      >
        <span className="text-white/60 text-xs uppercase tracking-widest font-semibold">Lecture 4 — Released</span>
        <span className="text-[10px] bg-emerald-400/20 text-emerald-300 rounded-full px-2 py-0.5 font-semibold">● Released</span>
      </motion.div>

      {questions.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.14, duration: 0.4 }}
          className="bg-white/10 rounded-xl px-3.5 py-3 border border-white/10"
        >
          <p className="text-white/85 text-xs font-semibold leading-snug mb-1.5">{item.q}</p>
          <p className="text-white/45 text-[11px] leading-relaxed mb-2.5 line-clamp-2">{item.answer}</p>
          <span style={{ background: item.labelBg, color: item.labelColor }} className="text-[10px] font-semibold rounded-full px-2 py-0.5">
            {item.label}
          </span>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.35 }}
        style={{ background: 'rgba(134,239,172,0.1)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: '0.75rem', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem' }}>✅</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(134,239,172,0.9)' }}>Professor-reviewed</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Released to 31 students</span>
      </motion.div>
    </div>
  )
}

const SLIDES = [
  {
    label: 'Grounded in your course, not the internet',
    sublabel: 'Every answer cites the exact lecture page — nothing from outside your materials',
    Component: SlideIntelligence,
  },
  {
    label: 'Know what\'s confusing your class in real time',
    sublabel: 'Automatic categorisation, trend detection, and pattern alerts as questions come in',
    Component: SlideInsights,
  },
  {
    label: 'Professor-reviewed study archive',
    sublabel: 'Every answer labelled and released — a resource built live, from your class',
    Component: SlideArchive,
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
    borderRadius: '0.65rem',
    padding: '0.75rem 1rem',
    fontFamily: "'Manrope', sans-serif",
    fontSize: '0.95rem',
    color: '#0F0E47',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(15,14,71,0.08), inset 0 1px 2px rgba(15,14,71,0.04)',
    transition: 'box-shadow 0.2s ease',
  }

  return (
    <div>

      {/* ── Mobile: fullscreen scroll-snap sections (< lg) ── */}
      <div className="lg:hidden" style={{ height: '100svh', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}>
        {SLIDES.map(({ label, sublabel, Component }, i) => (
          <section key={i} style={{ minHeight: '100svh', scrollSnapAlign: 'start', scrollSnapStop: 'always', background: 'linear-gradient(145deg, #0F0E47 0%, #272757 55%, #505081 100%)', display: 'flex', flexDirection: 'column', padding: '2.5rem 1.5rem 2rem' }}>
            {i === 0 && <div style={{ marginBottom: '2rem' }}><HorizonLogo size="3rem" /></div>}
            {/* Progress bars */}
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.5rem' }}>
              {SLIDES.map((_, j) => (
                <div key={j} style={{ height: '2px', flex: 1, borderRadius: '2px', background: j === i ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }} />
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.25rem' }}>
              <div>
                <p style={{ fontFamily: "'Manrope', sans-serif", color: '#fff', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 0.4rem 0', lineHeight: 1.35 }}>{label}</p>
                <p style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', margin: 0, lineHeight: 1.55 }}>{sublabel}</p>
              </div>
              <Component />
            </div>
            <p style={{ fontFamily: "'Manrope', sans-serif", color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', margin: '1.5rem 0 0', textAlign: 'center', letterSpacing: '0.04em' }}>
              {i < SLIDES.length - 1 ? 'scroll for more ↓' : 'scroll to sign in ↓'}
            </p>
          </section>
        ))}
        {/* Form section */}
        <section style={{ minHeight: '100svh', scrollSnapAlign: 'start', background: '#f7f7fc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontFamily: "'Newsreader', 'Georgia', serif", fontSize: '1.6rem', fontWeight: 700, color: '#0F0E47', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Continue learning with your class
            </h2>
            <p style={{ fontFamily: "'Manrope', sans-serif", color: '#505081', fontSize: '0.875rem', margin: '0 0 2rem 0', lineHeight: 1.6 }}>
              Build on questions, uncover insights, and stay connected to what the class is discussing.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#505081', display: 'block', marginBottom: '0.5rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(39,39,87,0.25), 0 1px 3px rgba(15,14,71,0.08)')}
                  onBlur={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,14,71,0.08), inset 0 1px 2px rgba(15,14,71,0.04)')}
                />
              </div>
              <div>
                <label style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#505081', display: 'block', marginBottom: '0.5rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(39,39,87,0.25), 0 1px 3px rgba(15,14,71,0.08)')}
                  onBlur={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,14,71,0.08), inset 0 1px 2px rgba(15,14,71,0.04)')}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0 0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#d8d8e8' }} />
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.75rem', color: '#8686AC' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#d8d8e8' }} />
            </div>

            <Link
              to="/signup"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                background: 'transparent',
                color: '#272757',
                border: '1.5px solid rgba(39,39,87,0.35)',
                borderRadius: '9999px',
                padding: '0.875rem',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(39,39,87,0.05)'
                ;(e.currentTarget as HTMLElement).style.borderColor = '#272757'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(39,39,87,0.35)'
              }}
            >
              Get started here →
            </Link>
          </div>
        </section>
      </div>

      {/* ── Desktop layout (lg+) ── */}
      <div className="hidden lg:flex min-h-screen flex-col lg:flex-row overflow-hidden" style={{ background: '#f7f7fc' }}>

      {/* ── Left panel (desktop only) ── */}
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
            <HorizonLogo size="3.5rem" />
          </motion.div>

          {/* Hero text */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="my-8">
            <h1 style={{ fontFamily: "'Newsreader', 'Georgia', serif", fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 700, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>
              The intelligence layer<br />
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>for modern classrooms.</span>
            </h1>
            <p style={{ fontFamily: "'Manrope', sans-serif", marginTop: '1rem', color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.65, maxWidth: '28rem' }}>
              Real-time academic assistance and learning analytics powered by your course content.
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


          <h2 style={{ fontFamily: "'Newsreader', 'Georgia', serif", fontSize: '1.6rem', fontWeight: 700, color: '#0F0E47', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Continue learning with your class
          </h2>
          <p style={{ fontFamily: "'Manrope', sans-serif", color: '#505081', fontSize: '0.875rem', margin: '0 0 2rem 0', lineHeight: 1.6 }}>
            Build on questions, uncover insights, and stay connected to what the class is discussing.
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
                onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(39,39,87,0.25), 0 1px 3px rgba(15,14,71,0.08)')}
                onBlur={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,14,71,0.08), inset 0 1px 2px rgba(15,14,71,0.04)')}
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
                onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(39,39,87,0.25), 0 1px 3px rgba(15,14,71,0.08)')}
                onBlur={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,14,71,0.08), inset 0 1px 2px rgba(15,14,71,0.04)')}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0 0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#d8d8e8' }} />
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.75rem', color: '#8686AC' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#d8d8e8' }} />
          </div>

          <Link
            to="/signup"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              background: 'transparent',
              color: '#272757',
              border: '1.5px solid rgba(39,39,87,0.35)',
              borderRadius: '9999px',
              padding: '0.875rem',
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(39,39,87,0.05)'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#272757'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(39,39,87,0.35)'
            }}
          >
            Get started here →
          </Link>
        </motion.div>
      </div>
      </div>
    </div>
  )
}
