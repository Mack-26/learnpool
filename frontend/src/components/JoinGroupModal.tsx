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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={close}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-foreground">Join a study group</h3>
          <button onClick={close} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Paste the code a classmate shared with you.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (code.trim()) { setError(null); mutation.mutate(code.trim()) } }}
          className="space-y-3"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. a3f8b2c1"
            aria-label="Group join code"
            maxLength={20}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={!code.trim() || mutation.isPending}>
            {mutation.isPending ? 'Joining…' : 'Join group'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
