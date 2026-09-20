import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark, Check, Copy, CornerDownRight, Eye, EyeOff, FileText, GitFork, MessageCircle, Plus, Send, Share2, Users, X,
} from 'lucide-react'
import {
  askGroupQuestion, forkGroupQuestionPrivately, getGroupDetail, getGroupDocuments, getGroupQuestions, getMyGroups, inviteLinkFor, uploadGroupDocument,
} from '../api/groups'
import { forkQuestion, getQuestionComments, getSavedAnswers, postQuestionComment, saveAnswer, unsaveAnswer } from '../api/sessions'
import { renderAnswerWithCitations } from '../components/AnswerRenderer'
import CreateGroupModal from '../components/CreateGroupModal'
import JoinGroupModal from '../components/JoinGroupModal'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '../store/settingsStore'
import type { CitationOut, DocumentOut, GroupDetailOut, GroupQuestionOut } from '../types/api'

const POLL_MS = 5000
const FORK_PREFIX = /^\[Forked from:[^\]]*\]\s*/

// ─── Shared bits (design/README.md tokens) ────────────────────────────────────

const EYEBROW = 'mono text-[10px] tracking-[.09em] uppercase text-[var(--ink-3)]'
const GHOST_BTN = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none'
const CHIP = 'inline-flex items-center gap-1.5 rounded-md border border-border bg-[var(--chip)] text-xs text-foreground/80 px-2.5 py-1'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function Avatar({ label, tone = 'muted', size = 28 }: { label: string; tone?: 'me' | 'muted'; size?: number }) {
  return (
    <span
      className={`rounded-full flex items-center justify-center font-semibold text-primary-foreground shrink-0 select-none ${tone === 'me' ? 'bg-primary' : 'bg-muted-foreground'}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden
    >
      {initials(label)}
    </span>
  )
}

/** The small Horizon mark: a white disc with the horizon line in the accent colour. */
function HorizonMark({ size = 28 }: { size?: number }) {
  const s = Math.round(size * 0.54)
  return (
    <span className="rounded-full bg-card border border-[var(--ai-border)] flex items-center justify-center shrink-0 text-primary" style={{ width: size, height: size }} aria-hidden>
      <svg width={s} height={s} viewBox="0 0 19 19">
        <path d="M1.4 13.2h16.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M4.2 13.2a5.3 5.3 0 0 1 10.6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  )
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function pct(c: CitationOut) {
  return Math.round(c.relevance_score * 100)
}

function sourceName(c: CitationOut) {
  return c.filename || 'Source'
}

/** Sources under an answer: the first passage open by default, the rest as one-click chips (app UX rule 4). */
function Sources({ citations }: { citations: CitationOut[] }) {
  const sorted = [...citations].sort((a, b) => a.citation_order - b.citation_order)
  const [openOrder, setOpenOrder] = useState<number | null>(sorted[0]?.citation_order ?? null)
  if (sorted.length === 0) return null
  const open = sorted.find((c) => c.citation_order === openOrder) ?? null
  const rest = sorted.filter((c) => c !== open)
  const excerpt = open ? (open.content.length > 240 ? open.content.slice(0, 240) + '…' : open.content) : ''

  return (
    <>
      {open && (
        <div className="mt-3.5 rounded-lg border border-[var(--ai-border)] bg-card px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-accent-foreground truncate">
              [{open.citation_order}] · {sourceName(open)}{open.page_number != null ? ` · Page ${open.page_number}` : ''}
            </span>
            <span className="text-xs text-[var(--ink-2)] shrink-0">{pct(open)}% match</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">“{excerpt}”</p>
        </div>
      )}
      {rest.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {rest.map((c) => (
            <button
              key={c.chunk_id}
              type="button"
              onClick={() => setOpenOrder(c.citation_order)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-[var(--ai-border)] bg-card text-xs text-[var(--ai-text)] hover:bg-accent transition-colors"
            >
              <span className="font-semibold text-[var(--ai-meta)]">[{c.citation_order}]</span>
              <span className="truncate max-w-[180px]">{sourceName(c)}</span>
              <span className="text-[var(--ink-2)]">
                {c.page_number != null ? `· p. ${c.page_number} ` : ''}· {pct(c)}% match
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  )
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
    <aside className="w-full md:w-[268px] shrink-0 h-full flex flex-col bg-background md:border-r border-border">
      <div className="px-4 pt-5 pb-3">
        <h2 className={`${EYEBROW} px-1 mb-3`}>My groups</h2>
        <div className="flex gap-2">
          <Button className="flex-1 gap-1 h-9" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5" /> Create</Button>
          <Button variant="outline" className="flex-1 h-9" onClick={() => setJoinOpen(true)}>Join</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {groups.map((g) => {
          const active = g.id === activeGroupId
          return (
            <button
              key={g.id}
              onClick={() => navigate(`/groups/${g.id}`)}
              aria-current={active ? 'page' : undefined}
              className={`w-full text-left px-3 py-2 min-h-[44px] rounded-lg text-[13.5px] transition-colors flex items-center justify-between gap-3 ${active ? 'bg-accent text-primary font-medium' : 'text-muted-foreground hover:bg-[var(--hover-row)]'}`}
            >
              <span className="min-w-0">
                <span className={`block truncate ${active ? '' : 'text-foreground'}`}>{g.name}</span>
                <span className="block text-[11px] font-normal text-[var(--ink-2)]">{g.member_count} member{g.member_count === 1 ? '' : 's'}</span>
              </span>
              {g.member_count > 0 && <span className={`text-xs shrink-0 ${active ? 'text-[var(--ai-meta)]' : 'text-[var(--ink-3)]'}`}>{g.member_count}</span>}
            </button>
          )
        })}
        {groups.length === 0 && <p className="text-xs text-[var(--ink-2)] p-3 leading-relaxed">No groups yet. Create one for a class you're taking, or join with a code from a classmate.</p>}
      </div>
      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(g) => { setCreateOpen(false); goTo(g.id) }} />
      <JoinGroupModal open={joinOpen} onClose={() => setJoinOpen(false)} onJoined={(g) => { setJoinOpen(false); goTo(g.id) }} />
    </aside>
  )
}

// ─── Right: invite + members + materials ──────────────────────────────────────

function InvitePanel({ group }: { group: GroupDetailOut }) {
  const [copied, setCopied] = useState(false)
  const link = inviteLinkFor(group.join_code)
  const message = `Join my ${group.name} study group on Horizon — we ask questions and get answers from our own class materials: ${link}`
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — the link is still visible to copy by hand
    }
  }

  // Phones: the OS share sheet (WhatsApp, Messages, etc.). Desktop: copy link.
  const share = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({ title: `Join ${group.name} on Horizon`, text: message, url: link })
        return
      } catch {
        // user dismissed the sheet, or share failed — fall through to copy
      }
    }
    await copy()
  }

  return (
    <div>
      <h3 className={`${EYEBROW} mb-3`}>Invite classmates</h3>
      <Button className="w-full gap-1.5 h-9" onClick={share} aria-label={canNativeShare ? 'Share invite link' : 'Copy invite link'}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
        {copied ? 'Link copied' : canNativeShare ? 'Share invite link' : 'Copy invite link'}
      </Button>
      <div className="mt-2 flex items-center gap-1.5">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${GHOST_BTN} flex-1 h-9 text-xs font-medium`}
        >
          WhatsApp
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent(`Join ${group.name} on Horizon`)}&body=${encodeURIComponent(message)}`}
          className={`${GHOST_BTN} flex-1 h-9 text-xs font-medium`}
        >
          Email
        </a>
        <button onClick={copy} aria-label="Copy invite link" className={`${GHOST_BTN} h-9 w-9 text-muted-foreground`}>
          {copied ? <Check className="h-3.5 w-3.5 text-[var(--status-good)]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className="text-[11px] text-[var(--ink-2)] mt-2 break-all">
        <span className="mono">{link.replace(/^https?:\/\//, '')}</span>
      </p>
      <p className="text-[11px] text-[var(--ink-2)] mt-1">Anyone with the link joins instantly — no account needed beforehand.</p>
    </div>
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
      <h3 className={`${EYEBROW} mb-3`}>Materials ({docs.length})</h3>
      <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.md" className="hidden" aria-label="Choose a file to upload" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = '' }} />
      {upload.isPending && <p className="text-[11px] text-[var(--ink-2)] mb-2">Reading and indexing — this can take a moment.</p>}
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <div className="space-y-0.5">
        {docs.map((d) => (
          <div key={d.id} className="group/doc flex items-center gap-2.5 text-[12.5px] text-foreground px-2.5 py-2 rounded-lg hover:bg-[var(--hover-row)] transition-colors">
            <FileText className="h-3.5 w-3.5 text-[var(--ink-3)] shrink-0" />
            <span className="truncate flex-1" title={d.filename}>{d.filename}</span>
            <button
              onClick={() => onDiscuss(d)}
              className="text-[11px] text-primary font-medium lg:opacity-0 lg:group-hover/doc:opacity-100 focus:opacity-100 transition-opacity min-h-[32px] px-1"
              aria-label={`Discuss ${d.filename}`}
            >
              Discuss
            </button>
          </div>
        ))}
        {docs.length === 0 && <p className="text-xs text-[var(--ink-2)] leading-relaxed px-2">Nothing uploaded yet. Add lecture slides, homework, or readings — Horizon answers from these, and anyone can bring one into the conversation.</p>}
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={upload.isPending}
        className="mt-3 w-full h-9 rounded-lg border border-dashed border-input bg-card text-[12.5px] text-foreground/80 hover:bg-muted transition-colors disabled:opacity-50"
      >
        {upload.isPending ? 'Uploading…' : 'Add material'}
      </button>
    </div>
  )
}

function RightPanel({ group, onDiscuss }: { group: GroupDetailOut; onDiscuss: (doc: DocumentOut) => void }) {
  return (
    <aside className="w-[280px] max-w-[85vw] shrink-0 h-full overflow-y-auto bg-background border-l border-border p-4 space-y-6">
      <InvitePanel group={group} />
      <div className="border-t border-border pt-5">
        <h3 className={`${EYEBROW} mb-3`}>People ({group.members.length})</h3>
        <div className="space-y-0.5">
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5 text-[13px] px-2 py-1.5 rounded-lg">
              <Avatar label={m.display_name} size={24} />
              <span className="truncate text-foreground">{m.display_name}</span>
              {m.is_owner && <span className={`ml-auto ${EYEBROW}`}>owner</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border pt-5">
        <MaterialsPanel groupId={group.id} onDiscuss={onDiscuss} />
      </div>
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
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-foreground transition-colors min-h-[36px] px-1">
        <MessageCircle className="h-3.5 w-3.5" /> {count > 0 ? `${count} repl${count === 1 ? 'y' : 'ies'}` : 'Reply'}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {comments.map((c) => (
        <div key={c.comment_id} className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar label={c.display_name} size={24} />
            <span className="text-[13px] font-semibold text-foreground">{c.display_name}</span>
            <span className="text-xs text-[var(--ink-2)]">{timeOf(c.created_at)}</span>
          </div>
          <p className="mt-2 text-[14px] text-foreground/85 leading-relaxed whitespace-pre-wrap">{c.content}</p>
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
          className="flex-1 min-w-0 h-10 text-[13px] px-3.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        <button type="submit" disabled={!draft.trim() || post.isPending} aria-label="Send reply" className={`${GHOST_BTN} h-10 w-10 text-primary`}>
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
  const isFollowUp = FORK_PREFIX.test(q.content)
  const text = q.content.replace(FORK_PREFIX, '')
  const saved = q.answer ? savedIds.has(q.answer.answer_id) : false
  const citations = q.answer?.citations ?? []
  const first = citations.length > 0 ? [...citations].sort((a, b) => a.citation_order - b.citation_order)[0] : null

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-2.5">
      {/* the question */}
      <article className="rounded-xl border border-border bg-card px-4 py-4 md:px-5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Avatar label={q.asker_name} tone={q.is_mine ? 'me' : 'muted'} />
          <span className="text-[14px] font-semibold text-foreground">{q.is_mine ? 'You' : q.asker_name}</span>
          <span className="text-[12.5px] text-[var(--ink-2)]">{timeOf(q.asked_at)}</span>
          {isFollowUp && <span className="text-[12px] text-[var(--ink-2)] flex items-center gap-1"><CornerDownRight className="h-3 w-3" /> follow-up</span>}
          {q.focus_document_name && (
            <span className={`${CHIP} ml-auto max-w-full`} title={q.focus_document_name}>
              <FileText className="h-3 w-3 shrink-0" /> <span className="truncate">{q.focus_document_name}</span>
            </span>
          )}
        </div>
        <p className="mt-3 text-[16px] md:text-[17px] leading-[1.5] tracking-[-0.012em] text-foreground whitespace-pre-wrap">{text}</p>
      </article>

      {/* Horizon, on the AI surface */}
      <article className="rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-4 py-4 md:px-5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <HorizonMark />
          <span className="text-[14px] font-semibold text-accent-foreground">Horizon</span>
          {q.answer && (
            <span className="text-[12.5px] text-[var(--ai-meta)] truncate">
              {first ? `Answered from ${sourceName(first)} · ${citations.length} passage${citations.length === 1 ? '' : 's'}` : 'No passages cited'}
            </span>
          )}
        </div>
        {q.answer ? (
          <>
            <div className="mt-3 text-[15px] leading-[1.66] text-[var(--ai-text)]">{renderAnswerWithCitations(q.answer.content, q.answer.citations)}</div>
            <Sources citations={citations} />
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button onClick={() => onFollowUp(q)} className={`${GHOST_BTN} h-8 px-2.5 text-xs border-[var(--ai-border)] text-[var(--ai-text)]`}>
                <CornerDownRight className="h-3 w-3" /> Ask a follow-up
              </button>
              <button onClick={() => onFork(q)} className={`${GHOST_BTN} h-8 px-2.5 text-xs border-[var(--ai-border)] text-[var(--ai-text)]`} title="Explore this privately in My Chats">
                <GitFork className="h-3 w-3" /> Fork to my space
              </button>
              <button
                onClick={() => onToggleSave(q.answer!.answer_id)}
                aria-pressed={saved}
                className={`${GHOST_BTN} h-8 px-2.5 text-xs border-[var(--ai-border)] ${saved ? 'text-primary' : 'text-[var(--ai-text)]'}`}
              >
                <Bookmark className={`h-3 w-3 ${saved ? 'fill-current' : ''}`} /> {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-[var(--ai-meta)]">Reading the materials…</p>
        )}
      </article>

      <div className="pl-4 md:pl-10">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Fork to my space" onClick={close}>
      <div className="absolute inset-0 bg-foreground/35" />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }} className="relative w-full max-w-md rounded-2xl border border-input bg-card elevated-shadow overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground tracking-[-0.02em]">Fork to my space</h3>
            <p className="text-[13.5px] text-muted-foreground mt-1 leading-relaxed">
              {done ? "Saved. It's private to you — keep going in My Chats, and share it back whenever you like." : "Explore this on your own without changing the group conversation. Horizon still answers from this group's materials."}
            </p>
          </div>
          <button onClick={close} aria-label="Close" className="text-muted-foreground hover:text-foreground rounded-lg p-2 hover:bg-muted shrink-0"><X className="h-4 w-4" /></button>
        </div>
        {done ? (
          <div className="flex gap-2 justify-end px-6 py-4 bg-background">
            <Button variant="outline" className="h-9" onClick={onClose}>Stay here</Button>
            <Button className="h-9" onClick={() => navigate('/chats')}>Open My Chats</Button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5">
              <blockquote className="text-[13px] text-foreground/85 border-l-2 border-[var(--ai-border)] pl-3 mb-4 line-clamp-3 leading-relaxed">{source.content.replace(FORK_PREFIX, '')}</blockquote>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to dig into?"
                aria-label="Your private question"
                rows={3}
                maxLength={2000}
                autoFocus
                className="w-full px-3.5 py-3 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {fork.isError && <p className="text-xs text-destructive mt-2">Could not fork. Please try again.</p>}
            </div>
            <div className="flex gap-2 justify-end px-6 py-4 border-t border-border bg-background">
              <Button variant="outline" className="h-9" onClick={close}>Cancel</Button>
              <Button className="h-9" onClick={() => fork.mutate()} disabled={content.trim().length < 5 || fork.isPending}>{fork.isPending ? 'Forking…' : 'Fork to my space'}</Button>
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

  // Scope line (app UX rule 5): which materials answer, and who sees the question.
  const scope = replyTo
    ? 'Everyone in the group sees this follow-up.'
    : focusDoc
      ? `Answers from ${focusDoc.filename} first`
      : docs.length > 0
        ? `Answers use only this group's ${docs.length} material${docs.length === 1 ? '' : 's'}`
        : 'No materials yet — Horizon has nothing to answer from'

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-5">
        {questions.length === 0 && !showPending && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <p className="text-[15px] font-semibold text-foreground mb-1 tracking-[-0.01em]">This group is quiet so far.</p>
            <p className="text-sm text-muted-foreground leading-relaxed">Ask the first question, or pick a material and hit Discuss. Horizon answers from your group's materials and everyone can weigh in.</p>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
              <article className="rounded-xl border border-border bg-card px-4 py-4 md:px-5">
                <div className="flex items-center gap-2.5"><Avatar label="You" tone="me" /><span className="text-[14px] font-semibold text-foreground">You</span></div>
                <p className="mt-3 text-[16px] md:text-[17px] leading-[1.5] tracking-[-0.012em] text-foreground whitespace-pre-wrap">{pending}</p>
              </article>
              <article className="rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-4 py-4 md:px-5">
                <div className="flex items-center gap-2.5"><HorizonMark /><span className="text-[14px] font-semibold text-accent-foreground">Horizon</span></div>
                <p className="mt-3 text-sm text-[var(--ai-meta)]">Reading the materials…</p>
              </article>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <div className="shrink-0 px-4 md:px-8 pb-4 md:pb-6 pt-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-[var(--ink-2)] mb-2 px-1">
            <CornerDownRight className="h-3 w-3 shrink-0" />
            <span className="truncate">Following up on: “{replyTo.content.replace(FORK_PREFIX, '').slice(0, 80)}”</span>
            <button onClick={() => setReplyTo(null)} aria-label="Cancel follow-up" className="ml-auto hover:text-foreground p-2 -m-2"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
        {error && <p className="text-xs text-destructive mb-2 px-1">{error}</p>}
        <div className="rounded-xl border border-input bg-card card-shadow px-2 py-1.5 md:pl-3">
          {focusDoc && !replyTo && (
            <div className="flex items-center gap-2 px-1 pt-1 pb-1.5 flex-wrap">
              <span className={`${CHIP} pr-1`} title={focusDoc.filename}>
                <FileText className="h-3 w-3 shrink-0" /> <span className="truncate max-w-[220px]">{focusDoc.filename}</span>
                <button onClick={() => setFocusDoc(null)} aria-label="Remove attached material" className="rounded p-1 hover:bg-foreground/10"><X className="h-3 w-3" /></button>
              </span>
              <span className="text-[11px] text-[var(--ink-2)]">Horizon will answer from this material first.</span>
            </div>
          )}
          <div className="flex items-end gap-1.5">
            {!replyTo && (
              <div className="relative shrink-0" ref={attachRef}>
                <button
                  ref={attachButtonRef}
                  type="button"
                  onClick={() => setAttachOpen((o) => !o)}
                  aria-label="Attach a material"
                  aria-expanded={attachOpen}
                  className={`h-11 w-11 md:h-9 md:w-9 rounded-lg border flex items-center justify-center transition-colors ${attachOpen ? 'bg-muted border-input text-primary' : 'border-border text-[var(--ink-2)] hover:bg-muted'}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
                {attachOpen && (
                  <div className="absolute bottom-12 left-0 w-64 rounded-xl bg-card border border-input elevated-shadow p-1.5 z-20" role="menu">
                    <p className={`${EYEBROW} px-2 py-1.5`}>Discuss a material</p>
                    {docs.length === 0 && <p className="text-xs text-[var(--ink-2)] px-2 py-1.5">No materials yet — add one from the panel.</p>}
                    {docs.map((d) => (
                      <button key={d.id} role="menuitem" onClick={() => { setFocusDoc(d); setAttachOpen(false) }} className="w-full text-left flex items-center gap-2 px-2 py-2 min-h-[40px] rounded-lg text-[13px] hover:bg-[var(--hover-row)]">
                        <FileText className="h-3.5 w-3.5 text-[var(--ink-3)] shrink-0" /><span className="truncate">{d.filename}</span>
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
              placeholder={replyTo ? 'Your follow-up…' : focusDoc ? `Ask about ${focusDoc.filename}…` : 'Ask the group…'}
              aria-label={`Message ${group.name}`}
              rows={1}
              maxLength={2000}
              className="flex-1 min-w-0 resize-none bg-transparent px-2 py-2.5 text-[14.5px] text-foreground placeholder:text-[var(--ink-3)] focus:outline-none max-h-40"
              style={{ minHeight: 44 }}
            />
            {!replyTo && (
              <button
                type="button"
                onClick={() => setAnonymous((a) => !a)}
                aria-pressed={anonymous}
                aria-label={anonymous ? 'Asking anonymously — click to show your name' : 'Ask anonymously'}
                title={anonymous ? 'Asking anonymously — click to show your name' : 'Ask anonymously'}
                className={`h-11 w-11 md:h-9 md:w-9 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${anonymous ? 'bg-muted border-input text-primary' : 'border-border text-[var(--ink-2)] hover:bg-muted'}`}
              >
                {anonymous ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
            <Button onClick={submit} disabled={!content.trim() || ask.isPending} className="h-11 md:h-9 px-3 md:px-4 shrink-0 text-[13px]" aria-label="Ask Horizon">
              <Send className="h-4 w-4 md:hidden" /><span className="hidden md:inline">Ask Horizon</span>
            </Button>
          </div>
        </div>
        <p className="text-[11.5px] text-[var(--ink-3)] mt-2 px-1 flex flex-wrap items-center gap-x-2">
          <span>{scope}</span>
          <span aria-hidden>·</span>
          <span>Everyone in the group sees this.{anonymous && !replyTo ? ' Your name will be hidden on this one.' : ''}</span>
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
      <div className="h-full flex bg-card" style={{ minHeight: 0 }}>
        <div className="hidden md:flex h-full"><GroupsSidebar activeGroupId={groupId} /></div>
        {/* Keyed on the group so composer state (attached material etc.) resets when switching groups. */}
        <WorkspaceBody key={groupId ?? 'none'} groupId={groupId} />
      </div>
    </DashboardLayout>
  )
}

function WorkspaceHeader({ group, onDiscuss, onOpenPanel }: { group: GroupDetailOut; onDiscuss: (d: DocumentOut) => void; onOpenPanel: () => void }) {
  // Same query key as the materials panel — React Query dedupes the request.
  const { data: docs = [] } = useQuery({ queryKey: ['group-docs', group.id], queryFn: () => getGroupDocuments(group.id) })
  const shown = docs.slice(0, 4)
  const more = docs.length - shown.length
  const n = group.members.length

  return (
    <header className="shrink-0 px-4 md:px-8 pt-4 md:pt-5 border-b border-border bg-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12.5px] text-[var(--ink-2)]">Discussion</p>
          <h1 className="mt-1 text-[20px] md:text-[24px] font-semibold text-foreground tracking-[-0.024em] leading-tight truncate">{group.name}</h1>
          <p className="mt-1.5 text-[12.5px] text-[var(--ink-2)] truncate">
            {group.subject ? `${group.subject} · ` : ''}{n} member{n === 1 ? '' : 's'} · {group.question_count} question{group.question_count === 1 ? '' : 's'}
            {group.active_today > 0 && <> · {group.active_today} active today</>}
          </p>
        </div>
        <button type="button" onClick={onOpenPanel} className={`${GHOST_BTN} lg:hidden h-9 px-3 text-[13px] shrink-0`}>
          <Users className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Invite &amp; materials</span><span className="sm:hidden">More</span>
        </button>
      </div>
      <div className="mt-3.5 pb-3.5 flex items-center gap-2 flex-wrap">
        {shown.map((d) => (
          <button key={d.id} type="button" onClick={() => onDiscuss(d)} title={`Discuss ${d.filename}`} className={`${CHIP} h-7 max-w-[240px] hover:bg-muted transition-colors`}>
            <span className="truncate">{d.filename}</span>
          </button>
        ))}
        {more > 0 && <span className="text-xs text-[var(--ink-3)]">+{more} more</span>}
        <span className="text-xs text-[var(--ink-3)] ml-1">
          {docs.length === 0 ? 'No materials yet — add one so Horizon has something to answer from' : docs.length === 1 ? 'Horizon answers from this' : `Horizon answers from these ${docs.length}`}
        </span>
      </div>
    </header>
  )
}

function WorkspaceBody({ groupId }: { groupId?: string }) {
  const navigate = useNavigate()
  const [panelOpen, setPanelOpen] = useState(false)
  const [focusDoc, setFocusDoc] = useState<DocumentOut | null>(null)
  const { data: group, isError } = useQuery({ queryKey: ['group-detail', groupId], queryFn: () => getGroupDetail(groupId as string), enabled: !!groupId, refetchInterval: 15000 })

  const discuss = (d: DocumentOut) => { setFocusDoc(d); setPanelOpen(false) }

  return (
        <div className="flex-1 min-w-0 h-full flex flex-col bg-card">
          {group ? (
            <>
              <WorkspaceHeader group={group} onDiscuss={discuss} onOpenPanel={() => setPanelOpen(true)} />
              <div className="flex-1 min-h-0 flex">
                <Conversation group={group} focusDoc={focusDoc} setFocusDoc={setFocusDoc} />
                <div className="hidden lg:flex h-full"><RightPanel group={group} onDiscuss={discuss} /></div>
              </div>
              {panelOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setPanelOpen(false)}>
                  <div className="absolute inset-0 bg-foreground/35" />
                  <div className="absolute right-0 top-0 bottom-0 flex" onClick={(e) => e.stopPropagation()}><RightPanel group={group} onDiscuss={discuss} /></div>
                </div>
              )}
            </>
          ) : isError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <p className="text-sm font-medium text-foreground mb-1">Group not found</p>
              <p className="text-sm text-muted-foreground mb-4">It may have been removed, or you're not a member.</p>
              <Button variant="outline" className="h-9" onClick={() => navigate('/groups')}>Back to my groups</Button>
            </div>
          ) : groupId ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto w-full">
              <p className="text-lg font-semibold text-foreground mb-1 tracking-[-0.02em]">Study together</p>
              <p className="text-sm text-muted-foreground leading-relaxed">Create a group for a class, upload the materials, and invite classmates. Ask anything — Horizon answers from your materials and your group can discuss and verify.</p>
              <div className="md:hidden mt-5 w-full rounded-xl border border-border overflow-hidden text-left"><GroupsSidebar activeGroupId={groupId} /></div>
            </div>
          )}
        </div>
  )
}
