import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ChevronUp, ChevronDown, Plus, Search, X } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage, getUsers, listTasks } from '@/lib/api'
import type { Task, TaskQuery, User } from '@/lib/types'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { StatusBadge, PriorityBadge } from '@/components/tasks/task-badges'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getAvatarColor, getInitials } from '@/lib/format'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'

const DEFAULT_LIMIT = 15

type SortField = 'title' | 'status' | 'priority' | 'createdAt' | 'updatedAt'

function getTaskId(id: string) {
  return `TF-${id.slice(-4).toUpperCase()}`
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy?: string; sortOrder?: string }) {
  if (sortBy !== field) return <span className="ml-1 inline-block h-3 w-3 opacity-0 group-hover:opacity-30">↕</span>
  return sortOrder === 'asc'
    ? <ChevronUp className="ml-1 inline-block h-3 w-3" />
    : <ChevronDown className="ml-1 inline-block h-3 w-3" />
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e2e5e8] bg-white">
      <div className="hidden grid-cols-[2.5fr_1fr_1fr_1.2fr_1fr] gap-4 border-b border-[#edf0f2] px-4 py-3 sm:grid">
        {['Title', 'Status', 'Priority', 'Assignee', 'Created'].map((_, i) => (
          <Skeleton key={i} className="h-2 w-14" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-[#f0f1f2] px-4 py-3.5">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-40" />
            <Skeleton className="h-2 w-16" />
          </div>
          <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
          <Skeleton className="hidden h-5 w-16 rounded-full sm:block" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="hidden h-4 w-20 sm:block" />
        </div>
      ))}
    </div>
  )
}

export default function TasksPage() {
  const [searchParams] = useSearchParams()
  const urlSearch = searchParams.get('search') ?? undefined
  const [query, setQuery] = useState<TaskQuery>({
    page: 1,
    limit: DEFAULT_LIMIT,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: urlSearch,
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 0 })
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(urlSearch ?? '')

  useEffect(() => {
    getUsers().then(setUsers).catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    setSearchInput(urlSearch ?? '')
    setQuery((q) => ({ ...q, search: urlSearch, page: 1 }))
  }, [urlSearch])

  useEffect(() => {
    const trimmedSearch = searchInput.trim() || undefined
    const timeout = window.setTimeout(() => {
      setQuery((q) =>
        q.search === trimmedSearch
          ? q
          : { ...q, search: trimmedSearch, page: 1 }
      )
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    listTasks(query)
      .then((r) => { if (active) { setTasks(r.tasks); setPagination(r.pagination) } })
      .catch((e) => { if (active) setError(getErrorMessage(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query])

  const handleSort = (field: SortField) => {
    setQuery((q) => ({
      ...q,
      sortBy: field,
      sortOrder: q.sortBy === field && q.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1,
    }))
  }

  const hasFilters = Boolean(query.search || query.status || query.priority || query.assignee)

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setQuery((q) => ({ page: 1, limit: q.limit, sortBy: q.sortBy, sortOrder: q.sortOrder }))
  }, [])

  const submitSearch = () => {
    setQuery((q) => ({ ...q, search: searchInput.trim() || undefined, page: 1 }))
  }

  const thClass = 'group cursor-pointer select-none whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9299a0] hover:text-[#555]'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Tasks</h1>
          <p className="mt-0.5 text-[12px] text-[#7a838b]">Track, manage, and collaborate on your team's work.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#111315] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#2b2e31] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Task
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
            placeholder="Search tasks..."
            className="h-8 w-full rounded-md border border-[#e1e4e7] bg-white pl-9 pr-8 text-[11px] outline-none placeholder:text-[#9ca3af] focus:border-[#111315]"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setQuery((q) => ({ ...q, search: undefined, page: 1 })) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#555]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={query.status ?? ''}
          onChange={(e) => setQuery((q) => ({ ...q, status: (e.target.value as any) || undefined, page: 1 }))}
          className="h-8 rounded-md border border-[#e1e4e7] bg-white px-2.5 text-[11px] text-[#374151] outline-none focus:border-[#111315]"
        >
          <option value="">All statuses</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        {/* Priority filter */}
        <select
          value={query.priority ?? ''}
          onChange={(e) => setQuery((q) => ({ ...q, priority: (e.target.value as any) || undefined, page: 1 }))}
          className="h-8 rounded-md border border-[#e1e4e7] bg-white px-2.5 text-[11px] text-[#374151] outline-none focus:border-[#111315]"
        >
          <option value="">All priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        {/* Assignee filter */}
        <select
          value={query.assignee ?? ''}
          onChange={(e) => setQuery((q) => ({ ...q, assignee: e.target.value || undefined, page: 1 }))}
          className="h-8 rounded-md border border-[#e1e4e7] bg-white px-2.5 text-[11px] text-[#374151] outline-none focus:border-[#111315]"
        >
          <option value="">All assignees</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="h-8 rounded-md px-2.5 text-[11px] text-[#356fe8] hover:bg-blue-50 border border-transparent">
            Clear filters
          </button>
        )}

        <span className="ml-auto text-[11px] text-[#9ca3af]">
          {!loading && `${pagination.total} task${pagination.total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setQuery((q) => ({ ...q }))} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-6 w-6" />}
          title="No tasks found"
          description={
            hasFilters
              ? 'No tasks match your current filters.'
              : "You don't have any tasks yet. Create your first task to get started."
          }
          action={
            hasFilters ? (
              <button onClick={clearFilters} className="rounded-md border border-[#e1e4e7] px-4 py-2 text-[12px] hover:bg-[#f7f7f8]">
                Clear filters
              </button>
            ) : (
              <button onClick={() => setCreateOpen(true)} className="rounded-md bg-[#111315] px-4 py-2 text-[12px] text-white hover:bg-[#2b2e31]">
                Create your first task
              </button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#e2e5e8] bg-white">
          {/* Table header */}
          <div className="hidden grid-cols-[2.5fr_1fr_1fr_1.2fr_1fr] border-b border-[#edf0f2] sm:grid">
            <button onClick={() => handleSort('title')} className={thClass}>
              Title <SortIcon field="title" sortBy={query.sortBy} sortOrder={query.sortOrder} />
            </button>
            <button onClick={() => handleSort('status')} className={thClass}>
              Status <SortIcon field="status" sortBy={query.sortBy} sortOrder={query.sortOrder} />
            </button>
            <button onClick={() => handleSort('priority')} className={thClass}>
              Priority <SortIcon field="priority" sortBy={query.sortBy} sortOrder={query.sortOrder} />
            </button>
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9299a0]">
              Assignee
            </th>
            <button onClick={() => handleSort('createdAt')} className={thClass}>
              Created <SortIcon field="createdAt" sortBy={query.sortBy} sortOrder={query.sortOrder} />
            </button>
          </div>

          {/* Table rows */}
          {tasks.map((task, i) => (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className={cn(
                'grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 hover:bg-[#fafbfc] transition-colors sm:grid-cols-[2.5fr_1fr_1fr_1.2fr_1fr]',
                i < tasks.length - 1 ? 'border-b border-[#f0f1f2]' : ''
              )}
            >
              {/* Title */}
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[#111315]">{task.title}</p>
                <p className="mt-0.5 text-[10px] text-[#9299a0]">{getTaskId(task.id)}</p>
              </div>

              {/* Status */}
              <div className="hidden sm:block">
                <StatusBadge status={task.status} />
              </div>

              {/* Priority */}
              <div className="hidden sm:block">
                <PriorityBadge priority={task.priority} />
              </div>

              {/* Assignee */}
              <div className="hidden items-center gap-2 sm:flex">
                {task.assignee ? (
                  <>
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className={cn(getAvatarColor(task.assignee.name), 'text-[8px] font-semibold text-white')}>
                        {getInitials(task.assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-[11px] text-[#374151]">{task.assignee.name}</span>
                  </>
                ) : (
                  <span className="text-[11px] text-[#9ca3af]">Unassigned</span>
                )}
              </div>

              {/* Created */}
              <div className="hidden sm:block">
                <span className="text-[11px] text-[#9299a0]">{formatDate(task.createdAt)}</span>
              </div>

              {/* Mobile: badges only */}
              <div className="flex flex-col items-end gap-1 sm:hidden">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#9ca3af]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setQuery((q) => ({ ...q, page: q.page! - 1 }))}
              className="rounded-md border border-[#e1e4e7] px-3 py-1.5 text-[11px] hover:bg-[#f7f7f8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setQuery((q) => ({ ...q, page: q.page! + 1 }))}
              className="rounded-md border border-[#e1e4e7] px-3 py-1.5 text-[11px] hover:bg-[#f7f7f8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => setQuery((q) => ({ ...q }))}
      />
    </div>
  )
}
