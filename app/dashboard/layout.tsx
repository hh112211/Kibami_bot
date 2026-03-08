import { Bot, LayoutDashboard, Users, MessageSquare, Calendar, Settings } from 'lucide-react'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Bot className="h-6 w-6 text-primary" />
          <span className="font-semibold">Grand Flow</span>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          <NavLink href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />}>
            Overview
          </NavLink>
          <NavLink href="/dashboard/users" icon={<Users className="h-5 w-5" />}>
            Users
          </NavLink>
          <NavLink href="/dashboard/conversations" icon={<MessageSquare className="h-5 w-5" />}>
            Conversations
          </NavLink>
          <NavLink href="/dashboard/dates" icon={<Calendar className="h-5 w-5" />}>
            Important Dates
          </NavLink>
          <NavLink href="/dashboard/settings" icon={<Settings className="h-5 w-5" />}>
            Settings
          </NavLink>
        </nav>
        
        <div className="border-t border-border p-4">
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Home
          </Link>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
