import { useNavigate } from 'react-router-dom'
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
  { value: 'supportive', label: 'Supportive Tutor', desc: 'Patient, encouraging guidance.', icon: BookOpen },
  { value: 'normal', label: 'Normal', desc: 'Clear and professional.', icon: Zap },
  { value: 'funny', label: 'Funny', desc: 'Light-hearted with humour.', icon: Smile },
]

export default function ProfessorSettingsPage() {
  const navigate = useNavigate()
  const { personality, setPersonality } = useSettingsStore()

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl"
      >
        <button
          onClick={() => navigate('/instructor')}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground mb-6">Configure your preferences</p>

        <div className="space-y-3">
          {personalities.map((p) => {
            const isSelected = personality === p.value
            return (
              <motion.button
                key={p.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPersonality(p.value)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected ? 'border-primary bg-accent' : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {p.label}
                    </span>
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
      </motion.div>
    </DashboardLayout>
  )
}
