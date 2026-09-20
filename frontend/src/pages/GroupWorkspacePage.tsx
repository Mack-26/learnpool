import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark, Check, Copy, CornerDownRight, Eye, EyeOff, FileText, GitFork, MessageCircle, Paperclip, Plus, Send, Upload, Users, X,
} from 'lucide-react'
import {
  askGroupQuestion, forkGroupQuestionPrivately, getGroupDetail, getGroupDocuments, getGroupQuestions, getMyGroups, uploadGroupDocument,
} from '../api/groups'
import { forkQuestion, getQuestionComments, getSavedAnswers, postQuestionComment, saveAnswer, unsaveAnswer } from '../api/sessions'
import { renderAnswerWithCitations } from '../components/AnswerRenderer'
import CitationCard from '../components/CitationCard'
import CreateGroupModal from '../components/CreateGroupModal'
import JoinGroupModal from '../components/JoinGroupModal'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '../store/settingsStore'
import type { DocumentOut, GroupDetailOut, GroupQuestionOut } from '../types/api'

const POLL_MS = 5000
const FORK_PREFIX = /^\[Forked from:[^\]]*\]\s*/

function Avatar({ label, tone = 'muted', size = 32 }: { label: string; tone?: 'me' | 'muted' | 'ai'; size?: number }) {
  const bg = tone === 'ai' ? 'linear-gradient(135deg, #f59e0b, #ef6c00)' : tone === 'me' ? 'linear-gradient(135deg, #272757, #505081)' : '#8686AC'
  return (
    <span
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.4, background: bg }}
      aria-hidden
    >
      {label.charAt(0).toUpperCase()}
    </span>
  )
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

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
          <Button size="sm" className="flex-1 gap-1" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5" /> Create</Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setJoinOpen(true)}>Join</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {groups.map((g) => {
          const active = g.id === activeGroupId
          return (
            <button
              key={g.id}
              onClick={() => navigate(`/groups/${g.id}`)}
              className={`w-full text-left px-2.5 py-2 rounded-xl text-sm transition-colors flex items-center gap-2.5 ${active ? 'bg-muted text-primary font-semibold' : 'text-foreground hover:bg-muted/60'}`}
            >
              <span className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: active ? 'linear-gradient(135deg, #272757, #505081)' : '#8686AC' }}>
                {g.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate">{g.name}</span>
                <span className="block text-[11px] font-normal text-muted-foreground">{g.member_count} member{g.member_count === 1 ? '' : 's'}</span>
              </span>
            </button>
          )
        })}
        {groups.length === 0 && <p className="text-xs text-muted-foreground p-3 leading-relaxed">No groups yet. Create one for a class you're taking, or join with a code from a classmate.</p>}
      </div>
      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(g) => { setCreateOpen(false); goTo(g.id) }} />
      <JoinGroupModal open={joinOpen} onClose={() => setJoinOpen(false)} onJoined={(g) => { setJoinOpen(false); goTo(g.id) }} />
    </aside>
  )
}

// ─── Right: invite + members + materials ──────────────────────────────────────

function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — the code is still visible to copy by hand
    }
  }
  return (
    <button onClick={copy} aria-label={`Copy invite code ${code}`} className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono tracking-wider hover:border-primary/40 transition-colors">
      <span>{code}</span>
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
    </button>
  )
}

function MaterialsPanel({ groupId, onDiscuss }: { groupId: string; onDiscuss: (doc: DocumentOut) => void }) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const { data: docs = [] } = useQuery({ queryKey: ['group-docs', groupId], queryFn: () => getGroupDocuments(groupId) })

  const upload = useMutation({
    mutationFn: (file: File) => uploadGroupDocument(groupId, file),
    onSuccess: () => { setError(null); queryClient.invalidateQueries({ queryKey: ['group-docs', groupId] }) },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Upload failed. Please try again.')
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Materials ({docs.length})</h3>
        <button onClick={() => fileRef.current?.click()} disabled={upload.isPending} aria-label="Upload material" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline disabled:opacity-50">
          <Upload className="h-3 w-3" /> {upload.isPending ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.md" className="hidden" aria-label="Choose a file to upload" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = '' }} />
      </div>
      {upload.isPending && <p className="text-[11px] text-muted-foreground mb-2">Reading and indexing — this can take a moment.</p>}
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <div className="space-y-0.5">
        {docs.map((d) => (
          <div key={d.id} className="group/doc flex items-center gap-2 text-sm text-foreground px-2 py-1.5 rounded-lg hover:bg-muted/60">
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate flex-1" title={d.filename}>{d.filename}</span>
            <button onClick={() => onDiscuss(d)} className="text-[11px] text-primary font-medium opacity-0 group-hover/doc:opacity-100 focus:opacity-100 transition-opacity" aria-label={`Discuss ${d.filename}`}>
              Discuss
            </button>
          </div>
        ))}
        {docs.length === 0 && <p className="text-xs text-muted-foreground leading-relaxed px-2">Nothing uploaded yet. Add lecture slides, homework, or readings — the AI answers from these, and anyone can bring one into the conversation.</p>}
      </div>
    </div>
  )
}

function RightPanel({ group, onDiscuss }: { group: GroupDetailOut; onDiscuss: (doc: DocumentOut) => void }) {
  return (
    <aside className="w-64 shrink-0 h-full overflow-y-auto bg-white p-4 space-y-6" style={{ boxShadow: '-1px 0 0 rgba(134,134,172,0.15)' }}>
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invite classmates</h3>
        <InviteCode code={group.join_code} />
        <p className="text-[11px] text-muted-foreground mt-1.5">Anyone with this code can join instantly.</p>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Members ({group.members.length})</h3>
        <div className="space-y-0.5">
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-sm px-2 py-1.5">
              <Avatar label={m.display_name} size={24} />
              <span className="truncate text-foreground">{m.display_name}</span>
              {m.is_owner && <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">owner</span>}
            </div>
          ))}
        </div>
      </div>
      <MaterialsPanel groupId={group.id} onDiscuss={onDiscuss} />
    </aside>
  )
}

// ─── Center: conversation ─────────────────────────────────────────────────────

function Replies({ questionId, initialCount }: { questionId: string; initialCount: number }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(initialCount > 0)
  const [draft, setDraft] = useState('')
  const queryKey = ['comments', questionId]
  const { data: comments = [] } = useQuery({ queryKey, queryFn: () => getQuestionComments(questionId), enabled: open })

  const post = useMutation({
    mutationFn: (text: string) => postQuestionComment(questionId, text),
    onSuccess: () => { setDraft(''); queryClient.invalidateQueries({ queryKey }); queryClient.invalidateQueries({ queryKey: ['group-questions'] }) },
  })

  const count = open ? comments.length : initialCount

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
        <MessageCircle className="h-3.5 w-3.5" /> {count > 0 ? `${count} repl${count === 1 ? 'y' : 'ies'}` : 'Reply'}
      </button>
    )
  }

  return (
    <div className="mt-1.5 space-y-1.5">
      {comments.map((c) => (
        <div key={c.comment_id} className="flex items-start gap-2.5">
          <Avatar label={c.display_name} size={24} />
          <div className="min-w-0">
            <span className="text-[13px] font-semibold text-foreground">{c.display_name}</span>
            <span className="text-[11px] text-muted-foreground ml-1.5">{timeOf(c.created_at)}</span>
            <p className="text-[14px] text-foreground leading-snug">{c.content}</p>
          </div>
        </div>
      ))}
      <form
        onSubmit={(e) => { e.preventDefault(); if (draft.trim() && !post.isPending) post.mutate(draft.trim()) }}
        className="flex items-center gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Reply to the group…"
          aria-label="Reply"
          maxLength={1000}
          className="flex-1 text-[13px] px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button type="submit" disabled={!draft.trim() || post.isPending} aria-label="Send reply" className="p-1.5 rounded-lg text-primary disabled:opacity-40 hover:bg-muted">
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  )
}

function MessageRow({
  q, savedIds, onToggleSave, onFollowUp, onFork,
}: {
  q: GroupQuestionOut
  savedIds: Set<string>
  onToggleSave: (answerId: string) => void
  onFollowUp: (q: GroupQuestionOut) => void
  onFork: (q: GroupQuestionOut) => void
}) {
  const [showSources, setShowSources] = useState(false)
  const isFollowUp = FORK_PREFIX.test(q.content)
  const text = q.content.replace(FORK_PREFIX, '')
  const saved = q.answer ? savedIds.has(q.answer.answer_id) : false

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-1.5">
      {/* human */}
      <div className="flex items-start gap-3 px-2 py-1 rounded-lg hover:bg-white/60">
        <Avatar label={q.asker_name} tone={q.is_mine ? 'me' : 'muted'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-foreground">{q.is_mine ? 'You' : q.asker_name}</span>
            <span className="text-[11px] text-muted-foreground">{timeOf(q.asked_at)}</span>
            {isFollowUp && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><CornerDownRight className="h-3 w-3" /> follow-up</span>}
          </div>
          {q.focus_document_name && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 rounded-md px-1.5 py-0.5 mt-0.5 mb-1">
              <FileText className="h-3 w-3" /> {q.focus_document_name}
            </span>
          )}
          <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>
      </div>

      {/* AI as a participant */}
      <div className="flex items-start gap-3 px-2 py-1 rounded-lg hover:bg-white/60">
        <Avatar label="H" tone="ai" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[14px] font-semibold text-foreground">Horizon</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-white rounded px-1 py-px" style={{ background: '#ef6c00' }}>bot</span>
          </div>
          {q.answer ? (
            <>
              <div className="text-[15px] leading-relaxed text-foreground">{renderAnswerWithCitations(q.answer.content, q.answer.citations)}</div>
              <div className="mt-1 flex items-center gap-3 flex-wrap text-xs">
                {q.answer.citations.length > 0 && (
                  <button onClick={() => setShowSources((s) => !s)} className="text-muted-foreground hover:text-foreground">{showSources ? 'Hide sources' : `Sources (${q.answer.citations.length})`}</button>
                )}
                <button onClick={() => onToggleSave(q.answer!.answer_id)} className={`flex items-center gap-1 hover:text-foreground ${saved ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Bookmark className={`h-3 w-3 ${saved ? 'fill-current' : ''}`} /> {saved ? 'Saved' : 'Save'}
                </button>
                <button onClick={() => onFork(q)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground" title="Explore this privately in My Chats">
                  <GitFork className="h-3 w-3" /> Fork
                </button>
                <button onClick={() => onFollowUp(q)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  <CornerDownRight className="h-3 w-3" /> Follow up
                </button>
              </div>
              {showSources && <div className="mt-2">{q.answer.citations.map((c) => <CitationCard key={c.chunk_id} citation={c} />)}</div>}
            </>
          ) : (
            <span className="text-sm text-muted-foreground italic">Thinking…</span>
          )}
        </div>
      </div>

      <div className="pl-[52px] pr-2">
        <Replies questionId={q.question_id} initialCount={q.comment_count} />
      </div>
    </motion.div>
  )
}

function ForkModal({ source, groupId, onClose }: { source: GroupQuestionOut | null; groupId: string; onClose: () => void }) {
  if (!source) return null
  // Keyed on the question so each fork starts with fresh local state.
  return <ForkModalBody key={source.question_id} source={source} groupId={groupId} onClose={onClose} />
}

function ForkModalBody({ source, groupId, onClose }: { source: GroupQuestionOut; groupId: string; onClose: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [done, setDone] = useState(false)
  const fork = useMutation({
    mutationFn: () => forkGroupQuestionPrivately(groupId, source.question_id, content.trim()),
    onSuccess: () => { setDone(true); queryClient.invalidateQueries({ queryKey: ['my-chats'] }) },
  })
  const close = () => { if (!fork.isPending) onClose() }
  const isPending = fork.isPending
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, isPending])
  useEffect(() => {
    // Return focus to whatever opened the modal when it unmounts.
    const opener = document.activeElement as HTMLElement | null
    return () => opener?.focus?.()
  }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Fork to My Chats" onClick={close}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }} className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2"><GitFork className="h-4 w-4" /> Fork to My Chats</h3>
          <button onClick={close} aria-label="Close" className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        {done ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">Saved. It's private to you — explore further in My Chats, and share it back to the group whenever you like.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>Stay here</Button>
              <Button size="sm" onClick={() => navigate('/chats')}>Open My Chats</Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">Explore this question on your own without changing the group conversation. Horizon still answers from this group's materials.</p>
            <blockquote className="text-sm text-foreground border-l-2 border-border pl-3 mb-3 line-clamp-3">{source.content.replace(FORK_PREFIX, '')}</blockquote>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to dig into?"
              aria-label="Your private question"
              rows={3}
              maxLength={2000}
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {fork.isError && <p className="text-xs text-destructive mt-1">Could not fork. Please try again.</p>}
            <div className="flex gap-2 justify-end mt-3">
              <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
              <Button size="sm" onClick={() => fork.mutate()} disabled={content.trim().length < 5 || fork.isPending}>{fork.isPending ? 'Forking…' : 'Fork to My Chats'}</Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

function Conversation({
  group, focusDoc, setFocusDoc,
}: {
  group: GroupDetailOut
  focusDoc: DocumentOut | null
  setFocusDoc: (d: DocumentOut | null) => void
}) {
  const queryClient = useQueryClient()
  const personality = useSettingsStore((s) => s.personality)
  const [content, setContent] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [replyTo, setReplyTo] = useState<GroupQuestionOut | null>(null)
  const [forkSource, setForkSource] = useState<GroupQuestionOut | null>(null)
  const [attachOpen, setAttachOpen] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const attachRef = useRef<HTMLDivElement>(null)
  const attachButtonRef = useRef<HTMLButtonElement>(null)
  const submitting = useRef(false)  // synchronous guard; isPending only flips after a re-render

  useEffect(() => {
    if (!attachOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAttachOpen(false); attachButtonRef.current?.focus() } }
    const onClick = (e: MouseEvent) => { if (attachRef.current && !attachRef.current.contains(e.target as Node)) setAttachOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [attachOpen])

  const { data: questions = [] } = useQuery({ queryKey: ['group-questions', group.id], queryFn: () => getGroupQuestions(group.id), refetchInterval: POLL_MS })
  const { data: saved = [] } = useQuery({ queryKey: ['saved-answers'], queryFn: getSavedAnswers })
  const { data: docs = [] } = useQuery({ queryKey: ['group-docs', group.id], queryFn: () => getGroupDocuments(group.id) })
  const savedIds = new Set(saved.map((s) => s.answer_id))
  const showPending = !!pending && !questions.some((q) => q.is_mine && q.content.replace(FORK_PREFIX, '') === pending)

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }) }, [questions.length, showPending])
  useEffect(() => { if (focusDoc) inputRef.current?.focus() }, [focusDoc])

  const ask = useMutation({
    mutationFn: async (text: string) => {
      if (replyTo) return forkQuestion(replyTo.question_id, text, personality)
      return askGroupQuestion(group.id, text, { anonymous, focusDocumentId: focusDoc?.id ?? null })
    },
    onMutate: (text) => { setPending(text); setError(null) },
    onSuccess: (_d, text) => {
      setContent((c) => (c.trim() === text ? '' : c))
      setReplyTo(null)
      setFocusDoc(null)
      setAnonymous(false)
      queryClient.invalidateQueries({ queryKey: ['group-questions', group.id] })
      queryClient.invalidateQueries({ queryKey: ['group-detail', group.id] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
    onError: (err: unknown) => {
      const res = (err as { response?: { status?: number; data?: { detail?: string } } })?.response
      setError(res?.status === 429 ? (res.data?.detail ?? 'Daily question limit reached.') : 'Could not send. Please try again.')
    },
    onSettled: () => { setPending(null); submitting.current = false },
  })

  const toggleSave = useMutation({
    mutationFn: (answerId: string) => (savedIds.has(answerId) ? unsaveAnswer(answerId) : saveAnswer(answerId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-answers'] }),
  })

  const submit = () => {
    const text = content.trim()
    if (!text || submitting.current) return
    submitting.current = true
    ask.mutate(text)
  }

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {questions.length === 0 && !showPending && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <p className="text-sm font-medium text-foreground mb-1">This group is quiet so far.</p>
            <p className="text-sm text-muted-foreground">Ask the first question, or pick a material on the right and hit Discuss. Horizon answers from your group's materials and everyone can weigh in.</p>
          </div>
        )}
        {questions.map((q) => (
          <MessageRow
            key={q.question_id}
            q={q}
            savedIds={savedIds}
            onToggleSave={(id) => toggleSave.mutate(id)}
            onFollowUp={(src) => { setReplyTo(src); setFocusDoc(null); inputRef.current?.focus() }}
            onFork={(src) => setForkSource(src)}
          />
        ))}
        <AnimatePresence>
          {showPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
              <div className="flex items-start gap-3 px-2 py-1"><Avatar label="Y" tone="me" /><div><span className="text-[14px] font-semibold text-foreground">You</span><p className="text-[15px] text-foreground">{pending}</p></div></div>
              <div className="flex items-start gap-3 px-2 py-1"><Avatar label="H" tone="ai" /><div><span className="text-[14px] font-semibold text-foreground">Horizon</span><p className="text-sm text-muted-foreground italic">Thinking…</p></div></div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <div className="shrink-0 px-4 pb-4 pt-1">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 px-1">
            <CornerDownRight className="h-3 w-3" />
            <span className="truncate">Following up on: “{replyTo.content.replace(FORK_PREFIX, '').slice(0, 80)}”</span>
            <button onClick={() => setReplyTo(null)} aria-label="Cancel follow-up" className="ml-auto hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
        {error && <p className="text-xs text-destructive mb-1.5 px-1">{error}</p>}
        <div className="relative rounded-2xl bg-white p-2" style={{ boxShadow: '0 1px 3px rgba(15,14,71,0.08)' }}>
          {focusDoc && !replyTo && (
            <div className="flex items-center gap-1.5 px-2 pb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 rounded-md pl-2 pr-1 py-1">
                <FileText className="h-3 w-3" /> {focusDoc.filename}
                <button onClick={() => setFocusDoc(null)} aria-label="Remove attached material" className="rounded p-0.5 hover:bg-primary/20"><X className="h-3 w-3" /></button>
              </span>
              <span className="text-[11px] text-muted-foreground">Horizon will answer from this material first.</span>
            </div>
          )}
          <div className="flex items-end gap-1.5">
            {!replyTo && (
              <div className="relative" ref={attachRef}>
                <button
                  ref={attachButtonRef}
                  type="button"
                  onClick={() => setAttachOpen((o) => !o)}
                  aria-label="Attach a material"
                  aria-expanded={attachOpen}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${attachOpen ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted/60'}`}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                {attachOpen && (
                  <div className="absolute bottom-11 left-0 w-64 rounded-xl bg-card border border-border shadow-xl p-1.5 z-20" role="menu">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">Discuss a material</p>
                    {docs.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1.5">No materials yet — upload one on the right.</p>}
                    {docs.map((d) => (
                      <button key={d.id} role="menuitem" onClick={() => { setFocusDoc(d); setAttachOpen(false) }} className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-muted">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><span className="truncate">{d.filename}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              placeholder={replyTo ? 'Your follow-up…' : focusDoc ? `Ask about ${focusDoc.filename}…` : `Message ${group.name}…`}
              aria-label={`Message ${group.name}`}
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
            <Button size="sm" onClick={submit} disabled={!content.trim() || ask.isPending} aria-label="Send" className="h-9 w-9 p-0"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
          Everyone in the group sees this.{anonymous && !replyTo ? ' Your name will be hidden on this one.' : ''}
        </p>
      </div>

      <ForkModal source={forkSource} groupId={group.id} onClose={() => setForkSource(null)} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupWorkspacePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: getMyGroups })

  useEffect(() => {
    if (!groupId && groups && groups.length > 0) navigate(`/groups/${groups[0].id}`, { replace: true })
  }, [groupId, groups, navigate])

  return (
    <DashboardLayout fullBleed>
      <div className="h-full flex" style={{ minHeight: 0 }}>
        <div className="hidden md:flex h-full"><GroupsSidebar activeGroupId={groupId} /></div>
        {/* Keyed on the group so composer state (attached material etc.) resets when switching groups. */}
        <WorkspaceBody key={groupId ?? 'none'} groupId={groupId} />
      </div>
    </DashboardLayout>
  )
}

function WorkspaceBody({ groupId }: { groupId?: string }) {
  const navigate = useNavigate()
  const [panelOpen, setPanelOpen] = useState(false)
  const [focusDoc, setFocusDoc] = useState<DocumentOut | null>(null)
  const { data: group, isError } = useQuery({ queryKey: ['group-detail', groupId], queryFn: () => getGroupDetail(groupId as string), enabled: !!groupId, refetchInterval: 15000 })

  const discuss = (d: DocumentOut) => { setFocusDoc(d); setPanelOpen(false) }

  return (
        <div className="flex-1 min-w-0 h-full flex flex-col">
          {group ? (
            <>
              <header className="shrink-0 flex items-center gap-3 px-5 py-2.5 bg-white" style={{ boxShadow: '0 1px 0 rgba(134,134,172,0.15)' }}>
                <div className="min-w-0 flex-1">
                  <h1 className="text-[15px] font-bold text-foreground truncate">{group.name}</h1>
                  <p className="text-xs text-muted-foreground truncate">
                    {group.subject ? `${group.subject} · ` : ''}{group.members.length} member{group.members.length === 1 ? '' : 's'}
                    {group.question_count > 0 && <> · {group.question_count} question{group.question_count === 1 ? '' : 's'}</>}
                    {group.active_today > 0 && <> · {group.active_today} active today</>}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="lg:hidden gap-1.5" onClick={() => setPanelOpen(true)}><Users className="h-3.5 w-3.5" /> Members & materials</Button>
              </header>
              <div className="flex-1 min-h-0 flex">
                <Conversation group={group} focusDoc={focusDoc} setFocusDoc={setFocusDoc} />
                <div className="hidden lg:flex h-full"><RightPanel group={group} onDiscuss={discuss} /></div>
              </div>
              {panelOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setPanelOpen(false)}>
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute right-0 top-0 bottom-0 flex" onClick={(e) => e.stopPropagation()}><RightPanel group={group} onDiscuss={discuss} /></div>
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
              <p className="text-sm text-muted-foreground">Create a group for a class, upload the materials, and invite classmates. Ask anything — Horizon answers from your materials and your group can discuss and verify.</p>
              <div className="md:hidden mt-4 w-full"><GroupsSidebar activeGroupId={groupId} /></div>
            </div>
          )}
        </div>
  )
}
