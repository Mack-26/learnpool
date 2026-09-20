import { useCallback, useState } from 'react'

/** A collapsed/expanded flag remembered per key in localStorage (falls back to memory). */
export function useCollapsed(key: string, initial = false): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(`horizon.collapsed.${key}`)
      return raw === null ? initial : raw === '1'
    } catch {
      return initial
    }
  })
  const toggle = useCallback(() => {
    setCollapsed((c) => {
      try { localStorage.setItem(`horizon.collapsed.${key}`, c ? '0' : '1') } catch { /* private mode */ }
      return !c
    })
  }, [key])
  return [collapsed, toggle]
}
