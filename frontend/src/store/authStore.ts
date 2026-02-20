import { create } from 'zustand'

interface AuthUser {
  user_id: string
  display_name: string
  role: string
  email?: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
}

const STORAGE_KEY = 'learnpool_auth'

function loadFromStorage(): { token: string | null; user: AuthUser | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { token: null, user: null }
  } catch {
    return { token: null, user: null }
  }
}

const initial = loadFromStorage()

export const useAuthStore = create<AuthState>()((set) => ({
  token: initial.token,
  user: initial.user,

  setAuth: (token, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null })
  },
}))
