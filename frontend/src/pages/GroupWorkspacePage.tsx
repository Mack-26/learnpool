import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark, Check, Copy, CornerDownRight, Eye, EyeOff, FileText, Plus, Send, Upload, Users, X,
} from 'lucide-react'
import {
  getGroupDetail, getGroupDocuments, getGroupQuestions, getMyGroups, uploadGroupDocument,
} from '../api/groups'
import { forkQuestion, getSavedAnswers, postQuestion, saveAnswer, unsaveAnswer } from '../api/sessions'
import { renderAnswerWithCitations } from '../components/AnswerRenderer'
import CitationCard from '../components/CitationCard'
import CommentThread from '../components/CommentThread'
import CreateGroupModal from '../components/CreateGroupModal'
import JoinGroupModal from '../components/JoinGroupModal'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '../store/settingsStore'
import type { GroupDetailOut, GroupQuestionOut } from '../types/api'

const POLL_MS = 5000

// ─── Left: groups list ────────────────────────────────────────────────────────

function GroupsSidebar({ activeGroupId }: { activeGroupId?: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const { data: groups = [] } = useQuery({ queryKey: ['my-groups'], queryFn: getMyGroups })

  const goTo = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ['my-groups'] })
    queryClient.invalidateQueries({ queryKey: ['home'] })
    navigate(`/groups/${id}`)
  }

  return (
    <aside className="w-60 shrink-0 h-full flex flex-col bg-white" style={{ boxShadow: '1px 0 0 rgba(134,134,172,0.15)' }}>
      <div className="p-3" style={{ borderBottom: '1px solid rgba(134,134,172,0.18)' }}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">My Groups</h2>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setJoinOpen(true)}>
            Join
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {groups.map((g) => {
          const active = g.id === activeGroupId
          return (
            <button
              key={g.id}
              onClick={() => navigate(`/groups/${g.id}`)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2.5 ${
                active ? 'bg-muted text-primary font-semibold' : 'text-foreground hover:bg-muted/60'
              }`}
            >
              <span
                className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: active ? 'linear-gradient(135deg, #272757, #505081)' : '#8686AC' }}
              >
                {g.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate">{g.name}</span>
                <span className="block text-[11px] font-normal text-muted-foreground">{g.member_count} member{g.member_count === 1 ? '' : 's'}</span>
              </span>
            </button>
          )
        })}
        {groups.length === 0 && (
          <p className="text-xs text-muted-foreground p-3 leading-relaxed">
            No groups yet. Create one for a class you're taking, or join with a code from a classmate.
          </p>
        )}
      </div>

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(g) => { setCreateOpen(false); goTo(g.id) }} />
      <JoinGroupModal open={joinOpen} onClose={() => setJoinOpen(false)} onJoined={(g) => { setJoinOpen(false); goTo(g.id) }} />
    </aside>
  )
}

// ─── Right: members + materials ───────────────────────────────────────────────

function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (e.g. insecure context) — code is still visible to copy manually
    }
  }
  return (
    <button
      onClick={copy}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono tracking-wider hover:border-primary/40 transition-colors"
      aria-label={`Copy invite code ${code}`}
      title="Copy invite code"
    >
      <span>{code}</span>
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
    </button>
  )
}

function MaterialsPanel({ groupId }: { groupId: string }) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: docs = [] } = useQuery({ queryKey: ['group-docs', groupId], queryFn: () => getGroupDocuments(groupId) })

  const upload = useMutation({
    mutationFn: (file: File) => uploadGroupDocument(groupId, file),
    onSuccess: () => {
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['group-docs', groupId] })
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Upload failed. Please try again.')
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" /> Materials ({docs.length})
        </h3>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
          aria-label="Upload material"
          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline disabled:opacity-50"
        >
          <Upload className="h-3 w-3" /> {upload.isPending ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.docx,.md"
          className="hidden"
          aria-label="Choose a file to upload"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = '' }}
        />
      </div>
      {upload.isPending && <p className="text-[11px] text-muted-foreground mb-2">Reading and indexing — this can take a moment.</p>}
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <div className="space-y-1">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center gap-2 text-sm text-foreground px-2 py-1.5 rounded-lg hover:bg-muted/60">
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate" title={d.filename}>{d.filename}</span>
          </div>
        ))}
        {docs.length === 0 && (
          <p className="text-xs text-muted-foreground leading-relaxed px-2">
            Nothing uploaded yet. Add lecture slides, notes, or readings — the AI answers from these.
          </p>
        )}
      </div>
    </div>
  )
}

function RightPanel({ group }: { group: GroupDetailOut }) {
  return (
    <aside className="w-64 shrink-0 h-full overflow-y-auto bg-white p-4 space-y-6" style={{ boxShadow: '-1px 0 0 rgba(134,134,172,0.15)' }}>
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invite classmates</h3>
        <InviteCode code={group.join_code} />
        <p className="text-[11px] text-muted-foreground mt-1.5">Anyone with this code can join instantly.</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Members ({group.members.length})
        </h3>
        <div className="space-y-1">
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-sm px-2 py-1.5">
              <span className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#505081' }}>
                {m.display_name.charAt(0).toUpperCase()}
              </span>
              <span className="truncate text-foreground">{m.display_name}</span>
              {m.is_owner && <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">owner</span>}
            </div>
          ))}
        </div>
      </div>

      <MaterialsPanel groupId={group.id} />
    </aside>
  )
}

// ─── Center: conversation ─────────────────────────────────────────────────────

const FORK_PREFIX = /^\[Forked from:[^\]]*\]\s*/

function QuestionCard({
  q, savedIds, onToggleSave, onFork,
}: {
  q: GroupQuestionOut
  savedIds: Set<string>
  onToggleSave: (answerId: string) => void
  onFork: (q: GroupQuestionOut) => void
}) {
  const [showSources, setShowSources] = useState(false)
  const isFollowUp = FORK_PREFIX.test(q.content)
  const displayContent = q.content.replace(FORK_PREFIX, '')
  const saved = q.answer ? savedIds.has(q.answer.answer_id) : false

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-2">
      <div className="flex items-start gap-3">
        <span
          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
          style={{ background: q.is_mine ? 'linear-gradient(135deg, #272757, #505081)' : '#8686AC' }}
        >
          {q.asker_name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground">{q.is_mine ? 'You' : q.asker_name}</span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(q.asked_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </span>
            {isFollowUp && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1"><CornerDownRight className="h-3 w-3" /> follow-up</span>
            )}
          </div>
          <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">{displayContent}</p>
        </div>
      </div>

      <div className="flex items-start gap-3 pl-1">
        <span className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 gradient-primary">AI</span>
        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: '#ffffff', boxShadow: '0 1px 2px rgba(15,14,71,0.06)' }}>
          {q.answer ? (
            <>
              <div className="text-[15px] leading-relaxed text-foreground">
                {renderAnswerWithCitations(q.answer.content, q.answer.citations)}
              </div>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                {q.answer.citations.length > 0 && (
                  <button onClick={() => setShowSources((s) => !s)} className="text-xs text-primary hover:underline">
                    {showSources ? 'Hide sources' : `Sources (${q.answer.citations.length})`}
                  </button>
                )}
                <button
                  onClick={() => onToggleSave(q.answer!.answer_id)}
                  className={`text-xs flex items-center gap-1 hover:underline ${saved ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <Bookmark className={`h-3 w-3 ${saved ? 'fill-current' : ''}`} /> {saved ? 'Saved' : 'Save'}
                </button>
                <button onClick={() => onFork(q)} className="text-xs text-muted-foreground flex items-center gap-1 hover:underline">
                  <CornerDownRight className="h-3 w-3" /> Follow up
                </button>
              </div>
              {showSources && (
                <div className="mt-2">
                  {q.answer.citations.map((c) => <CitationCard key={c.chunk_id} citation={c} />)}
                </div>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground italic">Thinking…</span>
          )}
        </div>
      </div>

      <div className="pl-12">
        <CommentThread questionId={q.question_id} commentCount={q.comment_count} />
      </div>
    </motion.div>
  )
}

function Conversation({ group }: { group: GroupDetailOut }) {
  const queryClient = useQueryClient()
  const personality = useSettingsStore((s) => s.personality)
  const [content, setContent] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [replyTo, setReplyTo] = useState<GroupQuestionOut | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { data: questions = [] } = useQuery({
    queryKey: ['group-questions', group.id],
    queryFn: () => getGroupQuestions(group.id),
    refetchInterval: POLL_MS,
  })
  const { data: saved = [] } = useQuery({ queryKey: ['saved-answers'], queryFn: getSavedAnswers })
  const savedIds = new Set(saved.map((s) => s.answer_id))
  // The poll can pick up the new row before the POST resolves; don't show both.
  const showPending = !!pending && !questions.some((q) => q.is_mine && q.content.replace(FORK_PREFIX, '') === pending)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [questions.length, pending])

  const ask = useMutation({
    mutationFn: async (text: string) => {
      if (replyTo) return forkQuestion(replyTo.question_id, text, personality)
      return postQuestion(group.conversation_id, text, personality, anonymous)
    },
    onMutate: (text) => { setPending(text); setError(null) },
    onSuccess: (_data, text) => {
      // Don't wipe anything the user typed while this request was in flight.
      setContent((current) => (current.trim() === text ? '' : current))
      setReplyTo(null)
      queryClient.invalidateQueries({ queryKey: ['group-questions', group.id] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
    onError: (err: unknown) => {
      const res = (err as { response?: { status?: number; data?: { detail?: string } } })?.response
      setError(res?.status === 429 ? (res.data?.detail ?? 'Daily question limit reached.') : 'Could not send. Please try again.')
    },
    onSettled: () => setPending(null),
  })

  const toggleSave = useMutation({
    mutationFn: (answerId: string) => (savedIds.has(answerId) ? unsaveAnswer(answerId) : saveAnswer(answerId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-answers'] }),
  })

  const submit = () => {
    const text = content.trim()
    if (!text || ask.isPending) return
    ask.mutate(text)
  }

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
        {questions.length === 0 && !showPending && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <p className="text-sm font-medium text-foreground mb-1">This group is quiet so far.</p>
            <p className="text-sm text-muted-foreground">
              Ask the first question — the AI answers from the materials your group has uploaded, and everyone here can weigh in.
            </p>
          </div>
        )}
        {questions.map((q) => (
          <QuestionCard key={q.question_id} q={q} savedIds={savedIds} onToggleSave={(id) => toggleSave.mutate(id)} onFork={(src) => { setReplyTo(src); inputRef.current?.focus() }} />
        ))}
        <AnimatePresence>
          {showPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #272757, #505081)' }}>Y</span>
                <div><span className="text-sm font-semibold text-foreground">You</span><p className="text-[15px] text-foreground">{pending}</p></div>
              </div>
              <div className="flex items-start gap-3 pl-1">
                <span className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 gradient-primary">AI</span>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white text-sm text-muted-foreground italic">Thinking…</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 px-1">
            <CornerDownRight className="h-3 w-3" />
            <span className="truncate">Following up on: “{replyTo.content.replace(FORK_PREFIX, '').slice(0, 80)}”</span>
            <button onClick={() => setReplyTo(null)} aria-label="Cancel follow-up" className="ml-auto hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
        {error && <p className="text-xs text-destructive mb-1.5 px-1">{error}</p>}
        <div className="rounded-2xl bg-white p-2 flex items-end gap-2" style={{ boxShadow: '0 1px 3px rgba(15,14,71,0.08)' }}>
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder={`Ask ${group.name}…`}
            aria-label={`Ask ${group.name}`}
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-[15px] focus:outline-none max-h-40"
            style={{ minHeight: 40 }}
          />
          {!replyTo && (
            <button
              type="button"
              onClick={() => setAnonymous((a) => !a)}
              aria-pressed={anonymous}
              aria-label={anonymous ? 'Asking anonymously — click to show your name' : 'Ask anonymously'}
              title={anonymous ? 'Asking anonymously — click to show your name' : 'Ask anonymously'}
              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${anonymous ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted/60'}`}
            >
              {anonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          <Button size="sm" onClick={submit} disabled={!content.trim() || ask.isPending} aria-label="Ask the group" className="h-9 gap-1.5">
            <Send className="h-3.5 w-3.5" /> Ask
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
          Everyone in the group sees questions and answers.{anonymous && !replyTo ? ' Your name will be hidden on this one.' : ''}
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupWorkspacePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [panelOpen, setPanelOpen] = useState(false)

  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: getMyGroups })
  const { data: group, isError } = useQuery({
    queryKey: ['group-detail', groupId],
    queryFn: () => getGroupDetail(groupId as string),
    enabled: !!groupId,
    refetchInterval: 15000,
  })

  // /groups with no id → open the most recent group if there is one
  useEffect(() => {
    if (!groupId && groups && groups.length > 0) navigate(`/groups/${groups[0].id}`, { replace: true })
  }, [groupId, groups, navigate])

  return (
    <DashboardLayout fullBleed>
      <div className="h-full flex" style={{ minHeight: 0 }}>
        <div className="hidden md:flex h-full"><GroupsSidebar activeGroupId={groupId} /></div>

        <div className="flex-1 min-w-0 h-full flex flex-col">
          {group ? (
            <>
              <header className="shrink-0 flex items-center gap-3 px-5 py-3 bg-white" style={{ boxShadow: '0 1px 0 rgba(134,134,172,0.15)' }}>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-bold text-foreground truncate">{group.name}</h1>
                  <p className="text-xs text-muted-foreground truncate">
                    {group.subject ? `${group.subject} · ` : ''}{group.members.length} member{group.members.length === 1 ? '' : 's'}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="lg:hidden gap-1.5" onClick={() => setPanelOpen(true)}>
                  <Users className="h-3.5 w-3.5" /> Members & materials
                </Button>
              </header>
              <div className="flex-1 min-h-0 flex">
                <Conversation group={group} />
                <div className="hidden lg:flex h-full"><RightPanel group={group} /></div>
              </div>

              {panelOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setPanelOpen(false)}>
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute right-0 top-0 bottom-0 flex" onClick={(e) => e.stopPropagation()}>
                    <RightPanel group={group} />
                  </div>
                </div>
              )}
            </>
          ) : isError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <p className="text-sm font-medium text-foreground mb-1">Group not found</p>
              <p className="text-sm text-muted-foreground mb-4">It may have been removed, or you're not a member.</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/groups')}>Back to my groups</Button>
            </div>
          ) : groupId ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <p className="text-base font-semibold text-foreground mb-1">Study together</p>
              <p className="text-sm text-muted-foreground">
                Create a group for a class, upload the materials, and invite classmates. Ask anything — the AI answers from your materials and your group can discuss and verify.
              </p>
              <div className="md:hidden mt-4 w-full"><GroupsSidebar activeGroupId={groupId} /></div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
