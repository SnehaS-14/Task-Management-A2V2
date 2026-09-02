import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { listTasks } from '@/lib/api'
import type { Task } from '@/lib/types'
import { StatusBadge, PriorityBadge } from '@/components/tasks/task-badges'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'

function getTaskId(id: string) {
  return `TF-${id.slice(-4).toUpperCase()}`
}

export default function MyTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listTasks({ page: 1, limit: 50, assignee: user.id, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((r) => setTasks(r.tasks))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">My Tasks</h1>
        <p className="mt-0.5 text-[12px] text-[#7a838b]">Tasks assigned to you.</p>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#e2e5e8] bg-white">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-[#f0f1f2] px-4 py-3.5">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-2.5 w-40" />
                <Skeleton className="h-2 w-16" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#e2e5e8] bg-white py-16">
          <ClipboardList className="mb-3 h-10 w-10 text-[#cdd1d5]" />
          <p className="text-[14px] font-semibold text-[#374151]">No tasks assigned to you</p>
          <p className="mt-1 text-[12px] text-[#9ca3af]">Tasks assigned to you will appear here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#e2e5e8] bg-white">
          <div className="hidden grid-cols-[2.5fr_1fr_1fr_1fr] border-b border-[#edf0f2] px-4 py-2.5 sm:grid">
            {['Title', 'Status', 'Priority', 'Created'].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[#9299a0]">{h}</span>
            ))}
          </div>
          {tasks.map((task, i) => (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className={cn(
                'grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 hover:bg-[#fafbfc] transition-colors sm:grid-cols-[2.5fr_1fr_1fr_1fr]',
                i < tasks.length - 1 ? 'border-b border-[#f0f1f2]' : ''
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[#111315]">{task.title}</p>
                <p className="mt-0.5 text-[10px] text-[#9299a0]">{getTaskId(task.id)}</p>
              </div>
              <div className="hidden sm:block"><StatusBadge status={task.status} /></div>
              <div className="hidden sm:block"><PriorityBadge priority={task.priority} /></div>
              <span className="hidden text-[11px] text-[#9299a0] sm:block">{formatDate(task.createdAt)}</span>
              <div className="flex flex-col items-end gap-1 sm:hidden">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
