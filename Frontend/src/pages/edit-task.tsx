import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage, getTask, getUsers, updateTask, deleteTask } from '@/lib/api'
import type { TaskWithComments, TaskInput, TaskPriority, TaskStatus, User } from '@/lib/types'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { formatDate } from '@/lib/date'
import { getInitials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { canAssignTasks } from '@/lib/roles'

function getTaskId(id: string) {
  return `TF-${id.slice(-4).toUpperCase()}`
}

function formatDateForInput(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10)
}

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [original, setOriginal] = useState<TaskWithComments | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('Todo')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [assigneeId, setAssigneeId] = useState<string>('unassigned')
  const [dueDate, setDueDate] = useState('')

  // Load task + users
  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getTask(id), getUsers()])
      .then(([task, us]) => {
        setOriginal(task)
        setUsers(us)
        setTitle(task.title)
        setDescription(task.description ?? '')
        setStatus(task.status)
        setPriority(task.priority)
        setAssigneeId(task.assignee?.id ?? 'unassigned')
        setDueDate(formatDateForInput(task.dueDate))
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  // Validation
  const dueDateError = dueDate && new Date(dueDate) < new Date(new Date().toDateString())
    ? "Due date can't be in the past."
    : null

  const titleError = !title.trim() ? 'Title is required' : null
  const hasErrors = Boolean(dueDateError || titleError)

  // Compute unsaved changes
  const unsavedChanges: { label: string; from: string; to: string }[] = []
  if (original) {
    if (title !== original.title) unsavedChanges.push({ label: 'Title', from: original.title, to: title })
    if (description !== (original.description ?? '')) unsavedChanges.push({ label: 'Description', from: 'changed', to: '' })
    if (status !== original.status) unsavedChanges.push({ label: 'Status', from: original.status, to: status })
    if (priority !== original.priority) unsavedChanges.push({ label: 'Priority', from: original.priority, to: priority })
    const origAssignee = original.assignee?.id ?? 'unassigned'
    if (assigneeId !== origAssignee) {
      const from = original.assignee?.name ?? 'Unassigned'
      const to = assigneeId === 'unassigned' ? 'Unassigned' : users.find((u) => u.id === assigneeId)?.name ?? assigneeId
      unsavedChanges.push({ label: 'Assignee', from, to })
    }
    const origDue = formatDateForInput(original.dueDate)
    if (dueDate !== origDue) {
      unsavedChanges.push({
        label: 'Due date',
        from: origDue ? formatDate(origDue) : 'None',
        to: dueDate ? formatDate(dueDate) : 'None',
      })
    }
  }

  const handleSave = async () => {
    if (hasErrors || !id) return
    setSaving(true)
    try {
      const input: Partial<TaskInput> = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assignee: assigneeId === 'unassigned' ? null : assigneeId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      }
      await updateTask(id, input)
      toast.success('Task updated')
      navigate(`/tasks/${id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deleteTask(id)
      toast.success('Task deleted')
      navigate('/tasks')
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !original) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        <AlertCircle className="h-4 w-4" /> {error ?? 'Task not found'}
      </div>
    )
  }

  const inputClass = 'w-full rounded-md border border-[#e1e4e7] bg-white px-3 py-2 text-[13px] text-[#111315] outline-none focus:border-[#111315] transition-colors'
  const selectClass = 'w-full rounded-md border border-[#e1e4e7] bg-white px-3 py-2 text-[13px] text-[#111315] outline-none focus:border-[#111315]'
  const labelClass = 'mb-1.5 block text-[11px] font-semibold text-[#374151]'

  return (
    <div className="space-y-5">
      {/* Task ID */}
      <p className="text-[11px] font-semibold text-[#9299a0]">{getTaskId(original.id)}</p>

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[22px] font-bold tracking-tight">Edit task</h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={`/tasks/${original.id}`}
            className="rounded-md border border-[#e1e4e7] bg-white px-4 py-1.5 text-[12px] font-medium text-[#374151] hover:bg-[#f7f7f8] transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || hasErrors}
            className="rounded-md bg-[#111315] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#2b2e31] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Left: Form */}
        <div className="rounded-lg border border-[#e2e5e8] bg-white p-6 space-y-5">
          {/* Title */}
          <div>
            <label className={labelClass}>Task Title <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(inputClass, titleError ? 'border-red-400 focus:border-red-500' : '')}
              placeholder="Task title..."
              maxLength={200}
            />
            {titleError && (
              <p className="mt-1 text-[11px] text-red-500">{titleError}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              maxLength={2000}
              className={cn(inputClass, 'resize-none leading-relaxed')}
              placeholder="Add a description..."
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] text-[#9ca3af]">Markdown supported</span>
              <span className="text-[10px] text-[#9ca3af]">{description.length} / 2000</span>
            </div>
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className={selectClass}>
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={selectClass}>
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Assignee + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Assignee</label>
              {canAssignTasks(user?.role) ? (
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={selectClass}>
                  <option value="unassigned">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getInitials(u.name)} {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={assigneeId}
                  disabled
                  className="w-full cursor-not-allowed rounded-md border border-[#e7e9eb] bg-[#f7f8f9] px-3 py-2 text-[13px] text-[#9ca3af] outline-none"
                >
                  <option value={assigneeId}>
                    {assigneeId === 'unassigned'
                      ? 'Unassigned'
                      : users.find((u) => u.id === assigneeId)?.name ?? 'Unassigned'}
                  </option>
                </select>
              )}
              {!canAssignTasks(user?.role) && (
                <p className="mt-1 text-[10px] text-[#9ca3af]">
                  Only admins and managers can reassign tasks.
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={cn(inputClass, dueDateError ? 'border-red-400 focus:border-red-500' : '')}
              />
              {dueDateError && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
                  <AlertCircle className="h-3 w-3" /> {dueDateError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Unsaved changes + Danger zone */}
        <div className="space-y-4">
          {/* Unsaved changes */}
          <div className="rounded-lg border border-[#e2e5e8] bg-white p-4">
            <h3 className="mb-3 text-[12px] font-semibold text-[#111315]">Unsaved changes</h3>
            {unsavedChanges.length === 0 ? (
              <p className="text-[11px] text-[#9ca3af]">No changes yet.</p>
            ) : (
              <div className="space-y-2">
                {unsavedChanges.map((c) => (
                  <div key={c.label} className="text-[11px]">
                    <span className="font-medium text-[#374151]">{c.label}</span>
                    {c.from && c.to && (
                      <span className="text-[#9299a0]"> · {c.from} → {c.to}</span>
                    )}
                    {!c.to && <span className="text-[#9299a0]"> · modified</span>}
                  </div>
                ))}
              </div>
            )}
            {hasErrors && (
              <p className="mt-3 text-[11px] text-[#9299a0]">Save is disabled until validation errors are resolved.</p>
            )}
            <button
              onClick={handleSave}
              disabled={saving || hasErrors || unsavedChanges.length === 0}
              className="mt-4 w-full rounded-md bg-[#111315] py-2 text-[12px] font-semibold text-white hover:bg-[#2b2e31] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Danger zone */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-1.5 text-[12px] font-semibold text-red-700">Danger zone</h3>
            <p className="mb-3 text-[11px] text-red-600">
              Deleting a task removes its comments and activity. This can't be undone.
            </p>
            <button
              onClick={() => setDeleteOpen(true)}
              disabled={deleting}
              className="w-full rounded-md border border-red-300 bg-white py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Delete task
            </button>
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
