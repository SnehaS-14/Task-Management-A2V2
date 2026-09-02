import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge, PriorityBadge } from '@/components/tasks/task-badges'
import { CommentsSection } from '@/components/comments/comments-section'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { getAvatarColor, getInitials } from '@/lib/format'
import { formatDate, timeAgo } from '@/lib/date'
import { useAuth } from '@/context/auth-context'
import { isAdmin } from '@/lib/roles'
import { getErrorMessage, getTask, deleteTask, createTask } from '@/lib/api'
import type { Comment as CommentType, TaskWithComments } from '@/lib/types'
import { cn } from '@/lib/utils'

function getTaskId(id: string) {
  return `TF-${id.slice(-4).toUpperCase()}`
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [task, setTask] = useState<TaskWithComments | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadTask = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getTask(id)
      setTask(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadTask() }, [loadTask])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isCreator = task && user && task.creator.id === user.id
  const isAssignee = task && user && task.assignee?.id === user.id
  const isAdminRole = isAdmin(user?.role)
  const canEdit = Boolean(isCreator || isAssignee || isAdminRole)

  const canDelete = Boolean(isCreator || isAdminRole)

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteTask(id)
      toast.success('Task deleted')
      navigate('/tasks')
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleteOpen(false)
    }
  }

  const handleDuplicate = async () => {
    if (!task) return
    setMenuOpen(false)
    try {
      const newTask = await createTask({
        title: `${task.title} (copy)`,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee?.id ?? null,
        dueDate: task.dueDate ?? null,
      })
      toast.success('Task duplicated')
      navigate(`/tasks/${newTask.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 text-[12px] text-[#687078] hover:text-[#111315]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tasks
        </button>
        <EmptyState
          icon={<Trash2 className="h-6 w-6" />}
          title="Task not found"
          description={error ?? 'The task you are looking for does not exist.'}
          action={<button onClick={() => navigate('/tasks')} className="rounded-md bg-[#111315] px-4 py-2 text-[12px] text-white">Back to tasks</button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link to="/tasks" className="inline-flex items-center gap-1.5 text-[11px] text-[#687078] hover:text-[#111315]">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to tasks
      </Link>

      {/* Task ID + Title + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-semibold text-[#9299a0]">{getTaskId(task.id)}</p>
          <h1 className="break-words text-[22px] font-bold leading-tight tracking-tight text-[#111315]">
            {task.title}
          </h1>
          {/* Status + Priority + Updated info */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className="text-[10px] text-[#9299a0]">
              Updated {timeAgo(task.updatedAt)}{task.assignee ? ` by ${task.assignee.name}` : ''}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        {canEdit && (
          <div className="relative flex shrink-0 items-center gap-2" ref={menuRef}>
            <Link
              to={`/tasks/${task.id}/edit`}
              className="flex items-center gap-1.5 rounded-md border border-[#e1e4e7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#374151] hover:bg-[#f7f7f8] transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e1e4e7] bg-white text-[#687078] hover:bg-[#f7f7f8] transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 top-10 z-50 w-44 rounded-lg border border-[#e1e4e7] bg-white py-1 shadow-lg">
                <Link
                  to={`/tasks/${task.id}/edit`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-[12px] text-[#374151] hover:bg-[#f7f7f8]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit task
                </Link>
                <button
                  onClick={handleDuplicate}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[12px] text-[#374151] hover:bg-[#f7f7f8]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                <div className="my-1 border-t border-[#f0f1f2]" />
                {canDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[12px] text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete task
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main 2-col layout */}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Left: Description + Comments */}
        <div className="space-y-4 min-w-0">
          {/* Description */}
          {task.description && (
            <div className="rounded-lg border border-[#e2e5e8] bg-white p-5">
              <h3 className="mb-3 text-[12px] font-semibold text-[#111315]">Description</h3>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#374151]">
                {task.description}
              </p>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-lg border border-[#e2e5e8] bg-white p-5">
            <CommentsSection
              taskId={task.id}
              comments={task.comments}
              onCommentsChange={(comments: CommentType[]) =>
                setTask((t) => (t ? { ...t, comments } : t))
              }
            />
          </div>
        </div>

        {/* Right: Task info + Activity */}
        <div className="space-y-4">
          {/* Task information */}
          <div className="rounded-lg border border-[#e2e5e8] bg-white p-5">
            <h3 className="mb-4 text-[12px] font-semibold text-[#111315]">Task information</h3>
            <dl className="space-y-3.5 text-[12px]">
              <InfoRow label="Assignee">
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className={cn(getAvatarColor(task.assignee.name), 'text-[8px] font-semibold text-white')}>
                        {getInitials(task.assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-[#111315]">{task.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-[#9ca3af]">Unassigned</span>
                )}
              </InfoRow>

              <InfoRow label="Status">
                <StatusBadge status={task.status} />
              </InfoRow>

              <InfoRow label="Priority">
                <PriorityBadge priority={task.priority} />
              </InfoRow>

              {task.dueDate && (
                <InfoRow label="Due date">
                  <span className={cn('font-medium', new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-[#111315]')}>
                    {formatDate(task.dueDate)}
                  </span>
                </InfoRow>
              )}

              <div className="my-2 border-t border-[#f0f1f2]" />

              <InfoRow label="Created by">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className={cn(getAvatarColor(task.creator.name), 'text-[8px] font-semibold text-white')}>
                      {getInitials(task.creator.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-[#111315]">{task.creator.name}</span>
                </div>
              </InfoRow>

              <InfoRow label="Created">
                <span className="font-medium text-[#111315]">{formatDate(task.createdAt)}</span>
              </InfoRow>

              <InfoRow label="Updated">
                <span className="text-[#687078]">{timeAgo(task.updatedAt)}</span>
              </InfoRow>
            </dl>
          </div>

          {/* Activity */}
          <div className="rounded-lg border border-[#e2e5e8] bg-white p-5">
            <h3 className="mb-4 text-[12px] font-semibold text-[#111315]">Activity</h3>
            <div className="space-y-3 text-[11px] text-[#687078]">
              {task.comments.slice(0, 3).map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar className="mt-0.5 h-5 w-5 shrink-0">
                    <AvatarFallback className={cn(getAvatarColor(c.author.name), 'text-[7px] font-semibold text-white')}>
                      {getInitials(c.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <p>
                    <span className="font-semibold text-[#374151]">{c.author.name}</span>
                    {' commented · '}
                    <span>{timeAgo(c.createdAt)}</span>
                  </p>
                </div>
              ))}
              <div className="flex gap-2">
                <Avatar className="mt-0.5 h-5 w-5 shrink-0">
                  <AvatarFallback className={cn(getAvatarColor(task.creator.name), 'text-[7px] font-semibold text-white')}>
                    {getInitials(task.creator.name)}
                  </AvatarFallback>
                </Avatar>
                <p>
                  <span className="font-semibold text-[#374151]">{task.creator.name}</span>
                  {' created this task · '}
                  <span>{timeAgo(task.createdAt)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete task"
        description="Are you sure you want to delete this task? This action cannot be undone and will also remove all of its comments."
        confirmLabel="Delete task"
        onConfirm={handleDelete}
      />
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-[#9299a0]">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}
