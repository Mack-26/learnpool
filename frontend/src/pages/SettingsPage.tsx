import { motion } from 'framer-motion'
import { Smile, BookOpen, Zap } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useSettingsStore } from '../store/settingsStore'
import type { Personality } from '../types/api'

const personalities: {
  value: Personality
  label: string
  desc: string
  icon: React.ElementType
}[] = [
  {
    value: 'supportive',
    label: 'Supportive Tutor',
    desc: 'Patient, encouraging, and step-by-step guidance. Great for building confidence.',
    icon: BookOpen,
  },
  {
    value: 'normal',
    label: 'Normal',
    desc: 'Clear and professional explanations. Direct and to the point.',
    icon: Zap,
  },
  {
    value: 'funny',
    label: 'Funny',
    desc: 'Light-hearted with tasteful humour to make learning enjoyable.',
    icon: Smile,
  },
]

export default function SettingsPage() {
  const { personality, setPersonality } = useSettingsStore()

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl"
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">AI Settings</h1>
        <p className="text-muted-foreground mb-6">
          Choose how the AI responds to your questions. Your choice is applied invisibly — only you benefit from it.
        </p>

        <div className="space-y-3">
          {personalities.map((p) => {
            const isSelected = personality === p.value
            return (
              <motion.button
                key={p.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPersonality(p.value)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-accent'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {p.label}
                    </p>
                    {isSelected && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{p.desc}</p>
                </div>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">How it works:</span> Your selected personality is
            sent as hidden context with every question you ask. The AI adjusts its tone accordingly —
            the professor and other students cannot see this preference.
          </p>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}
