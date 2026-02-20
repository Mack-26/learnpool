import { create } from 'zustand'
import type { Personality } from '../types/api'

interface SettingsState {
  personality: Personality
  setPersonality: (p: Personality) => void
}

const STORAGE_KEY = 'learnpool_settings'

function load(): Personality {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (['supportive', 'normal', 'funny'].includes(parsed.personality)) {
        return parsed.personality as Personality
      }
    }
  } catch { /* ignore */ }
  return 'supportive'
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  personality: load(),
  setPersonality: (personality) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ personality }))
    set({ personality })
  },
}))
