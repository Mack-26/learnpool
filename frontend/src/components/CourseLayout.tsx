import { useNavigate, useLocation } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'

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
  courseId: _courseId,
  courseName,
  backPath,
  backLabel,
  navItems,
  children,
}: CourseLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate(backPath)}
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← {backLabel}
      </button>

      {courseName && (
        <h1 className="text-xl font-bold text-foreground mb-4">{courseName}</h1>
      )}

      <div className="flex gap-6 min-h-0">
        {/* Secondary sidebar */}
        <nav className="w-44 shrink-0">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
