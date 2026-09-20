import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'

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

export interface CourseNavItem {
  label: string
  path: string
}

interface CourseLayoutProps {
  courseId: string
  courseName?: string
  backPath: string
  backLabel: string
  navItems: CourseNavItem[]
  children: React.ReactNode
}

export default function CourseLayout({
  courseName,
  backLabel,
  navItems,
  children,
}: CourseLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DashboardLayout>
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 transition-colors">
          ← {backLabel}
        </button>
        {courseName && <h1 className="text-xl font-bold text-foreground mb-4">{courseName}</h1>}
        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-secondary border border-border">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 px-2 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-accent text-primary font-semibold border border-[var(--ai-border)]'
                    : 'text-muted-foreground hover:text-foreground font-medium border border-transparent'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
        <div className="min-w-0">{children}</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← {backLabel}
      </button>

      {courseName && (
        <h1 className="text-xl font-bold text-foreground mb-4">{courseName}</h1>
      )}

      <div className="flex gap-6 min-h-0">
        {/* Secondary sidebar */}
        <nav className="w-44 shrink-0 border-r border-border pr-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-accent text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-[var(--hover-row)]'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </DashboardLayout>
  )
}
