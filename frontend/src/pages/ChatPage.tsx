import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { checkSession, getQuestions, postQuestion } from '../api/sessions'
import MessageList from '../components/MessageList'
import QuestionInput from '../components/QuestionInput'

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Verify enrollment on mount
  const { data: check, isLoading: checkLoading } = useQuery({
    queryKey: ['session-check', sessionId],
    queryFn: () => checkSession(sessionId!),
    retry: false,
  })

  useEffect(() => {
    if (!checkLoading && check && (!check.enrolled || check.session_status === 'ended')) {
      navigate('/sessions')
    }
  }, [check, checkLoading, navigate])

  // Poll for questions every 5 seconds
  const { data: questions = [], isFetching } = useQuery({
    queryKey: ['questions', sessionId],
    queryFn: () => getQuestions(sessionId!),
    refetchInterval: 5000,
    enabled: !!check?.enrolled,
  })

  // Submit a question
  const mutation = useMutation({
    mutationFn: (content: string) => postQuestion(sessionId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', sessionId] })
    },
  })

  const isActive = check?.session_status === 'active'

  if (checkLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Loading session…
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      {/* Header */}
      <header style={{
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/sessions')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14 }}
          >
            ← Sessions
          </button>
          <span style={{ fontWeight: 600, fontSize: 16, color: '#1e293b' }}>
            {check?.session_status === 'active' && '🟢 '}{check?.session_status?.charAt(0).toUpperCase()}{check?.session_status?.slice(1)}
          </span>
        </div>
        {isFetching && !mutation.isPending && (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Refreshing…</span>
        )}
      </header>

      {/* Message list */}
      <MessageList questions={questions} />

      {/* Input — only shown for active sessions */}
      {isActive && (
        <QuestionInput
          onSubmit={(content) => mutation.mutate(content)}
          disabled={mutation.isPending}
        />
      )}

      {!isActive && check && (
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
          color: '#64748b',
          fontSize: 14,
          backgroundColor: '#f8fafc',
        }}>
          This session is {check.session_status}. Questions are read-only.
        </div>
      )}
    </div>
  )
}
