import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../api/auth'
import { useAuthStore } from '../store/authStore'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 720 : false)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 720)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  primary: '#272757',
  primaryContainer: '#505081',
  surface: '#f7f7fc',
  surfaceLow: '#ededf5',
  surfaceHigh: '#e2e2ee',
  surfaceHighest: '#d8d8e8',
  onSurface: '#0F0E47',
  onSurfaceVariant: '#505081',
  outlineVariant: '#8686AC',
  gradient: 'linear-gradient(135deg, #272757, #505081)',
  shadow: '0 20px 40px -12px rgba(15,14,71,0.12)',
}

const serif = "'Newsreader', 'Georgia', serif"
const sans = "'Manrope', sans-serif"

type Role = 'student' | 'professor'

// ── Step 1: Role Selection ────────────────────────────────────────────────────
function StepRole({ selected, onSelect }: { selected: Role | null; onSelect: (r: Role) => void }) {
  const mobile = useIsMobile()
  const roles: { role: Role; title: string; icon: string; desc: string }[] = [
    {
      role: 'student',
      title: 'Student',
      icon: '🎓',
      desc: 'Ask questions live. Get cited answers. See what your class is wrestling with.',
    },
    {
      role: 'professor',
      title: 'Instructor',
      icon: '📚',
      desc: 'Upload your materials, run live sessions, and know what\'s confusing your class.',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 3.25rem)', color: T.onSurface, margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Who are you here as?
        </h1>
        <p style={{ fontFamily: sans, fontSize: '0.9rem', color: T.onSurfaceVariant, marginTop: '0.75rem', lineHeight: 1.6, maxWidth: '440px', margin: '0.75rem auto 0' }}>
          AI answers from your professor's materials. Everyone learns together.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '1.25rem', width: '100%' }}>
        {roles.map(({ role, title, icon, desc }) => {
          const isSelected = selected === role
          return (
            <button
              key={role}
              onClick={() => onSelect(role)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '2rem 1.5rem',
                background: isSelected ? T.surfaceHighest : T.surfaceLow,
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: isSelected ? T.shadow : 'none',
                transition: 'all 0.25s ease',
                outline: isSelected ? `2px solid ${T.primary}` : '2px solid transparent',
              }}
            >
              {isSelected && (
                <span style={{
                  position: 'absolute', top: '0.75rem', right: '0.75rem',
                  width: '1.5rem', height: '1.5rem', borderRadius: '9999px',
                  background: T.gradient, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                }}>✓</span>
              )}
              <div style={{
                width: '5rem', height: '5rem', borderRadius: '9999px',
                background: isSelected ? T.gradient : T.surfaceHighest,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', marginBottom: '1.25rem',
                boxShadow: isSelected ? T.shadow : 'none',
                transition: 'all 0.25s ease',
              }}>
                {icon}
              </div>
              <h2 style={{ fontFamily: serif, fontSize: '1.25rem', color: T.onSurface, margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                {title}
              </h2>
              <p style={{ fontFamily: sans, fontSize: '0.8rem', color: T.onSurfaceVariant, lineHeight: 1.6, margin: 0 }}>
                {desc}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2: Course-Grounded AI ────────────────────────────────────────────────
function StepInsight() {
  const mobile = useIsMobile()
  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', gap: mobile ? '1.5rem' : '3rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: mobile ? 'center' : 'left', flex: mobile ? undefined : 1 }}>
        <span style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.primary, fontWeight: 700 }}>
          Course-Grounded AI
        </span>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', color: T.onSurface, margin: '0.5rem 0 0 0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          AI that actually knows your course.
        </h1>
        <p style={{ fontFamily: sans, fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.75rem', lineHeight: 1.65, maxWidth: mobile ? '440px' : 'none' }}>
          Your professor activates today's chapters. Every answer cites the exact page. Nothing from the internet — only your specific class.
        </p>
      </div>

      <div style={{ width: '100%', flex: mobile ? undefined : 1, background: T.surfaceLow, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: T.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <div style={{ background: T.gradient, borderRadius: '1rem 1rem 0.25rem 1rem', padding: '0.75rem 1rem', maxWidth: '80%' }}>
            <p style={{ fontFamily: sans, fontSize: '0.875rem', color: '#fff', margin: 0, lineHeight: 1.5 }}>
              What's the difference between supervised and unsupervised learning?
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: T.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem' }}>
            ✨
          </div>
          <div style={{ flex: 1, background: T.surfaceHighest, borderRadius: '0.25rem 1rem 1rem 1rem', padding: '0.875rem 1rem' }}>
            <p style={{ fontFamily: sans, fontSize: '0.65rem', color: T.primary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.4rem 0', fontWeight: 700 }}>
              ✨ Answered from Ch3_ML_Intro.pdf
            </p>
            <p style={{ fontFamily: sans, fontSize: '0.85rem', color: T.onSurface, lineHeight: 1.6, margin: '0 0 0.75rem 0' }}>
              Supervised learning trains on labelled examples where the correct answer is known. Unsupervised learning finds patterns in unlabelled data without a predefined output…
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: T.surfaceHigh, borderRadius: '9999px', padding: '0.2rem 0.65rem' }}>
              <span style={{ fontSize: '0.7rem' }}>📄</span>
              <span style={{ fontFamily: sans, fontSize: '0.65rem', color: T.onSurfaceVariant, fontWeight: 600 }}>Page 14 · 94% relevance</span>
            </div>
          </div>
        </div>

        <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, textAlign: 'center', margin: '1rem 0 0 0' }}>
          Nothing from outside the course. No guessing.
        </p>
      </div>
    </div>
  )
}

// ── Step 3: Shared Intelligence ───────────────────────────────────────────────
function StepBranch() {
  const mobile = useIsMobile()
  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', gap: mobile ? '1.5rem' : '3rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: mobile ? 'center' : 'left', flex: mobile ? undefined : 1 }}>
        <span style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.primary, fontWeight: 700 }}>
          Shared Intelligence
        </span>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', color: T.onSurface, margin: '0.5rem 0 0 0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Your class catches what AI gets wrong.
        </h1>
        <p style={{ fontFamily: sans, fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.75rem', lineHeight: 1.65, maxWidth: mobile ? '440px' : 'none' }}>
          Every answer is visible to the whole class, anonymously. Someone spots a mistake — everyone benefits. The crowd-checking that's missing from every private AI chat.
        </p>
      </div>

      <div style={{ width: '100%', flex: mobile ? undefined : 1, background: T.surfaceLow, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: T.shadow }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: T.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem' }}>
            ✨
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: sans, fontSize: '0.65rem', color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.3rem 0' }}>
              AI · Microeconomics_Ch4.pdf
            </p>
            <p style={{ fontFamily: sans, fontSize: '0.875rem', color: T.onSurface, lineHeight: 1.6, margin: 0 }}>
              Price elasticity measures consumer sensitivity to price.{' '}
              <span style={{ background: 'rgba(186,26,26,0.1)', color: '#c0392b', borderRadius: '0.2rem', padding: '0.05rem 0.2rem', textDecoration: 'underline dotted' }}>
                A perfectly inelastic good has elasticity of exactly 1.
              </span>
            </p>
          </div>
        </div>

        <div style={{ background: T.surfaceHighest, borderRadius: '0.5rem', padding: '0.875rem 1rem', borderLeft: `3px solid ${T.primary}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '9999px', background: T.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🦊</div>
            <span style={{ fontFamily: sans, fontSize: '0.75rem', color: T.onSurfaceVariant }}>Anonymous Peer</span>
            <span style={{ marginLeft: 'auto', fontFamily: sans, fontSize: '0.65rem', background: T.surfaceHigh, color: T.onSurfaceVariant, borderRadius: '9999px', padding: '0.15rem 0.5rem', fontWeight: 600 }}>
              Discussion
            </span>
          </div>
          <p style={{ fontFamily: sans, fontSize: '0.8rem', color: T.onSurface, lineHeight: 1.6, margin: 0 }}>
            Perfectly inelastic = elasticity of <strong>0</strong>, not 1. Elasticity of 1 is unit elastic.
          </p>
        </div>

        <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, margin: '1rem 0 0 0' }}>
          Anonymous — your name is never visible to classmates
        </p>
      </div>
    </div>
  )
}

// ── Student Step 4: Class Pulse ───────────────────────────────────────────────
function StepClassPulse() {
  const mobile = useIsMobile()
  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', gap: mobile ? '1.5rem' : '3rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: mobile ? 'center' : 'left', flex: mobile ? undefined : 1 }}>
        <span style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.primary, fontWeight: 700 }}>
          Class Pulse
        </span>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', color: T.onSurface, margin: '0.5rem 0 0 0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          See what your whole class is thinking.
        </h1>
        <p style={{ fontFamily: sans, fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.75rem', lineHeight: 1.65, maxWidth: mobile ? '440px' : 'none' }}>
          Questions sorted by category automatically. Upvote what confuses you. Jump straight to the answers that matter.
        </p>
      </div>

      <div style={{ width: '100%', flex: mobile ? undefined : 1, background: T.surfaceLow, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: T.shadow }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Doubts', count: 8, active: true },
            { label: 'Exam Prep', count: 5, active: false },
            { label: 'Summaries', count: 2, active: false },
            { label: 'Homework', count: 3, active: false },
          ].map(({ label, count, active }) => (
            <span key={label} style={{
              fontFamily: sans, fontSize: '0.7rem', fontWeight: 700,
              background: active ? T.gradient : T.surfaceHighest,
              color: active ? '#fff' : T.onSurfaceVariant,
              borderRadius: '9999px', padding: '0.25rem 0.7rem',
            }}>
              {label} ({count})
            </span>
          ))}
        </div>

        {[
          { avatar: '🦊', question: 'Why does the learning rate affect convergence so much?', votes: 12 },
          { avatar: '🐻', question: "What's the difference between bias and variance?", votes: 8 },
          { avatar: '🦅', question: 'Is regularisation the same as weight decay?', votes: 5 },
        ].map(({ avatar, question, votes }, i, arr) => (
          <div key={question} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 0',
            borderBottom: i < arr.length - 1 ? `1px solid ${T.surfaceHighest}` : 'none',
          }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: T.surfaceHighest, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.9rem' }}>
              {avatar}
            </div>
            <p style={{ fontFamily: sans, fontSize: '0.82rem', color: T.onSurface, margin: 0, flex: 1, lineHeight: 1.45 }}>
              {question}
            </p>
            <span style={{ fontFamily: sans, fontSize: '0.75rem', color: T.onSurfaceVariant, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
              👍 {votes}
            </span>
          </div>
        ))}

        <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, textAlign: 'center', margin: '1rem 0 0 0' }}>
          Ask your own or upvote what resonates — both help the class
        </p>
      </div>
    </div>
  )
}

// ── Student Step 5: Fork ───────────────────────────────────────────────────────
function StepFork() {
  const mobile = useIsMobile()
  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', gap: mobile ? '1.5rem' : '3rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: mobile ? 'center' : 'left', flex: mobile ? undefined : 1 }}>
        <span style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.primary, fontWeight: 700 }}>
          Fork &amp; Go Deeper
        </span>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', color: T.onSurface, margin: '0.5rem 0 0 0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Build on where someone else left off.
        </h1>
        <p style={{ fontFamily: sans, fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.75rem', lineHeight: 1.65, maxWidth: mobile ? '440px' : 'none' }}>
          See a question close to what you need? Fork it, add your angle, get a fresh answer grounded in the same materials. You're not starting from scratch.
        </p>
      </div>

      <div style={{ width: '100%', flex: mobile ? undefined : 1, background: T.surfaceLow, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: T.shadow }}>
        <div style={{ background: T.surfaceHighest, borderRadius: '0.75rem', padding: '1rem', opacity: 0.75 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '9999px', background: T.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🐻</div>
            <span style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant }}>Anonymous Peer · 12 min ago</span>
          </div>
          <p style={{ fontFamily: sans, fontSize: '0.85rem', color: T.onSurface, fontWeight: 600, margin: '0 0 0.4rem 0', lineHeight: 1.4 }}>
            How does gradient descent find the minimum?
          </p>
          <p style={{ fontFamily: sans, fontSize: '0.75rem', color: T.onSurfaceVariant, margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>
            It iteratively moves in the direction of steepest descent…
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: sans, fontSize: '0.65rem', fontWeight: 700, background: T.gradient, color: '#fff', borderRadius: '9999px', padding: '0.2rem 0.6rem' }}>
              Fork →
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 0' }}>
          <div style={{ width: '2px', height: '0.6rem', background: T.outlineVariant }} />
          <span style={{ fontFamily: sans, fontSize: '0.9rem', color: T.primary, fontWeight: 700, lineHeight: 1 }}>⑂</span>
          <div style={{ width: '2px', height: '0.6rem', background: T.outlineVariant }} />
        </div>

        <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1rem', outline: `2px solid ${T.primary}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '9999px', background: T.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', fontWeight: 700 }}>You</div>
            <span style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant }}>forked from above</span>
          </div>
          <p style={{ fontFamily: sans, fontSize: '0.85rem', color: T.onSurface, fontWeight: 600, margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
            What happens when gradient descent gets stuck in a local minimum?
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: T.surfaceLow, borderRadius: '9999px', padding: '0.2rem 0.65rem' }}>
            <span style={{ fontSize: '0.7rem' }}>✨</span>
            <span style={{ fontFamily: sans, fontSize: '0.65rem', color: T.primary, fontWeight: 600 }}>Answering from Ch3_Optimisation.pdf</span>
          </div>
        </div>

        <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, margin: '1rem 0 0 0' }}>
          Your fork builds on a shared question — the AI answers your exact angle from the same materials.
        </p>
      </div>
    </div>
  )
}

// ── Step 6: Account Creation ───────────────────────────────────────────────────
function StepCreate({
  role,
  onSubmit,
  onBack,
  isLoading,
  error,
}: {
  role: Role
  onSubmit: (displayName: string, email: string, password: string) => void
  onBack: () => void
  isLoading: boolean
  error: string | null
}) {
  const mobile = useIsMobile()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: T.surfaceHighest,
    border: 'none',
    borderBottom: `2px solid ${T.outlineVariant}`,
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem 0.75rem 2.75rem',
    fontFamily: sans,
    fontSize: '0.95rem',
    color: T.onSurface,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? '1.5rem' : '3rem', width: '100%', maxWidth: '900px', margin: '0 auto', alignItems: 'center' }}>
      {/* Left: celebration */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '9999px', background: T.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: T.shadow, flexShrink: 0 }}>
            🏆
          </div>
          <div>
            <span style={{ fontFamily: sans, fontSize: '0.7rem', color: T.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '0.2rem' }}>
              Last step
            </span>
            <h1 style={{ fontFamily: serif, fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: T.onSurface, margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Create your account
            </h1>
          </div>
        </div>
        <p style={{ fontFamily: sans, fontSize: '0.95rem', color: T.onSurfaceVariant, lineHeight: 1.65, margin: 0 }}>
          {role === 'student'
            ? 'You know how it works. Now join your class.'
            : 'Ready to run your first session. Let\'s get you set up.'}
        </p>
      </div>

      {/* Right: signup form */}
      <div style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '1.5rem',
        padding: '2rem',
        boxShadow: T.shadow,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-3rem', right: '-3rem', width: '8rem', height: '8rem', background: 'rgba(39,39,87,0.05)', borderRadius: '9999px', filter: 'blur(24px)' }} />

        <h2 style={{ fontFamily: serif, fontSize: '1.5rem', color: T.onSurface, margin: '0 0 0.25rem 0', position: 'relative' }}>Almost there</h2>
        <p style={{ fontFamily: sans, fontSize: '0.8rem', color: T.onSurfaceVariant, margin: '0 0 1.75rem 0', position: 'relative' }}>Your role is saved — just create your credentials.</p>

        <form
          onSubmit={(e: FormEvent) => { e.preventDefault(); onSubmit(displayName, email, password) }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}
        >
          <div>
            <label style={{ fontFamily: sans, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, display: 'block', marginBottom: '0.5rem' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: T.onSurfaceVariant, fontSize: '1.1rem', userSelect: 'none' }}>👤</span>
              <input
                type="text"
                placeholder="Your full name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderBottomColor = T.primary)}
                onBlur={e => (e.currentTarget.style.borderBottomColor = T.outlineVariant)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontFamily: sans, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, display: 'block', marginBottom: '0.5rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: T.onSurfaceVariant, fontSize: '1.1rem', userSelect: 'none' }}>✉️</span>
              <input
                type="email"
                placeholder="scholar@academy.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderBottomColor = T.primary)}
                onBlur={e => (e.currentTarget.style.borderBottomColor = T.outlineVariant)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontFamily: sans, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, display: 'block', marginBottom: '0.5rem' }}>
              Secure Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: T.onSurfaceVariant, fontSize: '1.1rem', userSelect: 'none' }}>🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderBottomColor = T.primary)}
                onBlur={e => (e.currentTarget.style.borderBottomColor = T.outlineVariant)}
              />
            </div>
          </div>

          {error && (
            <p style={{ fontFamily: sans, fontSize: '0.8rem', color: '#c0392b', margin: 0, background: 'rgba(186,26,26,0.06)', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              background: isLoading ? T.outlineVariant : T.gradient,
              color: '#fff',
              border: 'none',
              borderRadius: '9999px',
              padding: '1rem',
              fontFamily: sans,
              fontWeight: 700,
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: isLoading ? 'none' : T.shadow,
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'Creating your account…' : <>Create Account →</>}
          </button>
        </form>

        <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, textAlign: 'center', marginTop: '1.25rem' }}>
          By creating an account, you agree to our Terms of Service.
        </p>
        <button
          type="button"
          onClick={onBack}
          style={{ display: 'block', margin: '0.5rem auto 0', background: 'none', border: 'none', fontFamily: sans, fontSize: '0.8rem', color: T.onSurfaceVariant, cursor: 'pointer', padding: '0.25rem 0' }}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

// ── Instructor Step 2: Session Setup ─────────────────────────────────────────
function StepInstructorSetup() {
  const mobile = useIsMobile()
  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', gap: mobile ? '1.5rem' : '3rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: mobile ? 'center' : 'left', flex: mobile ? undefined : 1 }}>
        <span style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.primary, fontWeight: 700 }}>
          Session Setup
        </span>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', color: T.onSurface, margin: '0.5rem 0 0 0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Build your lecture in minutes.
        </h1>
        <p style={{ fontFamily: sans, fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.75rem', lineHeight: 1.65, maxWidth: mobile ? '440px' : 'none' }}>
          Create a session, name it, pick today's chapters. The AI reads only what you activate — nothing from last week bleeds in.
        </p>
      </div>

      <div style={{ width: '100%', flex: mobile ? undefined : 1, background: T.surfaceLow, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: T.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '1.25rem' }}>
          {[
            { num: '①', label: 'Course', done: true },
            { num: '②', label: 'Session', done: true },
            { num: '③', label: 'Materials', done: false, active: true },
          ].map(({ num, label, done, active }, i, arr) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                <span style={{ fontFamily: sans, fontSize: '0.85rem', fontWeight: 700, color: done || active ? T.primary : T.outlineVariant }}>{num}</span>
                <span style={{ fontFamily: sans, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: done || active ? T.primary : T.outlineVariant, fontWeight: active ? 700 : 400 }}>{label}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ flex: 1, height: '1px', background: done ? T.primary : T.surfaceHighest, margin: '0 0.5rem', marginBottom: '1rem' }} />
              )}
            </div>
          ))}
        </div>

        <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, margin: '0 0 1rem 0' }}>
          Intro to Machine Learning <span style={{ color: T.outlineVariant }}>›</span> <strong style={{ color: T.onSurface }}>Lecture 4: Gradient Descent</strong>
        </p>

        <p style={{ fontFamily: sans, fontSize: '0.65rem', color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem 0' }}>Activate for today</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { name: 'Ch4_Gradient_Descent.pdf', pages: '18 pages', active: true },
            { name: 'Ch3_Loss_Functions.pdf', pages: '12 pages', active: true },
            { name: 'Old_Notes_2022.pdf', pages: '34 pages', active: false },
          ].map(({ name, pages, active }) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: active ? T.surfaceHighest : 'transparent',
              borderRadius: '0.5rem', padding: '0.6rem 0.75rem',
              opacity: active ? 1 : 0.45,
            }}>
              <span style={{ fontSize: '1rem' }}>📄</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: sans, fontSize: '0.8rem', color: T.onSurface, margin: 0, fontWeight: 600 }}>{name}</p>
                <p style={{ fontFamily: sans, fontSize: '0.65rem', color: T.onSurfaceVariant, margin: 0 }}>{pages}</p>
              </div>
              <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '9999px', background: active ? T.gradient : T.surfaceHighest, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                {active ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: T.gradient, borderRadius: '9999px', padding: '0.75rem 1.5rem', textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontFamily: sans, fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Go Live →</span>
        </div>
        <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, textAlign: 'center', margin: 0 }}>
          Students can join as soon as you go live
        </p>
      </div>
    </div>
  )
}

// ── Instructor Step 3: Live Session ──────────────────────────────────────────
function StepInstructorLive() {
  const mobile = useIsMobile()
  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', gap: mobile ? '1.5rem' : '3rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: mobile ? 'center' : 'left', flex: mobile ? undefined : 1 }}>
        <span style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.primary, fontWeight: 700 }}>
          Live Session
        </span>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', color: T.onSurface, margin: '0.5rem 0 0 0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Watch your class think in real time.
        </h1>
        <p style={{ fontFamily: sans, fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.75rem', lineHeight: 1.65, maxWidth: mobile ? '440px' : 'none' }}>
          Questions flow in anonymously, answered instantly, categorised automatically. If six students ask the same thing — you'll see it before class ends.
        </p>
      </div>

      <div style={{ width: '100%', flex: mobile ? undefined : 1, background: T.surfaceLow, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: T.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ fontFamily: serif, fontSize: '1rem', color: T.onSurface, margin: 0, fontWeight: 600 }}>Lecture 4 · Gradient Descent</p>
            <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, margin: '0.2rem 0 0 0' }}>31 students joined</p>
          </div>
          <span style={{ fontFamily: sans, fontSize: '0.65rem', background: '#dcfce7', color: '#166534', borderRadius: '9999px', padding: '0.25rem 0.7rem', fontWeight: 700 }}>● Live</span>
        </div>

        {[
          { tag: 'Doubts', q: 'Why does momentum help escape local minima?', time: 'just now' },
          { tag: 'Exam Prep', q: 'Is Adam always better than SGD for practical use?', time: '1 min ago' },
          { tag: 'Doubts', q: "What's the intuition behind the gradient direction?", time: '2 min ago' },
        ].map(({ tag, q, time }, i, arr) => (
          <div key={q} style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
            padding: '0.65rem 0',
            borderBottom: i < arr.length - 1 ? `1px solid ${T.surfaceHighest}` : 'none',
          }}>
            <span style={{ fontFamily: sans, fontSize: '0.65rem', fontWeight: 700, background: T.surfaceHighest, color: T.onSurfaceVariant, borderRadius: '9999px', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '0.1rem' }}>
              {tag}
            </span>
            <p style={{ fontFamily: sans, fontSize: '0.82rem', color: T.onSurface, margin: 0, flex: 1, lineHeight: 1.4 }}>{q}</p>
            <span style={{ fontFamily: sans, fontSize: '0.65rem', color: T.outlineVariant, whiteSpace: 'nowrap', flexShrink: 0, marginTop: '0.1rem' }}>{time}</span>
          </div>
        ))}

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>⚠️</span>
          <p style={{ fontFamily: sans, fontSize: '0.75rem', color: '#92400e', margin: 0, lineHeight: 1.45 }}>
            6 students have asked about learning rate selection — consider addressing it now
          </p>
        </div>

        <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, textAlign: 'center', margin: '1rem 0 0 0' }}>
          End session when class is done — then review before releasing
        </p>
      </div>
    </div>
  )
}

// ── Instructor Step 4: Post-Class Review ──────────────────────────────────────
function StepInstructorReview() {
  const mobile = useIsMobile()
  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', gap: mobile ? '1.5rem' : '3rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: mobile ? 'center' : 'left', flex: mobile ? undefined : 1 }}>
        <span style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.primary, fontWeight: 700 }}>
          Post-Class Review
        </span>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', color: T.onSurface, margin: '0.5rem 0 0 0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Review before your students see it.
        </h1>
        <p style={{ fontFamily: sans, fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.75rem', lineHeight: 1.65, maxWidth: mobile ? '440px' : 'none' }}>
          After class, read through every AI answer. Label what you covered, flag anything wrong. Your notes become part of what students see when it's released.
        </p>
      </div>

      <div style={{ width: '100%', flex: mobile ? undefined : 1, background: T.surfaceLow, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: T.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <p style={{ fontFamily: serif, fontSize: '0.95rem', color: T.onSurface, margin: 0, fontWeight: 600 }}>Lecture 4 · Gradient Descent</p>
          <span style={{ fontFamily: sans, fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', borderRadius: '9999px', padding: '0.2rem 0.65rem', fontWeight: 700 }}>Pending Review</span>
        </div>

        <div style={{ background: T.surfaceHighest, borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: sans, fontSize: '0.65rem', fontWeight: 700, background: '#e2e2ee', color: '#272757', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>Doubts</span>
            <span style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, marginLeft: 'auto' }}>👍 11 · 👎 1</span>
          </div>
          <p style={{ fontFamily: sans, fontSize: '0.85rem', color: T.onSurface, fontWeight: 600, margin: '0 0 0.4rem 0', lineHeight: 1.4 }}>
            What happens to gradient descent when the learning rate is too high?
          </p>
          <p style={{ fontFamily: sans, fontSize: '0.75rem', color: T.onSurfaceVariant, margin: '0 0 0.875rem 0', lineHeight: 1.55 }}>
            If α is too large, the optimizer overshoots the minimum and may diverge entirely…
          </p>

          <p style={{ fontFamily: sans, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.onSurfaceVariant, margin: '0 0 0.5rem 0' }}>Professor Labels</p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { emoji: '✓', label: 'Discussed', active: true },
              { emoji: '❌', label: 'Wrong Answer', active: false },
              { emoji: '⚠️', label: 'Misleading', active: false },
              { emoji: '🔄', label: 'Follow-up', active: false },
            ].map(({ emoji, label, active }) => (
              <span key={label} style={{ fontFamily: sans, fontSize: '0.7rem', fontWeight: 600, background: active ? T.gradient : T.surfaceLow, color: active ? '#fff' : T.onSurfaceVariant, borderRadius: '9999px', padding: '0.25rem 0.6rem' }}>
                {emoji} {label}
              </span>
            ))}
          </div>
        </div>

        <p style={{ fontFamily: sans, fontSize: '0.75rem', color: T.onSurfaceVariant, margin: 0, fontWeight: 500 }}>
          Reviewed <strong style={{ color: T.onSurface }}>14</strong> of 19 questions
        </p>
      </div>
    </div>
  )
}

// ── Instructor Step 5: Release ─────────────────────────────────────────────────
function StepInstructorRelease() {
  const mobile = useIsMobile()
  return (
    <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', gap: mobile ? '1.5rem' : '3rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: mobile ? 'center' : 'left', flex: mobile ? undefined : 1 }}>
        <span style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.primary, fontWeight: 700 }}>
          Release
        </span>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(1.75rem, 3vw, 2.75rem)', color: T.onSurface, margin: '0.5rem 0 0 0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          One tap. Your class gets the whole thread.
        </h1>
        <p style={{ fontFamily: sans, fontSize: '0.95rem', color: T.onSurfaceVariant, marginTop: '0.75rem', lineHeight: 1.65, maxWidth: mobile ? '440px' : 'none' }}>
          Every question, every AI answer, your labels. A study resource built live — grounded in your exact materials.
        </p>
      </div>

      <div style={{ width: '100%', flex: mobile ? undefined : 1, background: T.surfaceLow, borderRadius: '0.75rem', padding: '1.5rem', boxShadow: T.shadow }}>
        <div style={{ background: T.surfaceHighest, borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: serif, fontSize: '0.95rem', color: T.onSurface, margin: 0, fontWeight: 600 }}>Lecture 4 — Review Complete</p>
            <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, margin: '0.2rem 0 0 0' }}>19 questions reviewed</p>
          </div>
          <div style={{ background: T.gradient, borderRadius: '9999px', padding: '0.5rem 1rem', flexShrink: 0 }}>
            <span style={{ fontFamily: sans, fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Release →</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: T.surfaceHighest }} />
          <span style={{ fontFamily: sans, fontSize: '0.65rem', color: T.outlineVariant, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Students will receive</span>
          <div style={{ flex: 1, height: '1px', background: T.surfaceHighest }} />
        </div>

        <div style={{ border: `1.5px solid ${T.surfaceHighest}`, borderRadius: '0.75rem', padding: '1rem', opacity: 0.9 }}>
          <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem 0' }}>Lecture 4 — Released · 19 questions</p>
          {[
            { q: 'What happens to gradient descent when the learning rate is too high?', label: '✓ Discussed', labelColor: T.gradient, labelText: '#fff' },
            { q: 'Is Adam optimizer always better than vanilla SGD?', label: '❌ Wrong Answer', labelColor: '#fee2e2', labelText: '#c0392b' },
          ].map(({ q, label, labelColor, labelText }) => (
            <div key={q} style={{ padding: '0.6rem 0', borderBottom: `1px solid ${T.surfaceHighest}` }}>
              <p style={{ fontFamily: sans, fontSize: '0.8rem', color: T.onSurface, margin: '0 0 0.35rem 0', lineHeight: 1.4 }}>{q}</p>
              <span style={{ fontFamily: sans, fontSize: '0.65rem', fontWeight: 700, background: labelColor, color: labelText, borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{label}</span>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: sans, fontSize: '0.7rem', color: T.outlineVariant, textAlign: 'center', margin: '1rem 0 0 0' }}>
          Released sessions are read-only. Nothing can be changed after release.
        </p>
      </div>
    </div>
  )
}

// ── Progress Indicator ────────────────────────────────────────────────────────
function ProgressBar({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div style={{ width: '100%', maxWidth: `${labels.length * 100}px`, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        {/* Track — top: 1rem centers on the 2rem-tall circle */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '1rem', transform: 'translateY(-50%)', height: '3px', background: T.surfaceHighest, borderRadius: '9999px', zIndex: 0 }} />
        <div style={{ position: 'absolute', left: 0, top: '1rem', transform: 'translateY(-50%)', height: '3px', background: T.gradient, borderRadius: '9999px', zIndex: 0, width: `${(step / (labels.length - 1)) * 100}%`, transition: 'width 0.4s ease' }} />

        {labels.map((label, i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '0.4rem' }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '9999px',
                background: done || active ? T.gradient : T.surfaceHighest,
                color: done || active ? '#fff' : T.onSurfaceVariant,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: sans, fontSize: '0.8rem', fontWeight: 700,
                boxShadow: active ? T.shadow : 'none',
                transition: 'all 0.3s ease',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontFamily: sans, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: i <= step ? T.primary : T.onSurfaceVariant, fontWeight: i === step ? 700 : 400, transition: 'color 0.3s ease', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const touchStartX = useRef<number | null>(null)

  const canContinue = step === 0 ? role !== null : true
  const maxStep = 5

  const next = () => setStep((s) => Math.min(s + 1, maxStep))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  async function handleSignup(displayName: string, email: string, password: string) {
    if (!role) return
    setError(null)
    setIsLoading(true)
    try {
      const data = await signup({ email, password, display_name: displayName, role })
      setAuth(data.access_token, {
        user_id: data.user_id,
        display_name: data.display_name,
        role: data.role,
      })
      navigate(data.role === 'professor' ? '/instructor' : '/classes')
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response
        : null
      setError(res?.data?.detail ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(1.25rem, 3vw, 2rem) clamp(1.25rem, 5vw, 3rem)', paddingBottom: step < maxStep ? '6rem' : 'clamp(1.25rem, 3vw, 2rem)' }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '-8rem', left: '20%', width: '24rem', height: '24rem', background: T.primary, opacity: 0.04, filter: 'blur(80px)', borderRadius: '9999px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-8rem', right: '15%', width: '30rem', height: '30rem', background: T.primaryContainer, opacity: 0.04, filter: 'blur(100px)', borderRadius: '9999px', pointerEvents: 'none' }} />

      {/* Top progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', display: 'flex', gap: '2px', zIndex: 50 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ flex: 1, background: i <= step ? T.primary : T.surfaceHighest, transition: 'background 0.4s ease' }} />
        ))}
      </div>

      {/* Logo */}
      <div style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <span style={{ fontFamily: serif, fontSize: '1.4rem', fontWeight: 700, color: T.primary, letterSpacing: '-0.02em' }}>
          VibeLearning
        </span>
        <a href="/login" style={{ fontFamily: sans, fontSize: '0.8rem', color: T.onSurfaceVariant, textDecoration: 'none' }}>
          Already a member? Sign in →
        </a>
      </div>

      {/* Progress indicator */}
      <div style={{ marginBottom: '2rem', width: '100%', maxWidth: '900px' }}>
        <ProgressBar
          step={step}
          labels={role === 'professor'
            ? ['Role', 'Setup', 'Live', 'Review', 'Release', 'Ready']
            : ['Role', 'Grounded', 'Verified', 'Pulse', 'Fork', 'Ready']}
        />
      </div>

      {/* Step content */}
      <div
        style={{ width: '100%', maxWidth: '900px', flex: 1 }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || step === maxStep) return
          const delta = touchStartX.current - e.changedTouches[0].clientX
          if (delta > 60 && canContinue) next()
          if (delta < -60 && step > 0) back()
          touchStartX.current = null
        }}
      >
        {step === 0 && <StepRole selected={role} onSelect={setRole} />}
        {step === 1 && role !== 'professor' && <StepInsight />}
        {step === 1 && role === 'professor' && <StepInstructorSetup />}
        {step === 2 && role !== 'professor' && <StepBranch />}
        {step === 2 && role === 'professor' && <StepInstructorLive />}
        {step === 3 && role !== 'professor' && <StepClassPulse />}
        {step === 3 && role === 'professor' && <StepInstructorReview />}
        {step === 4 && role !== 'professor' && <StepFork />}
        {step === 4 && role === 'professor' && <StepInstructorRelease />}
        {step === 5 && (
          <StepCreate
            role={role!}
            onSubmit={handleSignup}
            onBack={back}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>

      {/* MA mark — fixed bottom right */}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.75rem', zIndex: 39, pointerEvents: 'none' }}>
        <span style={{ fontFamily: serif, fontSize: '2.5rem', fontWeight: 700, color: T.primary, letterSpacing: '-0.06em', lineHeight: 1, fontStyle: 'italic', opacity: 0.22 }}>
          MA
        </span>
      </div>

      {/* Fixed bottom navigation — always at the same position, never jumps */}
      {step < maxStep && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.75rem 1.5rem 1.25rem',
          background: `linear-gradient(to bottom, transparent, ${T.surface} 28%)`,
          zIndex: 40,
        }}>
          {/* Button row: Back absolute-left, Continue centered */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '480px' }}>
            <button
              onClick={back}
              style={{
                position: 'absolute',
                left: 0,
                visibility: step > 0 ? 'visible' : 'hidden',
                background: 'none',
                border: `1.5px solid ${T.outlineVariant}`,
                borderRadius: '9999px',
                padding: '0.75rem 1.5rem',
                fontFamily: sans,
                fontWeight: 600,
                fontSize: '0.875rem',
                color: T.onSurfaceVariant,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ← Back
            </button>
            <button
              onClick={next}
              disabled={!canContinue}
              style={{
                background: canContinue ? T.gradient : T.outlineVariant,
                color: '#fff',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.875rem 2.5rem',
                minWidth: '10rem',
                fontFamily: sans,
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: canContinue ? 'pointer' : 'not-allowed',
                boxShadow: canContinue ? T.shadow : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Continue
            </button>
          </div>
          <button
            onClick={next}
            style={{
              visibility: step > 0 ? 'visible' : 'hidden',
              background: 'none',
              border: 'none',
              fontFamily: sans,
              fontSize: '0.8rem',
              color: T.onSurfaceVariant,
              cursor: 'pointer',
              padding: '0.25rem 0.75rem',
            }}
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  )
}
