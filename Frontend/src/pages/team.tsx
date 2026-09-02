import { useEffect, useState } from 'react'
import { MoreHorizontal, Search, UserPlus } from 'lucide-react'
import { getUsers, listTasks } from '@/lib/api'
import type { User } from '@/lib/types'
import { JOB_ROLES } from '@/lib/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getAvatarColor, getInitials } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'

function getRoleBadgeClass(role: string) {
  switch (role) {
    case 'Admin': return 'border border-[#b2ddff] bg-[#eff8ff] text-[#175cd3]'
    case 'Engineer': return 'border border-[#d3d7e0] bg-white text-[#344054]'
    case 'Product Designer':
    case 'UI/UX Designer': return 'border border-[#e5d9c3] bg-[#fdf8f0] text-[#9a6b3f]'
    default: return 'border border-[#d0d5dd] bg-white text-[#344054]'
  }
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getUsers()])
      .then(async ([us]) => {
        setUsers(us)
        // Fetch assigned task counts for each user
        const counts: Record<string, number> = {}
        await Promise.allSettled(
          us.map((u) =>
            listTasks({ page: 1, limit: 1, assignee: u.id })
              .then((r) => { counts[u.id] = r.pagination.total })
              .catch(() => { counts[u.id] = 0 })
          )
        )
        setAssignedCounts(counts)
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) =>
    `${u.name} ${u.email} ${u.role} ${u.jobRole}`.toLowerCase().includes(search.toLowerCase()) &&
    (roleFilter === 'All' || (u.role === 'admin' ? 'Admin' : u.jobRole) === roleFilter)
  )

  const totalSeats = 7
  const remainingSeats = totalSeats - users.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Team</h1>
          <p className="mt-0.5 text-[12px] text-[#7a838b]">People working on your projects.</p>
        </div>
        <button className="flex shrink-0 items-center gap-2 rounded-md bg-[#111315] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#2b2e31] transition-colors">
          <UserPlus className="h-3.5 w-3.5" />
          Invite Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="h-8 w-full rounded-md border border-[#e1e4e7] bg-white pl-9 pr-3 text-[11px] outline-none placeholder:text-[#9ca3af] focus:border-[#111315]"
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-[#e1e4e7] bg-white px-3 py-1.5 text-[11px] text-[#374151]">
          <span className="text-[#9ca3af]">Role :</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-transparent text-[11px] text-[#374151] outline-none"
          >
            <option value="All">All</option>
            <option value="Admin">Admin</option>
            {JOB_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#e2e5e8] bg-white">
        <div className="min-w-[640px]">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1.8fr_130px_120px_100px_40px] items-center border-b border-[#edf0f2] px-5 py-3">
            {['Member', 'Email', 'Role', 'Assigned tasks', 'Status', ''].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[#9299a0]">{h}</span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1.8fr_130px_120px_100px_40px] items-center border-b border-[#f0f1f2] px-5 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-4 w-4" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[12px] text-[#9299a0]">No team members found.</div>
          ) : (
            filtered.map((member) => {
              const role = member.role === 'admin' ? 'Admin' : member.jobRole
              const status = 'Active'
              const isActive = true

              return (
                <div
                  key={member.id}
                  className="grid grid-cols-[2fr_1.8fr_130px_120px_100px_40px] items-center border-b border-[#f0f1f2] px-5 py-3.5 hover:bg-[#fafbfc] transition-colors last:border-0"
                >
                  {/* Member */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={`${getAvatarColor(member.name)} text-[10px] font-semibold text-white`}>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[12px] font-semibold text-[#111315]">{member.name}</span>
                  </div>

                  {/* Email */}
                  <span className="text-[12px] text-[#687078]">{member.email}</span>

                  {/* Role */}
                  <span className={`inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${getRoleBadgeClass(role)}`}>
                    {role}
                  </span>

                  {/* Assigned tasks */}
                  <span className="text-[12px] text-[#687078]">
                    {assignedCounts[member.id] ?? '—'} tasks
                  </span>

                  {/* Status */}
                  <span
                    className={`inline-flex w-fit items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? 'border border-[#b8e8c7] bg-[#effcf2] text-[#17833b]'
                        : 'border border-[#fde68a] bg-[#fffbeb] text-[#92400e]'
                    }`}
                  >
                    {status}
                  </span>

                  {/* Actions */}
                  <button className="flex h-7 w-7 items-center justify-center rounded text-[#9ca3af] hover:bg-[#f3f4f5] hover:text-[#374151]">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Footer */}
      {!loading && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#9299a0]">
            {filtered.length} member{filtered.length !== 1 ? 's' : ''} · {remainingSeats} seat{remainingSeats !== 1 ? 's' : ''} remaining
          </span>
          <button className="font-semibold text-[#356fe8] hover:underline">Manage seats</button>
        </div>
      )}
    </div>
  )
}
