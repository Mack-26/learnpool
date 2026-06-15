import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bookmark, BookOpen, LogOut, Users, FileText, User } from 'lucide-react'
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

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const isMobile = useIsMobile()
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
        { icon: BookOpen, label: 'My Classes', shortLabel: 'Classes', path: '/classes' },
        { icon: FileText, label: 'Lecture Materials', shortLabel: 'Materials', path: '/classes/materials' },
        { icon: Bookmark, label: 'My Notes', shortLabel: 'Notes', path: '/notes' },
      ]

  const activeItem = navItems.reduce<typeof navItems[0] | null>((best, item) => {
    const matches = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    if (!matches) return best
    if (!best || item.path.length > best.path.length) return item
    return best
  }, null)

  return (
    <div
      className={`min-h-screen ${isMobile ? 'flex flex-col' : 'flex'}`}
      style={{ background: '#0c0c35' }}
    >
      {/* Sidebar — desktop only */}
      {!isMobile && (
        <aside className="w-60 shrink-0 flex flex-col" style={{ background: '#ffffff', boxShadow: '1px 0 0 rgba(134,134,172,0.15)' }}>
          {/* Logo */}
          <div style={{ padding: '1.5rem 1.25rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button
              onClick={() => navigate(isProfessor ? '/instructor' : '/classes')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <HorizonLogo variant="dark" size="2.5rem" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = activeItem?.path === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                  style={isActive ? { boxShadow: '0 1px 3px rgba(35,26,19,0.06)' } : {}}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                  <span className="min-w-0 truncate" title={item.label}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#272757' }} />
                  )}
                </button>
              )
            })}
          </nav>

          {/* User + logout */}
          <div className="p-3 mt-4" style={{ borderTop: '1px solid rgba(134,134,172,0.18)' }}>
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #272757, #505081)' }}
                >
                  {user.display_name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main
        className={`flex-1 overflow-auto ${isMobile ? 'p-4 pb-20' : 'p-8'}`}
        style={{ background: '#f7f7fc' }}
      >
        {children}
      </main>

      {/* Bottom tab bar — mobile only */}
      {isMobile && (
        <>
          {/* Profile overlay */}
          {profileOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setProfileOpen(false)}
            >
              <div
                className="absolute bottom-14 left-0 right-0 mx-3 rounded-2xl p-4"
                style={{ background: '#ffffff', boxShadow: '0 -4px 24px rgba(15,14,71,0.12)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {user && (
                  <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid rgba(134,134,172,0.18)' }}>
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #272757, #505081)' }}
                    >
                      {user.display_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.display_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: '#ef4444' }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}

          <nav
            className="fixed bottom-0 left-0 right-0 flex"
            style={{
              background: '#ffffff',
              boxShadow: '0 -1px 0 rgba(134,134,172,0.18)',
              height: '56px',
              zIndex: 50,
            }}
          >
            {navItems.map((item) => {
              const isActive = activeItem?.path === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => { setProfileOpen(false); navigate(item.path) }}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isActive ? '#272757' : '#8686AC',
                    padding: '6px 4px 4px',
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute top-0 left-1/2"
                      style={{
                        transform: 'translateX(-50%)',
                        width: '24px',
                        height: '2px',
                        borderRadius: '0 0 2px 2px',
                        background: '#272757',
                      }}
                    />
                  )}
                  <item.icon
                    style={{
                      width: '20px',
                      height: '20px',
                      strokeWidth: isActive ? 2.25 : 1.75,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: isActive ? 700 : 500,
                      lineHeight: 1,
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {item.shortLabel}
                  </span>
                </button>
              )
            })}

            {/* Account tab */}
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: profileOpen ? '#272757' : '#8686AC',
                padding: '6px 4px 4px',
              }}
            >
              {profileOpen && (
                <span
                  className="absolute top-0 left-1/2"
                  style={{
                    transform: 'translateX(-50%)',
                    width: '24px',
                    height: '2px',
                    borderRadius: '0 0 2px 2px',
                    background: '#272757',
                  }}
                />
              )}
              <User style={{ width: '20px', height: '20px', strokeWidth: profileOpen ? 2.25 : 1.75 }} />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: profileOpen ? 700 : 500,
                  lineHeight: 1,
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Account
              </span>
            </button>
          </nav>
        </>
      )}
    </div>
  )
}
