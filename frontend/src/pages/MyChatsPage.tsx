import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bookmark, GitFork, Send, Share2, UsersRound } from 'lucide-react'
import { continuePrivateChat, getMyChats, sharePrivateChat } from '../api/groups'
import { renderAnswerWithCitations } from '../components/AnswerRenderer'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { SavedAnswersList } from './NotesPage'
import type { PrivateChatOut } from '../types/api'

const FORK_PREFIX = /^\[Forked from:[^\]]*\]\s*/

type Tab = 'explorations' | 'saved'

// Group a flat list of private questions into chains rooted at the fork from the group.
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
  const chainFrom = (root: PrivateChatOut): PrivateChatOut[] => {
    const chain = [root]
    let cur = root
    for (;;) {
      const next = (childrenOf.get(cur.question_id) ?? []).sort((a, b) => a.asked_at.localeCompare(b.asked_at))[0]
      if (!next) break
      chain.push(next)
      cur = next
    }
    return chain
  }
  return roots
    .sort((a, b) => b.asked_at.localeCompare(a.asked_at))
    .map(chainFrom)
}

function ExplorationCard({ chain }: { chain: PrivateChatOut[] }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const root = chain[0]
  const tail = chain[chain.length - 1]
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const cont = useMutation({
    mutationFn: (text: string) => continuePrivateChat(tail.question_id, text),
    onSuccess: () => { setDraft(''); setError(null); queryClient.invalidateQueries({ queryKey: ['my-chats'] }) },
    onError: (err: unknown) => {
      const res = (err as { response?: { status?: number; data?: { detail?: string } } })?.response
      setError(res?.status === 429 ? (res.data?.detail ?? 'Daily question limit reached.') : 'Could not send. Please try again.')
    },
  })
  const share = useMutation({
    mutationFn: () => sharePrivateChat(root.question_id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-chats'] }); queryClient.invalidateQueries({ queryKey: ['group-questions'] }) },
  })

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-2xl bg-white p-5" style={{ boxShadow: '0 1px 3px rgba(15,14,71,0.06)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <button onClick={() => root.group_id && navigate(`/groups/${root.group_id}`)} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary flex items-center gap-1.5">
            <UsersRound className="h-3 w-3" /> Forked from {root.group_name}
          </button>
          {root.forked_from_content && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">“{root.forked_from_content.replace(FORK_PREFIX, '')}”</p>
          )}
        </div>
        {root.shared ? (
          <span className="text-[11px] font-medium text-green-700 bg-green-50 rounded-md px-2 py-1 shrink-0 flex items-center gap-1"><Share2 className="h-3 w-3" /> Shared with group</span>
        ) : (
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => share.mutate()} disabled={share.isPending}>
            <Share2 className="h-3.5 w-3.5" /> {share.isPending ? 'Sharing…' : 'Share back to group'}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {chain.map((c) => (
          <div key={c.question_id} className="space-y-2">
            <p className="text-[15px] font-medium text-foreground">{c.content.replace(FORK_PREFIX, '')}</p>
            {c.answer ? (
              <div className="text-[14px] leading-relaxed text-foreground pl-3 border-l-2" style={{ borderColor: '#f59e0b' }}>
                {renderAnswerWithCitations(c.answer.content, c.answer.citations)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic pl-3">Thinking…</p>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-destructive mt-3">{error}</p>}
      <form
        onSubmit={(e) => { e.preventDefault(); if (draft.trim().length >= 5 && !cont.isPending) cont.mutate(draft.trim()) }}
        className="mt-4 flex items-center gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Keep exploring privately…"
          aria-label="Continue this exploration"
          maxLength={2000}
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button type="submit" size="sm" disabled={draft.trim().length < 5 || cont.isPending} aria-label="Send" className="h-9 w-9 p-0"><Send className="h-4 w-4" /></Button>
      </form>
    </motion.div>
  )
}

export default function MyChatsPage() {
  const [tab, setTab] = useState<Tab>('explorations')
  const { data: chats = [], isLoading } = useQuery({ queryKey: ['my-chats'], queryFn: getMyChats })
  const chains = buildChains(chats)

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">My Chats</h1>
        <p className="text-muted-foreground mb-5">Your private space — explorations you've forked from groups, and answers you've saved.</p>

        <div className="flex gap-1 mb-6 border-b border-border">
          {([['explorations', 'Explorations', GitFork], ['saved', 'Saved answers', Bookmark]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
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
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center"><GitFork className="h-7 w-7 text-primary opacity-60" /></div>
            <div>
              <p className="text-base font-medium text-foreground">No explorations yet</p>
              <p className="text-sm mt-1 max-w-sm">In a group, hit <span className="font-medium">Fork</span> on any answer to dig into it on your own. It shows up here, and you can share it back when you're ready.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {chains.map((chain) => <ExplorationCard key={chain[0].question_id} chain={chain} />)}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
