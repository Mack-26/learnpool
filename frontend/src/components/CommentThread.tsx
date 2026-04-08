import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, X } from 'lucide-react'
import { getQuestionComments, postQuestionComment } from '../api/sessions'
import { getProfessorQuestionComments, postProfessorQuestionComment, deleteProfessorQuestionComment } from '../api/professor'
import { useAuthStore } from '../store/authStore'
import type { CommentOut } from '../types/api'

interface CommentThreadProps {
  questionId: string
  commentCount: number
}

export default function CommentThread({ questionId, commentCount }: CommentThreadProps) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState('')
  const { user } = useAuthStore()
  const isProfessor = user?.role === 'professor'
  const queryClient = useQueryClient()

  const queryKey = ['comments', questionId]

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => isProfessor ? getProfessorQuestionComments(questionId) : getQuestionComments(questionId),
    enabled: expanded,
  })

  const postMutation = useMutation({
    mutationFn: (content: string) =>
      isProfessor
        ? postProfessorQuestionComment(questionId, content)
        : postQuestionComment(questionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setDraft('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteProfessorQuestionComment(questionId, commentId),
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
      {/* Toggle button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span>{displayCount} comment{displayCount !== 1 ? 's' : ''}</span>
      </button>

      {/* Expanded thread */}
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

          {comments.map((c: CommentOut) => (
            <div key={c.comment_id} className="flex items-start gap-2">
              <div className="flex-1 bg-muted/40 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold text-foreground">{c.display_name}</span>
                  {c.role === 'professor' && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Prof</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-foreground">{c.content}</p>
              </div>
              {isProfessor && c.user_id === user?.user_id && (
                <button
                  onClick={() => deleteMutation.mutate(c.comment_id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-1"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {comments.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground italic">No comments yet. Be the first!</p>
          )}

          {/* Add comment */}
          <div className="flex items-end gap-2 pt-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              rows={2}
              className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
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
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
