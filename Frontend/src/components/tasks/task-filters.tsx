import { useEffect, useState } from 'react'
import { ArrowUpDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  TaskPriority,
  TaskQuery,
  TaskStatus,
  User,
} from '@/lib/types'

interface TaskFiltersProps {
  query: TaskQuery
  onQueryChange: (query: TaskQuery) => void
  users: User[]
  loadingUsers?: boolean
}

export function TaskFilters({
  query,
  onQueryChange,
  users,
  loadingUsers,
}: TaskFiltersProps) {
  const [searchInput, setSearchInput] = useState(query.search ?? '')

  useEffect(() => {
    setSearchInput(query.search ?? '')
  }, [query.search])

  const update = (patch: Partial<TaskQuery>) => {
    onQueryChange({ ...query, ...patch, page: 1 })
  }

  const submitSearch = () => {
    update({ search: searchInput.trim() || undefined })
  }

  const hasFilters =
    query.search || query.status || query.priority || query.assignee

  const clearAll = () => {
    setSearchInput('')
    onQueryChange({
      page: 1,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
            placeholder="Search tasks…"
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent"
              onClick={() => {
                setSearchInput('')
                update({ search: undefined })
              }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <Select
            value={query.status ?? 'all'}
            onValueChange={(v) =>
              update({ status: v === 'all' ? undefined : (v as TaskStatus) })
            }
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Todo">Todo</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={query.priority ?? 'all'}
            onValueChange={(v) =>
              update({
                priority: v === 'all' ? undefined : (v as TaskPriority),
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={query.assignee ?? 'all'}
            onValueChange={(v) =>
              update({ assignee: v === 'all' ? undefined : v })
            }
            disabled={loadingUsers}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={`${query.sortBy ?? 'createdAt'}:${query.sortOrder ?? 'desc'}`}
            onValueChange={(v) => {
              const [sortBy, sortOrder] = v.split(':')
              update({
                sortBy: sortBy as TaskQuery['sortBy'],
                sortOrder: sortOrder as TaskQuery['sortOrder'],
              })
            }}
          >
            <SelectTrigger className="w-full sm:w-[170px]">
              <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc">Newest first</SelectItem>
              <SelectItem value="createdAt:asc">Oldest first</SelectItem>
              <SelectItem value="priority:desc">Priority: high → low</SelectItem>
              <SelectItem value="priority:asc">Priority: low → high</SelectItem>
              <SelectItem value="title:asc">Title: A → Z</SelectItem>
              <SelectItem value="title:desc">Title: Z → A</SelectItem>
              <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
