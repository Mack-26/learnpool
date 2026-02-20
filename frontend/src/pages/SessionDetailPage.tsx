import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Radio, BarChart3, Settings } from 'lucide-react'
import { checkSession } from '../api/sessions'
import DashboardLayout from '@/components/DashboardLayout'
import { Badge } from '@/components/ui/badge'

const cards = [
  {
    icon: Radio,
    title: 'Join Session',
    description: 'Ask questions and get AI-powered answers from course materials',
    path: 'chat',
    accent: true,
  },
  {
    icon: BarChart3,
    title: 'Class Questions',
    description: 'View all questions asked in this session — anonymised class report',
    path: 'report',
    accent: false,
  },
  {
    icon: Settings,
    title: 'AI Settings',
    description: 'Customise how the AI responds to you (supportive, normal, or funny)',
    path: 'settings',
    accent: false,
  },
]

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const { data: check, isLoading } = useQuery({
    queryKey: ['session-check', sessionId],
    queryFn: () => checkSession(sessionId!),
    retry: false,
  })

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading session…</p>
      </DashboardLayout>
    )
  }

  const isActive = check?.session_status === 'active'

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">Session</h1>
          {isActive ? (
            <Badge className="gradient-primary text-white border-0 animate-pulse text-xs">● Live</Badge>
          ) : check && (
            <Badge variant="outline" className="text-xs capitalize">{check.session_status}</Badge>
          )}
        </div>
        <p className="text-muted-foreground mb-8">Choose an action for this session</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
          {cards.map((card, i) => (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              onClick={() => navigate(`/sessions/${sessionId}/${card.path}`)}
              disabled={card.path === 'chat' && !isActive}
              className={`p-6 rounded-xl border-2 text-left transition-all group disabled:opacity-40 disabled:cursor-not-allowed ${
                card.accent
                  ? 'border-primary/30 bg-accent hover:border-primary hover:hover-shadow'
                  : 'border-border bg-card hover:border-primary/40 hover:hover-shadow'
              }`}
            >
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  card.accent
                    ? 'gradient-primary text-white'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                }`}
              >
                <card.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
              {card.path === 'chat' && !isActive && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Only available when session is live
                </p>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
