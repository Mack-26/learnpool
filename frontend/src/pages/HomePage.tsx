import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Plus, UsersRound } from 'lucide-react'
import { getHome } from '../api/groups'
import CreateGroupModal from '../components/CreateGroupModal'
import JoinGroupModal from '../components/JoinGroupModal'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import type { HomeActivityItem, HomeContinueItem } from '../types/api'

function relativeTime(iso: string | null): string {
  if (!iso) return 'No activity yet'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Yesterday' : `${d} days ago`
}

function targetFor(item: { course_type: string; group_id: string | null; course_id?: string }): string {
  if (item.course_type === 'study_group' && item.group_id) return `/groups/${item.group_id}`
  return item.course_id ? `/classes/${item.course_id}` : '/classes'
}

export default function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const { data, isLoading, error } = useQuery({ queryKey: ['home'], queryFn: getHome })

  const firstName = user?.display_name?.split(' ')[0]

  const afterGroupChange = (groupId: string) => {
    queryClient.invalidateQueries({ queryKey: ['home'] })
    queryClient.invalidateQueries({ queryKey: ['my-groups'] })
    setCreateOpen(false)
    setJoinOpen(false)
    navigate(`/groups/${groupId}`)
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">{firstName ? `Hi ${firstName}` : 'Home'}</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setJoinOpen(true)}>Join a group</Button>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create a study group
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-8">Pick up where you left off.</p>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive text-sm">Couldn't load your home. Try refreshing.</p>}

        {data && (
          <div className="space-y-10">
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Continue studying</h2>
              {data.continue_studying.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                  <p className="text-sm font-medium text-foreground mb-1">Nothing here yet</p>
                  <p className="text-sm text-muted-foreground">Create a study group for a class you're taking, or join one with a code from a classmate.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.continue_studying.map((c: HomeContinueItem, i) => {
                    const isGroup = c.course_type === 'study_group'
                    return (
                      <motion.button
                        key={c.course_id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        onClick={() => navigate(targetFor(c))}
                        className="text-left p-4 rounded-2xl bg-white hover:-translate-y-0.5 transition-transform"
                        style={{ boxShadow: '0 1px 3px rgba(15,14,71,0.06)' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ background: isGroup ? 'linear-gradient(135deg, #272757, #505081)' : '#8686AC' }}
                          >
                            {isGroup ? <UsersRound className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                          </span>
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{isGroup ? 'Study group' : 'Class'}</span>
                        </div>
                        <p className="font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(c.last_activity)}</p>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent activity</h2>
              {data.recent_activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Questions you and your groups ask will show up here.</p>
              ) : (
                <div className="rounded-2xl bg-white divide-y divide-border" style={{ boxShadow: '0 1px 3px rgba(15,14,71,0.06)' }}>
                  {data.recent_activity.map((a: HomeActivityItem) => (
                    <button
                      key={a.question_id}
                      onClick={() => navigate(targetFor(a))}
                      className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-start gap-3"
                    >
                      <span className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5" style={{ background: a.asker_name === 'You' ? '#272757' : '#8686AC' }}>
                        {a.asker_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-foreground truncate">
                          <span className="font-medium">{a.asker_name}</span>
                          <span className="text-muted-foreground"> asked in </span>
                          <span className="font-medium">{a.course_name}</span>
                        </span>
                        <span className="block text-sm text-muted-foreground truncate">{a.content.replace(/^\[Forked from:[^\]]*\]\s*/, '')}</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0 mt-1">{relativeTime(a.asked_at)}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your groups</h2>
              <div className="flex flex-wrap gap-2">
                {data.groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => navigate(`/groups/${g.id}`)}
                    className="px-3.5 py-2 rounded-full bg-white text-sm text-foreground hover:bg-muted/60 transition-colors flex items-center gap-2"
                    style={{ boxShadow: '0 1px 2px rgba(15,14,71,0.06)' }}
                  >
                    <UsersRound className="h-3.5 w-3.5 text-muted-foreground" />
                    {g.name}
                    <span className="text-xs text-muted-foreground">{g.member_count}</span>
                  </button>
                ))}
                {data.groups.length === 0 && (
                  <p className="text-sm text-muted-foreground">You're not in any study groups yet.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </motion.div>

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(g) => afterGroupChange(g.id)} />
      <JoinGroupModal open={joinOpen} onClose={() => setJoinOpen(false)} onJoined={(g) => afterGroupChange(g.id)} />
    </DashboardLayout>
  )
}
