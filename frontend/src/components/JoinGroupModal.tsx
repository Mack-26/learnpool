import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { joinGroup } from '../api/groups'
import type { GroupOut } from '../types/api'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onClose: () => void
  onJoined: (group: GroupOut, alreadyMember: boolean) => void
}

export default function JoinGroupModal({ open, onClose, onJoined }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (joinCode: string) => joinGroup(joinCode),
    onSuccess: (res) => {
      setCode('')
      setError(null)
      onJoined(res.group, res.already_member)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(status === 404 ? "That code doesn't match any group." : 'Something went wrong. Please try again.')
    },
  })

  if (!open) return null

  const close = () => {
    if (mutation.isPending) return
    setCode('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={close}>
      <div className="absolute inset-0 bg-foreground/35" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm rounded-2xl border border-input bg-card p-6 elevated-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-foreground tracking-[-0.02em]">Join a study group</h3>
          <button onClick={close} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-2 -m-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-4">Paste the invite link or code a classmate shared with you.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            // Accept a pasted invite link as well as a bare code.
            const raw = code.trim().replace(/\/+$/, '')
            const value = raw.includes('/') ? raw.slice(raw.lastIndexOf('/') + 1) : raw
            if (value) { setError(null); mutation.mutate(value) }
          }}
          className="space-y-3"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="horizonlabs.live/join/a3f8b2c1"
            aria-label="Group join code"
            maxLength={200}
            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm mono text-foreground placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-ring/30"
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full h-10" disabled={!code.trim() || mutation.isPending}>
            {mutation.isPending ? 'Joining…' : 'Join group'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
