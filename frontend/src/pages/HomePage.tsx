import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Plus, UsersRound } from 'lucide-react'
import { getHome } from '../api/groups'
import CreateGroupModal from '../components/CreateGroupModal'
import JoinGroupModal from '../components/JoinGroupModal'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import type { HomeActivityItem, HomeContinueItem, HomeGroupItem } from '../types/api'

function relativeTime(iso: string | null): string {
  if (!iso) return 'no activity yet'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d} days ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function targetFor(item: { course_type: string; group_id: string | null; course_id?: string }): string {
  if (item.course_type === 'study_group' && item.group_id) return `/groups/${item.group_id}`
  return item.course_id ? `/classes/${item.course_id}` : '/classes'
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.charAt(0) ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
  return (first + last).toUpperCase() || '?'
}

function stripForkPrefix(content: string): string {
  return content.replace(/^\[Forked from:[^\]]*\]\s*/, '')
}

const eyebrow = 'mono text-[9.5px] tracking-[.08em] text-(--ink-3)'
const panel = 'rounded-xl border border-border bg-card flex flex-col'
const rowHover = 'hover:bg-(--hover-row) transition-colors'

export default function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const { data, isLoading, error } = useQuery({ queryKey: ['home'], queryFn: getHome })

  const firstName = user?.display_name?.split(' ')[0]
  const weekday = new Date().toLocaleDateString(undefined, { weekday: 'long' })

  const afterGroupChange = (groupId: string) => {
    queryClient.invalidateQueries({ queryKey: ['home'] })
    queryClient.invalidateQueries({ queryKey: ['my-groups'] })
    setCreateOpen(false)
    setJoinOpen(false)
    navigate(`/groups/${groupId}`)
  }

  const groupsById = new Map<string, HomeGroupItem>((data?.groups ?? []).map((g) => [g.id, g]))

  const subtitleParts: string[] = [weekday]
  if (data) {
    const n = data.groups.length
    subtitleParts.push(n === 0 ? 'No study groups yet' : n === 1 ? '1 study group' : `${n} study groups`)
    const latest = data.recent_activity[0]
    if (latest) subtitleParts.push(`Last question ${relativeTime(latest.asked_at)}`)
  }
  // TODO(backend): the artboard's "Biology 101 is live now · Midterm 2 is in 11 days" needs
  // live-lecture status and deadlines on the home endpoint; neither exists yet.

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-5 max-w-[1180px]"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-[-.024em] text-foreground">
              {firstName ? `Your week, ${firstName}` : 'Your week'}
            </h1>
            <p className="mt-1.5 text-[13px] text-(--ink-2)">{subtitleParts.join(' · ')}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              className="min-h-11 sm:min-h-0 sm:h-[34px] flex-1 sm:flex-none px-3.5 text-[13px]"
              onClick={() => setJoinOpen(true)}
            >
              Join a group
            </Button>
            <Button
              className="min-h-11 sm:min-h-0 sm:h-[34px] flex-1 sm:flex-none gap-1.5 px-3.5 text-[13px]"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Create a study group
            </Button>
          </div>
        </div>

        {isLoading && <p className="text-sm text-(--ink-2)">Loading your week…</p>}
        {error && <p className="text-sm text-destructive">Couldn't load your home. Try refreshing.</p>}

        {data && (
          <>
            {/* Pick up where you left off */}
            <section aria-labelledby="pickup-heading">
              <h2 id="pickup-heading" className={eyebrow}>PICK UP WHERE YOU LEFT OFF</h2>
              {data.continue_studying.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-input bg-card p-6 text-center">
                  <p className="text-sm font-medium text-foreground">Nothing to pick up yet</p>
                  <p className="mt-1 text-[13px] text-(--ink-2)">
                    Create a study group for something you're studying, or join one with a code from a classmate.
                  </p>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.continue_studying.map((c: HomeContinueItem, i) => {
                    const isGroup = c.course_type === 'study_group'
                    const group = c.group_id ? groupsById.get(c.group_id) : undefined
                    const Icon = isGroup ? UsersRound : BookOpen
                    return (
                      <motion.button
                        key={c.course_id}
                        type="button"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        onClick={() => navigate(targetFor(c))}
                        className="text-left px-4 py-3.5 rounded-xl border border-input bg-card text-foreground hover:border-(--ink-3) hover:-translate-y-px hover-shadow transition-[border-color,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-3 w-3 text-(--ink-2) shrink-0" strokeWidth={1.75} />
                          <span className={eyebrow}>{isGroup ? 'STUDY GROUP' : 'CLASS'}</span>
                          <span className="ml-auto text-[11px] text-(--ink-3)">{relativeTime(c.last_activity)}</span>
                        </div>
                        <div className="mt-2 text-[14.5px] font-medium leading-[1.4] tracking-[-.012em] truncate">{c.name}</div>
                        <div className="mt-1.5 text-xs text-muted-foreground">
                          {group
                            ? `${group.member_count} ${group.member_count === 1 ? 'member' : 'members'}`
                            : isGroup
                              ? 'Study group'
                              : 'Course you are enrolled in'}
                          {/* TODO(backend): "You left a follow-up unanswered" / "2 new replies" need per-user last-seen tracking. */}
                        </div>
                        <div className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] text-primary">
                          Continue <ArrowRight className="h-3 w-3" strokeWidth={2} />
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </section>

            {/*
              The artboard's "your term in numbers" row (questions asked / answers saved / replies
              written) and its streak are omitted on purpose: rule 9 — no student-facing score —
              and the home endpoint has no such counts anyway.
            */}

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-3.5">
              {/* Recent activity */}
              <section aria-labelledby="activity-heading" className={`${panel} px-4 pt-4 pb-3 md:px-[18px]`}>
                <div>
                  <h2 id="activity-heading" className="text-[14.5px] font-semibold tracking-[-.012em] text-foreground">
                    What's been asked
                  </h2>
                  <p className="mt-1 text-xs text-(--ink-2)">Recent questions from you and your groups</p>
                </div>
                {data.recent_activity.length === 0 ? (
                  <p className="mt-4 text-[13px] text-(--ink-2)">Questions you and your groups ask will show up here.</p>
                ) : (
                  <ul className="mt-3 flex flex-col">
                    {data.recent_activity.map((a: HomeActivityItem) => {
                      const isYou = a.asker_name === 'You'
                      return (
                        <li key={a.question_id} className="border-t border-(--grid)">
                          <button
                            type="button"
                            onClick={() => navigate(targetFor(a))}
                            className={`w-full text-left flex items-start gap-2.5 px-2.5 py-3 rounded-lg ${rowHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                          >
                            <span
                              className={`h-[19px] w-[19px] rounded-full flex items-center justify-center text-[8px] font-semibold shrink-0 mt-0.5 ${
                                isYou ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground text-card'
                              }`}
                            >
                              {isYou ? 'ME' : initials(a.asker_name)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] leading-[1.45] text-foreground line-clamp-2">
                                {stripForkPrefix(a.content)}
                              </span>
                              <span className="block mt-0.5 text-[11.5px] text-(--ink-3) truncate">
                                {isYou ? 'You asked' : `${a.asker_name} asked`} in {a.course_name}
                              </span>
                            </span>
                            <span className="text-[11px] text-(--ink-3) shrink-0 mt-0.5">{relativeTime(a.asked_at)}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {/* TODO(backend): "since you were here" / unread counts need a per-user last-seen timestamp. */}
              </section>

              {/* Your groups */}
              <section aria-labelledby="groups-heading" className={`${panel} px-4 pt-4 pb-4 md:px-[18px]`}>
                <div>
                  <h2 id="groups-heading" className="text-[14.5px] font-semibold tracking-[-.012em] text-foreground">
                    Your study groups
                  </h2>
                  <p className="mt-1 text-xs text-(--ink-2)">
                    {data.groups.length === 0
                      ? 'Groups you create or join live here'
                      : `${data.groups.length} ${data.groups.length === 1 ? 'group' : 'groups'} · open one to ask`}
                  </p>
                </div>
                {data.groups.length === 0 ? (
                  <p className="mt-4 text-[13px] text-(--ink-2)">
                    You're not in any study groups yet. Start one, or join with a code.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col">
                    {data.groups.map((g) => (
                      <li key={g.id} className="border-t border-(--grid)">
                        <button
                          type="button"
                          onClick={() => navigate(`/groups/${g.id}`)}
                          className={`w-full text-left flex items-center gap-2.5 px-2.5 py-3 rounded-lg ${rowHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                        >
                          <span className="h-1.75 w-1.75 rounded-full bg-primary shrink-0" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12.5px] leading-[1.35] text-foreground truncate">{g.name}</span>
                            <span className="block text-[11px] text-(--ink-2)">
                              {g.member_count} {g.member_count === 1 ? 'member' : 'members'}
                            </span>
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-(--ink-3) shrink-0" strokeWidth={1.75} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-3.5 flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    className="flex-1 min-h-11 sm:min-h-0 sm:h-[38px] rounded-[9px] text-[13px]"
                    onClick={() => setJoinOpen(true)}
                  >
                    Join with a code
                  </Button>
                  <Button
                    className="flex-1 min-h-11 sm:min-h-0 sm:h-[38px] rounded-[9px] text-[13px]"
                    onClick={() => setCreateOpen(true)}
                  >
                    Start a group
                  </Button>
                </div>
              </section>
            </div>
          </>
        )}
      </motion.div>

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(g) => afterGroupChange(g.id)} />
      <JoinGroupModal open={joinOpen} onClose={() => setJoinOpen(false)} onJoined={(g) => afterGroupChange(g.id)} />
    </DashboardLayout>
  )
}
