import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createGroup } from '../api/groups'
import type { GroupOut } from '../types/api'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (group: GroupOut) => void
}

export default function CreateGroupModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')

  const mutation = useMutation({
    mutationFn: () => createGroup(name.trim(), subject.trim() || undefined),
    onSuccess: (group) => {
      setName('')
      setSubject('')
      onCreated(group)
    },
  })

  if (!open) return null

  const close = () => {
    if (mutation.isPending) return
    setName('')
    setSubject('')
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
          <h3 className="text-base font-semibold text-foreground">Create a study group</h3>
          <button onClick={close} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">You'll get a code to share with classmates right after.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) mutation.mutate() }}
          className="space-y-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name, e.g. EECS 551"
            aria-label="Group name"
            maxLength={200}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional), e.g. Matrix Methods for ML"
            aria-label="Subject"
            maxLength={200}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {mutation.isError && (
            <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
          )}
          <Button type="submit" className="w-full" disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create group'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
