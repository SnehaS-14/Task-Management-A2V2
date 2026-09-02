import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  X,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { isAdmin } from '@/lib/roles'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarColor, getInitials } from '@/lib/format'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { listTasks } from '@/lib/api'
import { getRoleLabel } from '@/lib/roles'

const SIDEBAR_W = 232

function useBreadcrumbs() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)
  const crumbs: { label: string; to: string }[] = [{ label: 'TaskFlow', to: '/' }]
  let path = ''
  for (const part of parts) {
    path += `/${part}`
    const label =
      part === 'tasks'
        ? 'Tasks'
        : part === 'team'
        ? 'Team'
        : part === 'settings'
        ? 'Settings'
        : part === 'edit'
        ? 'Edit'
        : part.startsWith('TF-')
        ? part
        : part.length === 24
        ? `TF-${part.slice(-4).toUpperCase()}`
        : part.charAt(0).toUpperCase() + part.slice(1)
    crumbs.push({ label, to: path })
  }
  return crumbs
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [myTasksCount, setMyTasksCount] = useState<number | null>(null)
  const [headerSearch, setHeaderSearch] = useState('')
  const crumbs = useBreadcrumbs()

  useEffect(() => {
    if (!user) return
    listTasks({ page: 1, limit: 1, assignee: user.id })
      .then((r) => setMyTasksCount(r.pagination.total))
      .catch(() => {})
  }, [user])

  useEffect(() => {
    const search = headerSearch.trim()
    if (!search) return

    const timeout = window.setTimeout(() => {
      const target = `/tasks?search=${encodeURIComponent(search)}`
      if (`${location.pathname}${location.search}` !== target) {
        navigate(target)
      }
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [headerSearch, location.pathname, location.search, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/tasks', label: 'Tasks', icon: ClipboardList, end: false },
    { to: '/my-tasks', label: 'My Tasks', icon: ClipboardList, end: false, badge: myTasksCount },
    { to: '/team', label: 'Team', icon: Users, end: false },
    ...(isAdmin(user?.role)
      ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck, end: false }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#151719]">
      {/* Sidebar */}
      <aside
        style={{ width: SIDEBAR_W }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#e5e7eb] bg-white transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-[60px] items-center gap-2.5 border-b border-[#edf0f2] px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#101214] text-white">
            <ClipboardList className="h-4 w-4" />
          </div>
          <span className="text-[15px] font-bold tracking-[-0.03em]">TaskFlow</span>
          <button
            className="ml-auto rounded-md p-1 text-muted-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <div className="px-4 pb-1 pt-5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
          Workspace
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-[12.5px] font-medium transition-colors',
                  isActive
                    ? 'bg-[#f0f1f3] text-[#111315]'
                    : 'text-[#687078] hover:bg-[#f7f7f8] hover:text-[#111315]'
                )
              }
            >
              <item.icon className="h-[15px] w-[15px]" />
              {item.label}
              {item.badge !== undefined && item.badge !== null && (
                <span className="ml-auto rounded bg-[#eef0f2] px-1.5 py-0.5 text-[10px] font-semibold text-[#687078]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Settings + User */}
        <div className="border-t border-[#edf0f2] px-2 pb-3 pt-2">
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-[12.5px] font-medium transition-colors',
                isActive
                  ? 'bg-[#f0f1f3] text-[#111315]'
                  : 'text-[#687078] hover:bg-[#f7f7f8] hover:text-[#111315]'
              )
            }
          >
            <SettingsIcon className="h-[15px] w-[15px]" />
            Settings
          </NavLink>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-[#f7f7f8]">
                <Avatar className="h-8 w-8 shrink-0">
                  {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.name}'s profile`} />}
                  <AvatarFallback className={cn(getAvatarColor(user?.name ?? ''), 'text-[11px] font-semibold text-white')}>
                    {getInitials(user?.name ?? '')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[#111315]">{user?.name}</p>
                  <p className="truncate text-[10px] text-[#8a9299]">{user?.email}</p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                    {getRoleLabel(user?.role)}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#9ca3af]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-[232px]">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b border-[#e5e7eb] bg-white px-4 sm:px-6">
          <button
            className="rounded-md p-1 text-muted-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <nav className="hidden items-center gap-1.5 text-[11px] text-[#8a9299] md:flex">
            {crumbs.map((crumb, i) => (
              <span key={crumb.to} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[#cdd1d5]">›</span>}
                <NavLink
                  to={crumb.to}
                  className={cn(
                    'hover:text-[#111315]',
                    i === crumbs.length - 1 ? 'font-medium text-[#111315]' : ''
                  )}
                >
                  {crumb.label}
                </NavLink>
              </span>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative hidden w-56 sm:block">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af]" />
            <input
              aria-label="Search tasks"
              placeholder="Search tasks..."
              value={headerSearch}
              onChange={(e) => {
                const value = e.target.value
                setHeaderSearch(value)
                if (!value.trim() && location.pathname === '/tasks') {
                  navigate('/tasks')
                }
              }}
              className="h-8 w-full rounded-md border border-[#e1e4e7] bg-[#fafbfc] pl-9 pr-3 text-[11px] outline-none placeholder:text-[#9ca3af] focus:border-[#151719]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = headerSearch.trim()
                  navigate(`/tasks${value ? `?search=${encodeURIComponent(value)}` : ''}`)
                }
              }}
            />
          </div>

          {/* Bell */}
          <button
            aria-label="Notifications"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#697179] hover:bg-[#f3f4f5]"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Avatar */}
          <Avatar className="h-7 w-7">
            {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.name}'s profile`} />}
            <AvatarFallback className={cn(getAvatarColor(user?.name ?? ''), 'text-[10px] font-semibold text-white')}>
              {getInitials(user?.name ?? '')}
            </AvatarFallback>
          </Avatar>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 p-5 pb-20 sm:p-6 sm:pb-20 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-14 items-center justify-around border-t border-[#e5e7eb] bg-white px-3 lg:hidden">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn('flex min-w-14 flex-col items-center gap-1 text-[9px] font-medium', isActive ? 'text-[#111315]' : 'text-[#8a9299]')
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            cn('flex min-w-14 flex-col items-center gap-1 text-[9px] font-medium', isActive ? 'text-[#111315]' : 'text-[#8a9299]')
          }
        >
          <ClipboardList className="h-4 w-4" />
          Tasks
        </NavLink>
        <NavLink
          to="/team"
          className={({ isActive }) =>
            cn('flex min-w-14 flex-col items-center gap-1 text-[9px] font-medium', isActive ? 'text-[#111315]' : 'text-[#8a9299]')
          }
        >
          <Users className="h-4 w-4" />
          Team
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn('flex min-w-14 flex-col items-center gap-1 text-[9px] font-medium', isActive ? 'text-[#111315]' : 'text-[#8a9299]')
          }
        >
          <SettingsIcon className="h-4 w-4" />
          Settings
        </NavLink>
      </nav>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => setCreateOpen(false)}
      />
    </div>
  )
}
