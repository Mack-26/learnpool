import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, X } from 'lucide-react'
import { getThreadComments, postThreadComment } from '../api/sessions'
import { getQuestionComments, postQuestionComment } from '../api/sessions'
import { getProfessorThreadComments, postProfessorThreadComment, deleteProfessorThreadComment } from '../api/professor'
import { getProfessorQuestionComments, postProfessorQuestionComment, deleteProfessorQuestionComment } from '../api/professor'
import { useAuthStore } from '../store/authStore'
import type { CommentOut } from '../types/api'

interface CommentThreadProps {
  commentCount: number
  threadId?: string
  questionId?: string
}

export default function CommentThread({ commentCount, threadId, questionId }: CommentThreadProps) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState('')
  const { user } = useAuthStore()
  const isProfessor = user?.role === 'professor'
  const queryClient = useQueryClient()

  const isThread = !!threadId
  const id = threadId ?? questionId ?? ''
  const queryKey = isThread ? ['thread-comments', id] : ['comments', id]

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => {
      if (isThread) {
        return isProfessor ? getProfessorThreadComments(id) : getThreadComments(id)
      }
      return isProfessor ? getProfessorQuestionComments(id) : getQuestionComments(id)
    },
    enabled: expanded,
  })

  const postMutation = useMutation({
    mutationFn: (content: string) => {
      if (isThread) {
        return isProfessor ? postProfessorThreadComment(id, content) : postThreadComment(id, content)
      }
      return isProfessor ? postProfessorQuestionComment(id, content) : postQuestionComment(id, content)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setDraft('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      isThread
        ? deleteProfessorThreadComment(id, commentId)
        : deleteProfessorQuestionComment(id, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const handleSubmit = () => {
    const text = draft.trim()
    if (!text) return
    postMutation.mutate(text)
  }

  const displayCount = expanded ? comments.length : commentCount

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-foreground transition-colors min-h-[36px] px-1 -mx-1"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span>{displayCount} comment{displayCount !== 1 ? 's' : ''}</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 border-t border-border pt-3">
          {isLoading && <p className="text-xs text-[var(--ink-2)]">Loading…</p>}

          {comments.map((c: CommentOut) => (
            <div key={c.comment_id} className="flex items-start gap-2">
              <div className="flex-1 min-w-0 rounded-lg border border-border bg-card px-3.5 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">{c.display_name}</span>
                  {c.role === 'professor' && (
                    <span className="text-[10.5px] font-medium bg-accent text-accent-foreground border border-[var(--ai-border)] px-1.5 py-px rounded-md">Prof</span>
                  )}
                  <span className="text-xs text-[var(--ink-2)] ml-auto">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/85 whitespace-pre-wrap">{c.content}</p>
              </div>
              {isProfessor && c.user_id === user?.user_id && (
                <button
                  onClick={() => deleteMutation.mutate(c.comment_id)}
                  aria-label="Delete comment"
                  className="p-2 rounded-lg text-[var(--ink-2)] hover:text-destructive hover:bg-muted transition-colors shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {comments.length === 0 && !isLoading && (
            <p className="text-xs text-[var(--ink-2)]">No comments yet.</p>
          )}

          <div className="flex items-end gap-2 pt-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              aria-label="Add a comment"
              rows={2}
              className="flex-1 min-w-0 text-[13px] bg-card border border-input rounded-lg px-3.5 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-[var(--ink-3)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!draft.trim() || postMutation.isPending}
              aria-label="Post comment"
              className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
