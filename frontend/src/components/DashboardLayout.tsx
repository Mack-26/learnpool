import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Home, LogOut, MessageSquare, PanelLeftClose, PanelLeftOpen, Users, FileText, User, UsersRound } from 'lucide-react'
import { useCollapsed } from '@/hooks/useCollapsed'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { getProfessorCourses } from '@/api/professor'
import { getCourses } from '@/api/sessions'
import HorizonLogo from '@/components/HorizonLogo'

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function initials(name: string | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.charAt(0) ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
  return (first + last).toUpperCase() || '?'
}

interface DashboardLayoutProps {
  children: React.ReactNode
  /** Drop main-area padding so the page can own its full-height layout (e.g. group workspace). */
  fullBleed?: boolean
}

export default function DashboardLayout({ children, fullBleed = false }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const isMobile = useIsMobile()
  const [collapsed, toggleCollapsed] = useCollapsed('nav')
  const isProfessor = user?.role === 'professor'
  const [profileOpen, setProfileOpen] = useState(false)

  const courseIdMatch = location.pathname.match(
    isProfessor ? /\/instructor\/courses\/([^/]+)/ : /\/classes\/([^/]+)/
  )
  const courseId = courseIdMatch?.[1]

  const { data: courses = [] } = useQuery({
    queryKey: isProfessor ? ['professor-courses'] : ['courses'],
    queryFn: isProfessor ? getProfessorCourses : getCourses,
  })
  const currentCourse = courseId ? courses.find((c) => c.id === courseId) : null

  const dashboardLabel = currentCourse ? currentCourse.name : 'Dashboard'
  const dashboardPath = courseId
    ? isProfessor
      ? `/instructor/courses/${courseId}`
      : `/classes/${courseId}`
    : isProfessor
      ? '/instructor'
      : '/classes'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = isProfessor
    ? [
        { icon: Users, label: dashboardLabel, shortLabel: 'Home', path: dashboardPath },
        { icon: FileText, label: 'Lecture Materials', shortLabel: 'Materials', path: '/instructor/materials' },
      ]
    : [
        { icon: Home, label: 'Home', shortLabel: 'Home', path: '/home' },
        { icon: UsersRound, label: 'Groups', shortLabel: 'Groups', path: '/groups' },
        { icon: BookOpen, label: 'Classes', shortLabel: 'Classes', path: '/classes' },
        { icon: MessageSquare, label: 'My Chats', shortLabel: 'Chats', path: '/chats' },
      ]

  const activeItem = navItems.reduce<typeof navItems[0] | null>((best, item) => {
    const matches = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    if (!matches) return best
    if (!best || item.path.length > best.path.length) return item
    return best
  }, null)

  return (
    <div className={`min-h-screen bg-card ${isMobile ? 'flex flex-col' : 'flex'}`}>
      {/* Sidebar — desktop only */}
      {!isMobile && (
        <aside
          className={`${collapsed ? 'w-[60px] px-2' : 'w-[232px] px-3.5'} shrink-0 flex flex-col gap-5 bg-background border-r border-border py-5 sticky top-0 h-screen transition-[width,padding] duration-200`}
        >
          {/* Logo + collapse toggle */}
          <div className={`flex items-center ${collapsed ? 'flex-col gap-3' : 'justify-between px-1.5'}`}>
            <button
              type="button"
              onClick={() => navigate(isProfessor ? '/instructor' : '/home')}
              className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Horizon home"
            >
              {collapsed ? <HorizonLogo mark size="1.75rem" /> : <HorizonLogo variant="dark" size="1.75rem" />}
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-(--hover-row) hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />}
            </button>
          </div>

          {/* Nav */}
          <div>
            {!collapsed && (
              <div className="mono px-2.5 text-[9.5px] tracking-[.09em] text-(--ink-3)">
                {isProfessor ? 'TEACHING' : 'MY SPACE'}
              </div>
            )}
            <nav className="mt-2.5 flex flex-col gap-0.5" aria-label="Primary">
              {navItems.map((item) => {
                const isActive = activeItem?.path === item.path
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 h-[34px] rounded-lg text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? 'justify-center px-0' : 'px-2.5'} ${
                      isActive
                        ? 'bg-accent text-primary font-medium'
                        : 'text-muted-foreground hover:bg-(--hover-row) hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                    {!collapsed && (
                      <span className="min-w-0 truncate" title={item.label}>
                        {item.label}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* User card + sign out */}
          <div className="mt-auto flex flex-col gap-1.5">
            {user && (
              collapsed ? (
                <div className="flex justify-center" title={`${user.display_name} · ${user.role}`}>
                  <span className="h-[30px] w-[30px] rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                    {initials(user.display_name)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[9px] bg-card border border-border">
                  <span className="h-[26px] w-[26px] rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {initials(user.display_name)}
                  </span>
                  <span className="min-w-0 text-[12.5px] leading-[1.3] text-foreground">
                    <span className="block truncate">{user.display_name}</span>
                    <span className="block text-[11px] text-(--ink-2) capitalize">{user.role}</span>
                  </span>
                </div>
              )
            )}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              title={collapsed ? 'Sign out' : undefined}
              className={`w-full flex items-center gap-2.5 h-[34px] rounded-lg text-[13px] text-muted-foreground hover:bg-(--hover-row) hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? 'justify-center px-0' : 'px-2.5'}`}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              {!collapsed && 'Sign out'}
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main
        className={`flex-1 min-w-0 overflow-auto bg-card ${
          fullBleed ? (isMobile ? 'pb-14' : '') : isMobile ? 'p-4 pb-20' : 'px-8 py-7'
        }`}
        style={fullBleed && !isMobile ? { height: '100vh' } : undefined}
      >
        {children}
      </main>

      {/* Bottom tab bar — mobile only */}
      {isMobile && (
        <>
          {/* Profile overlay */}
          {profileOpen && (
            <div className="fixed inset-0 z-40 bg-foreground/10" onClick={() => setProfileOpen(false)}>
              <div
                className="absolute bottom-14 left-0 right-0 mx-3 rounded-2xl p-4 bg-card border border-border elevated-shadow"
                onClick={(e) => e.stopPropagation()}
              >
                {user && (
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                    <span className="h-10 w-10 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                      {initials(user.display_name)}
                    </span>
                    <span className="min-w-0 text-sm leading-[1.3] text-foreground">
                      <span className="block truncate">{user.display_name}</span>
                      <span className="block text-xs text-(--ink-2) capitalize">{user.role}</span>
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 min-h-11 px-3 rounded-lg text-sm font-medium text-destructive hover:bg-(--hover-row) transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}

          <nav
            className="fixed bottom-0 left-0 right-0 z-50 flex h-14 bg-card border-t border-border"
            aria-label="Primary"
          >
            {navItems.map((item) => {
              const isActive = activeItem?.path === item.path
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => { setProfileOpen(false); navigate(item.path) }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 ${
                    isActive ? 'text-primary' : 'text-(--ink-3)'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-sm bg-primary" />
                  )}
                  <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
                  <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.shortLabel}
                  </span>
                </button>
              )
            })}

            {/* Account tab */}
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              aria-expanded={profileOpen}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 ${
                profileOpen ? 'text-primary' : 'text-(--ink-3)'
              }`}
            >
              {profileOpen && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-sm bg-primary" />
              )}
              <User className="h-5 w-5" strokeWidth={profileOpen ? 2.25 : 1.75} />
              <span className={`text-[10px] leading-none ${profileOpen ? 'font-semibold' : 'font-medium'}`}>
                Account
              </span>
            </button>
          </nav>
        </>
      )}
    </div>
  )
}
