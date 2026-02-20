import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { icon: BookOpen, label: 'My Classes', path: '/classes' },
    { icon: Settings, label: 'AI Settings', path: '/settings' },
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-1">
            <img src="/logo.png" alt="LearnPool" className="h-20 w-20 rounded-xl shrink-0 object-contain" />
            <span className="text-xl font-bold text-foreground">LearnPool</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-border">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">
                  {user.display_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{user.display_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
