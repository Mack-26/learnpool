import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark } from 'lucide-react'
import { getSavedAnswers, unsaveAnswer } from '../api/sessions'
import DashboardLayout from '@/components/DashboardLayout'
import { renderAnswerWithCitations } from '@/components/AnswerRenderer'
import type { SavedAnswerOut } from '../types/api'

export function SavedAnswersList() {
  const queryClient = useQueryClient()
  const [confirmUnsaveId, setConfirmUnsaveId] = useState<string | null>(null)

  const { data: saved = [], isLoading } = useQuery({
    queryKey: ['saved-answers'],
    queryFn: getSavedAnswers,
  })

  const handleUnsave = async (answerId: string) => {
    setConfirmUnsaveId(null)
    queryClient.setQueryData<SavedAnswerOut[]>(['saved-answers'], (prev) =>
      prev ? prev.filter((s) => s.answer_id !== answerId) : []
    )
    await unsaveAnswer(answerId).catch(() => {
      queryClient.invalidateQueries({ queryKey: ['saved-answers'] })
    })
  }

  // Group by session
  const groups: { sessionId: string; sessionTitle: string; items: SavedAnswerOut[] }[] = []
  const seen = new Set<string>()
  for (const item of saved) {
    if (!seen.has(item.session_id)) {
      seen.add(item.session_id)
      groups.push({ sessionId: item.session_id, sessionTitle: item.session_title, items: [] })
    }
    groups.find((g) => g.sessionId === item.session_id)!.items.push(item)
  }

  return (
    <>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
            <div className="h-14 w-14 rounded-2xl bg-accent border border-[var(--ai-border)] flex items-center justify-center">
              <Bookmark className="h-7 w-7 text-primary opacity-70" />
            </div>
            <div>
              <p className="text-base font-medium text-foreground">No saved answers yet</p>
              <p className="text-sm mt-1">Click the bookmark icon on any AI answer to save it here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 w-full">
            {groups.map((group, gi) => (
              <div key={group.sessionId}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {group.sessionTitle}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.items.map((item, i) => (
                    <motion.div
                      key={item.save_id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (gi * 3 + i) * 0.04, duration: 0.3 }}
                      className="relative rounded-xl border border-border bg-card p-4"
                    >
                      {/* Unsave button with confirmation */}
                      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {confirmUnsaveId === item.answer_id ? (
                          <>
                            <span className="text-xs text-muted-foreground">Remove?</span>
                            <button
                              onClick={() => handleUnsave(item.answer_id)}
                              className="text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/15 border-0 rounded px-2 py-0.5 transition-colors"
                            >Yes</button>
                            <button
                              onClick={() => setConfirmUnsaveId(null)}
                              className="text-xs text-muted-foreground hover:text-foreground bg-transparent border-0 px-1.5 py-0.5 transition-colors"
                            >No</button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmUnsaveId(item.answer_id)}
                            title="Remove from notes"
                            className="bg-transparent border-0 text-primary p-1 rounded-md flex items-center hover:opacity-60 transition-opacity"
                          >
                            <Bookmark className="h-4 w-4" fill="currentColor" />
                          </button>
                        )}
                      </div>

                      {/* Question */}
                      <p className="text-xs text-muted-foreground mb-2 pr-8 font-medium">
                        Q: {item.question_content}
                      </p>

                      {/* Answer */}
                      <div className="rounded-lg bg-accent border border-[var(--ai-border)] px-3 py-2.5 text-sm text-[var(--ai-text)]" style={{ lineHeight: 1.7 }}>
                        {renderAnswerWithCitations(item.answer_content, item.citations)}
                      </div>

                      {/* Saved date */}
                      <p className="text-xs text-muted-foreground mt-2">
                        Saved {new Date(item.saved_at).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </>
  )
}

export default function NotesPage() {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">My Notes</h1>
        <p className="text-muted-foreground mb-6">AI answers you've saved from lecture sessions</p>
        <SavedAnswersList />
      </motion.div>
    </DashboardLayout>
  )
}
