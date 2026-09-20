import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bookmark, Check, GitFork, Lock, Share2 } from 'lucide-react'
import { continuePrivateChat, getMyChats, sharePrivateChat } from '../api/groups'
import { renderAnswerWithCitations } from '../components/AnswerRenderer'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { SavedAnswersList } from './NotesPage'
import type { CitationOut, PrivateChatOut } from '../types/api'

const FORK_PREFIX = /^\[Forked from:[^\]]*\]\s*/

type Tab = 'explorations' | 'saved'

// Group private questions into chains. Each parent continues with its earliest
// child; any later siblings start their own chain so no branch is dropped.
function buildChains(chats: PrivateChatOut[]): PrivateChatOut[][] {
  const byId = new Map(chats.map((c) => [c.question_id, c]))
  const childrenOf = new Map<string, PrivateChatOut[]>()
  const roots: PrivateChatOut[] = []
  for (const c of chats) {
    if (c.forked_from && byId.has(c.forked_from)) {
      childrenOf.set(c.forked_from, [...(childrenOf.get(c.forked_from) ?? []), c])
    } else {
      roots.push(c)
    }
  }
  for (const kids of childrenOf.values()) {
    kids.sort((a, b) => a.asked_at.localeCompare(b.asked_at))
    roots.push(...kids.slice(1))
  }
  const visited = new Set<string>()
  const chainFrom = (root: PrivateChatOut): PrivateChatOut[] => {
    const chain: PrivateChatOut[] = []
    let cur: PrivateChatOut | undefined = root
    while (cur && !visited.has(cur.question_id)) {
      visited.add(cur.question_id)
      chain.push(cur)
      cur = childrenOf.get(cur.question_id)?.[0]
    }
    return chain
  }
  return roots
    .sort((a, b) => b.asked_at.localeCompare(a.asked_at))
    .map(chainFrom)
    .filter((chain) => chain.length > 0)
}

/** The small Horizon mark: a white disc with the horizon line in the accent colour. */
function HorizonMark({ size = 26 }: { size?: number }) {
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

function sourceName(c: CitationOut) {
  return c.filename || 'Source'
}

/** Numbered source chips, first passage open by default (app UX rule 4). */
function Sources({ citations }: { citations: CitationOut[] }) {
  const sorted = [...citations].sort((a, b) => a.citation_order - b.citation_order)
  const [openOrder, setOpenOrder] = useState<number | null>(sorted[0]?.citation_order ?? null)
  if (sorted.length === 0) return null
  const open = sorted.find((c) => c.citation_order === openOrder) ?? null
  const rest = sorted.filter((c) => c !== open)
  const excerpt = open ? (open.content.length > 220 ? open.content.slice(0, 220) + '…' : open.content) : ''
  return (
    <>
      {open && (
        <div className="mt-3 rounded-lg border border-[var(--ai-border)] bg-card px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-accent-foreground truncate">
              [{open.citation_order}] · {sourceName(open)}{open.page_number != null ? ` · Page ${open.page_number}` : ''}
            </span>
            <span className="text-xs text-[var(--ink-2)] shrink-0">{Math.round(open.relevance_score * 100)}% match</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">“{excerpt}”</p>
        </div>
      )}
      {rest.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {rest.map((c) => (
            <button
              key={c.chunk_id}
              type="button"
              onClick={() => setOpenOrder(c.citation_order)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-[var(--ai-border)] bg-card text-xs text-[var(--ai-text)] hover:bg-accent transition-colors"
            >
              <span className="font-semibold text-[var(--ai-meta)]">[{c.citation_order}]</span>
              <span className="truncate max-w-[180px]">{sourceName(c)}</span>
              <span className="text-[var(--ink-2)]">{c.page_number != null ? `· p. ${c.page_number} ` : ''}· {Math.round(c.relevance_score * 100)}% match</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function ExplorationCard({ chain }: { chain: PrivateChatOut[] }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const root = chain[0]
  const tail = chain[chain.length - 1]
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)  // synchronous guard; isPending only flips after a re-render

  const cont = useMutation({
    mutationFn: (text: string) => continuePrivateChat(tail.question_id, text),
    onSuccess: () => { setDraft(''); setError(null); queryClient.invalidateQueries({ queryKey: ['my-chats'] }) },
    onSettled: () => { submitting.current = false },
    onError: (err: unknown) => {
      const res = (err as { response?: { status?: number; data?: { detail?: string } } })?.response
      setError(res?.status === 429 ? (res.data?.detail ?? 'Daily question limit reached.') : 'Could not send. Please try again.')
    },
  })
  const share = useMutation({
    mutationFn: () => sharePrivateChat(root.question_id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-chats'] }); queryClient.invalidateQueries({ queryKey: ['group-questions'] }) },
  })

  const exchanges = chain.length

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* header: private chip, forked-from line, share back */}
      <header className="px-4 md:px-6 pt-4 md:pt-5 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md border border-border bg-muted text-[11.5px] text-foreground/80">
                <Lock className="h-3 w-3 text-[var(--ink-2)]" /> {root.shared ? 'Shared with the group' : 'Private to you'}
              </span>
              <button
                onClick={() => root.group_id && navigate(`/groups/${root.group_id}`)}
                className="text-xs text-[var(--ink-2)] hover:text-primary transition-colors min-w-0 truncate text-left"
              >
                Forked from{' '}
                {root.forked_from_content ? <span className="text-foreground/80">“{root.forked_from_content.replace(FORK_PREFIX, '').slice(0, 70)}”</span> : null}
                {root.forked_from_content ? ' · ' : ''}{root.group_name}
              </button>
            </div>
            <p className="mt-2 text-[12.5px] text-[var(--ink-2)]">
              {exchanges} exchange{exchanges === 1 ? '' : 's'}
              {root.focus_document_name ? ` · about ${root.focus_document_name}` : ''}
            </p>
          </div>
          {root.shared ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--status-good)] shrink-0 h-9">
              <Check className="h-3.5 w-3.5" /> Shared
            </span>
          ) : (
            <Button className="gap-2 shrink-0 h-9" onClick={() => share.mutate()} disabled={share.isPending}>
              <Share2 className="h-3.5 w-3.5" /> {share.isPending ? 'Sharing…' : 'Share with the group'}
            </Button>
          )}
        </div>
      </header>

      {/* exchanges */}
      <div className="px-4 md:px-6 py-4 space-y-3">
        {chain.map((c) => (
          <div key={c.question_id} className="space-y-3">
            <article className="rounded-xl border border-border bg-card px-4 py-3.5 md:px-5">
              <p className="text-[11.5px] text-[var(--ink-2)]">You asked</p>
              <p className="mt-1.5 text-[15.5px] leading-[1.5] tracking-[-0.012em] text-foreground whitespace-pre-wrap">{c.content.replace(FORK_PREFIX, '')}</p>
            </article>
            <article className="rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] px-4 py-3.5 md:px-5">
              <div className="flex items-center gap-2.5">
                <HorizonMark />
                <span className="text-[13.5px] font-semibold text-accent-foreground">Horizon</span>
                <span className="text-xs text-[var(--ai-meta)]">Same materials as the group</span>
              </div>
              {c.answer ? (
                <>
                  <div className="mt-2.5 text-[15px] leading-[1.65] text-[var(--ai-text)]">{renderAnswerWithCitations(c.answer.content, c.answer.citations)}</div>
                  <Sources citations={c.answer.citations} />
                </>
              ) : (
                <p className="mt-2.5 text-sm text-[var(--ai-meta)]">Reading the materials…</p>
              )}
            </article>
          </div>
        ))}
      </div>

      {/* keep going */}
      <div className="px-4 md:px-6 pb-4 md:pb-5">
        {error && <p className="text-xs text-destructive mb-2 px-1">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (draft.trim().length < 5 || submitting.current) return
            submitting.current = true
            cont.mutate(draft.trim())
          }}
          className="flex items-center gap-2 rounded-xl border border-input bg-card card-shadow pl-4 pr-2 py-1.5"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Keep going — nobody sees this until you share it…"
            aria-label="Continue this exploration"
            maxLength={2000}
            className="flex-1 min-w-0 h-9 bg-transparent text-[14.5px] text-foreground placeholder:text-[var(--ink-3)] focus:outline-none"
          />
          <Button type="submit" disabled={draft.trim().length < 5 || cont.isPending} className="h-9 px-3.5 text-[13px] shrink-0">
            {cont.isPending ? 'Asking…' : 'Ask Horizon'}
          </Button>
        </form>
      </div>
    </motion.section>
  )
}

export default function MyChatsPage() {
  const [tab, setTab] = useState<Tab>('explorations')
  const { data: chats = [], isLoading } = useQuery({ queryKey: ['my-chats'], queryFn: getMyChats })
  const chains = buildChains(chats)

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-semibold text-foreground tracking-[-0.024em] mb-1">My Chats</h1>
        <p className="text-muted-foreground mb-5">Your private space — explorations you've forked from groups, and answers you've saved.</p>

        <div className="flex gap-1 mb-6 border-b border-border">
          {([['explorations', 'Explorations', GitFork], ['saved', 'Saved answers', Bookmark]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`flex items-center gap-1.5 px-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {tab === 'saved' ? (
          <SavedAnswersList />
        ) : isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : chains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
            <div className="h-14 w-14 rounded-2xl bg-accent border border-[var(--ai-border)] flex items-center justify-center"><GitFork className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-base font-medium text-foreground">No explorations yet</p>
              <p className="text-sm mt-1 max-w-sm leading-relaxed">In a group, hit <span className="font-medium text-foreground">Fork to my space</span> on any answer to dig into it on your own. It shows up here, and you can share it back when you're ready.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl">
            {chains.map((chain) => <ExplorationCard key={chain[0].question_id} chain={chain} />)}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
