import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  Search,
  ShieldCheck,
  UserCog,
  Users2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getAdmins, getUsers, assignUserRole } from '@/lib/api'
import type { User, UserRole } from '@/lib/types'
import { USER_ROLES } from '@/lib/types'
import { getRoleLabel } from '@/lib/roles'
import { useAuth } from '@/context/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getAvatarColor, getInitials } from '@/lib/format'

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full access. Can manage roles, assign tasks to anyone, and manage all tasks.',
  manager: 'Can assign tasks to members and manage tasks they are involved in.',
  member: 'Can create tasks, self-assign, and update status of tasks assigned to them.',
}

const ROLE_BADGE: Record<UserRole, string> = {
  admin: 'border-[#b2ddff] bg-[#eff8ff] text-[#175cd3]',
  manager: 'border-[#d0d5dd] bg-white text-[#344054]',
  member: 'border-[#e5d9c3] bg-[#fdf8f0] text-[#9a6b3f]',
}

const ROLE_STATS: { label: string; role: UserRole | 'all'; icon: typeof Users2 }[] = [
  { label: 'Everyone', role: 'all', icon: Users2 },
  { label: 'Admins', role: 'admin', icon: ShieldCheck },
  { label: 'Managers', role: 'manager', icon: UserCog },
  { label: 'Members', role: 'member', icon: Users2 },
]

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [admins, setAdmins] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [changing, setChanging] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getUsers(), getAdmins()])
      .then(([us, ads]) => {
        setUsers(us)
        setAdmins(ads)
      })
      .catch(() => {
        toast.error('Failed to load users')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          (roleFilter === 'all' || u.role === roleFilter) &&
          `${u.name} ${u.email} ${u.role}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [users, roleFilter, search]
  )

  const counts = useMemo(() => {
    const c: Record<UserRole | 'all', number> = {
      all: users.length,
      admin: admins.length,
      manager: users.filter((u) => u.role === 'manager').length,
      member: users.filter((u) => u.role === 'member').length,
    }
    return c
  }, [users, admins])

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setChanging(userId)
    try {
      const updated = await assignUserRole(userId, role)
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
      if (role === 'admin') {
        setAdmins((prev) =>
          prev.some((a) => a.id === userId)
            ? prev
            : [...prev, updated]
        )
      } else {
        setAdmins((prev) => prev.filter((a) => a.id !== userId))
      }
      toast.success(`Role updated to ${getRoleLabel(role)}`)
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any)?.response?.data?.error?.message
      toast.error(msg ?? 'Failed to update role')
    } finally {
      setChanging(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Admin</h1>
          <p className="mt-0.5 text-[12px] text-[#7a838b]">
            Manage team roles and assignments.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#e2e5e8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#374151]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#356fe8]" />
          {currentUser ? getRoleLabel(currentUser.role) : ''}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ROLE_STATS.map(({ label, role, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setRoleFilter(role as UserRole | 'all')}
            className={`rounded-md border p-4 text-left transition-colors ${
              roleFilter === role
                ? 'border-[#111315] bg-[#fafbfc]'
                : 'border-[#e2e5e8] bg-white hover:bg-[#fafbfc]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#7a838b]">{label}</span>
              <Icon className="h-3.5 w-3.5 text-[#9aa1a8]" />
            </div>
            {loading ? (
              <div className="mt-3 h-7 w-10 animate-pulse rounded bg-[#f0f1f2]" />
            ) : (
              <p className="mt-3 text-[22px] font-bold tracking-[-0.04em]">{counts[role]}</p>
            )}
          </button>
        ))}
      </div>

      {/* Assigned tasks indicator */}
      <div className="flex items-center gap-2 rounded-md border border-[#e5f3ff] bg-[#f5fbff] px-3.5 py-2.5 text-[11px] text-[#175cd3]">
        <ClipboardList className="h-4 w-4" />
        Admins and managers can assign tasks to any member. Members can only
        self-assign or be assigned.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role..."
            className="h-8 w-full rounded-md border border-[#e1e4e7] bg-white pl-9 pr-3 text-[11px] outline-none placeholder:text-[#9ca3af] focus:border-[#111315]"
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-[#e1e4e7] bg-white px-3 py-1.5 text-[11px] text-[#374151]">
          <span className="text-[#9ca3af]">Role :</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            className="bg-transparent text-[11px] text-[#374151] outline-none"
          >
            <option value="all">All</option>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>{getRoleLabel(r)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[#e2e5e8] bg-white">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[2fr_1.8fr_160px_120px] items-center border-b border-[#edf0f2] px-5 py-3">
            {['Member', 'Email', 'Role', 'Role assignment'].map((h) => (
              <span
                key={h}
                className="text-[10px] font-semibold uppercase tracking-wider text-[#9299a0]"
              >
                {h}
              </span>
            ))}
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[2fr_1.8fr_160px_120px] items-center border-b border-[#f0f1f2] px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[#f0f1f2]" />
                  <div className="h-3 w-28 animate-pulse rounded bg-[#f0f1f2]" />
                </div>
                <div className="h-3 w-36 animate-pulse rounded bg-[#f0f1f2]" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-[#f0f1f2]" />
                <div className="h-8 w-24 animate-pulse rounded-md bg-[#f0f1f2]" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center text-[12px] text-[#9299a0]">
              No team members found.
            </div>
          ) : (
            filtered.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[2fr_1.8fr_160px_120px] items-center border-b border-[#f0f1f2] px-5 py-3.5 transition-colors last:border-0 hover:bg-[#fafbfc]"
              >
                {/* Member */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={`${getAvatarColor(member.name)} text-[10px] font-semibold text-white`}
                    >
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[12px] font-semibold text-[#111315]">
                      {member.name}
                      {member.id === currentUser?.id && (
                        <span className="ml-1.5 text-[9px] font-medium text-[#9299a0]">
                          (you)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <span className="text-[12px] text-[#687078]">{member.email}</span>

                {/* Current role */}
                <span
                  className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGE[member.role]}`}
                >
                  {getRoleLabel(member.role)}
                </span>

                {/* Role assignment */}
                <div>
                  {member.id === currentUser?.id ? (
                    <span className="text-[10px] text-[#9ca3af]">
                      You can&apos;t change your own role
                    </span>
                  ) : (
                    <select
                      value={member.role}
                      disabled={changing === member.id}
                      onChange={(e) =>
                        handleRoleChange(
                          member.id,
                          e.target.value as UserRole
                        )
                      }
                      className="h-7 w-full rounded-md border border-[#e1e4e7] bg-white px-2 text-[11px] text-[#374151] outline-none focus:border-[#111315] disabled:opacity-50"
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {getRoleLabel(r)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Role legend */}
      <div className="rounded-lg border border-[#e2e5e8] bg-white p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#111315]">
          <CheckCircle2 className="h-4 w-4 text-[#356fe8]" />
          Role permissions
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {USER_ROLES.map((r) => (
            <div key={r} className="rounded-md border border-[#edf0f2] bg-[#fafbfc] p-3">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGE[r]}`}
              >
                {getRoleLabel(r)}
              </span>
              <p className="mt-2 text-[11px] leading-relaxed text-[#687078]">
                {ROLE_DESCRIPTIONS[r]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {changing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
    </div>
  )
}
