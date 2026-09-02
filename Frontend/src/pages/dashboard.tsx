import { useEffect, useState } from 'react'
import { ArrowUpRight, CheckCircle2, CircleDashed, Clock3, ListTodo } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listTasks } from '@/lib/api'
import type { Task } from '@/lib/types'
import { StatusBadge, PriorityBadge } from '@/components/tasks/task-badges'
import { formatDate } from '@/lib/date'
import { useAuth } from '@/context/auth-context'
import { Skeleton } from '@/components/ui/skeleton'

const metrics = [
  ['Total tasks', 'total', ListTodo],
  ['To do', 'todo', CircleDashed],
  ['In progress', 'progress', Clock3],
  ['Completed', 'done', CheckCircle2],
] as const

export default function DashboardPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { listTasks({ page: 1, limit: 6, sortBy: 'updatedAt', sortOrder: 'desc' }).then((result) => setTasks(result.tasks)).catch(() => setTasks([])).finally(() => setLoading(false)) }, [])
  const counts = { total: tasks.length, todo: tasks.filter((task) => task.status === 'Todo').length, progress: tasks.filter((task) => task.status === 'In Progress').length, done: tasks.filter((task) => task.status === 'Done').length }

  return <div className="space-y-7">
    <div className="flex items-end justify-between gap-4"><div><p className="mb-2 text-[11px] font-medium text-[#8a9299]">TaskFlow / Dashboard</p><h1 className="text-[24px] font-bold tracking-[-0.04em]">Good morning, {user?.name?.split(' ')[0] ?? 'there'}</h1><p className="mt-1 text-[12px] text-[#7a838b]">Here&apos;s what&apos;s happening with your tasks.</p></div><Link to="/tasks" className="hidden items-center gap-2 rounded-md bg-[#111315] px-3 py-2 text-[11px] font-semibold text-white sm:flex">View all tasks <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label, key, Icon]) => <div key={label} className="rounded-md border border-[#e2e5e8] bg-white p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-medium text-[#7a838b]">{label}</span><Icon className="h-3.5 w-3.5 text-[#9aa1a8]" /></div>{loading ? <><Skeleton className="mt-3 h-7 w-10" /><Skeleton className="mt-2 h-2 w-20" /></> : <><p className="mt-3 text-[22px] font-bold tracking-[-0.04em]">{counts[key]}</p><p className="mt-1 text-[9px] text-[#8c949b]">+0% from last week</p></>}</div>)}</div>
    <section className="overflow-hidden rounded-md border border-[#e2e5e8] bg-white"><div className="flex items-center justify-between border-b border-[#edf0f2] px-4 py-3"><h2 className="text-[12px] font-bold">Recent tasks</h2><Link to="/tasks" className="text-[10px] font-semibold text-[#356fe8]">View all tasks</Link></div>{loading ? <div className="divide-y divide-[#f0f1f2]">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="flex items-center justify-between px-4 py-3"><div className="space-y-2"><Skeleton className="h-2.5 w-48" /><Skeleton className="h-2 w-16" /></div><Skeleton className="h-4 w-16" /></div>)}</div> : tasks.length ? <div className="divide-y divide-[#f0f1f2]">{tasks.map((task) => <Link to={`/tasks/${task.id}`} key={task.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 hover:bg-[#fafbfc] sm:grid-cols-[1fr_100px_90px_90px]"><div className="min-w-0"><p className="truncate text-[11px] font-semibold">{task.title}</p><p className="mt-0.5 text-[9px] text-[#9299a0]">Updated {formatDate(task.updatedAt)}</p></div><StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /><span className="hidden text-right text-[10px] text-[#8a9299] sm:block">{task.assignee?.name ?? 'Unassigned'}</span></Link>)}</div> : <div className="p-10 text-center text-[12px] text-[#8a9299]">No tasks yet. Create your first task to get started.</div>}</section>
  </div>
}
