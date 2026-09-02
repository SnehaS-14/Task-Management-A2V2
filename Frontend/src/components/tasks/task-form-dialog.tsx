import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/loading'
import { getErrorMessage } from '@/lib/api'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/types'
import type { Task, TaskInput, TaskPriority, TaskStatus, User } from '@/lib/types'

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: TaskInput) => Promise<void>
  title: string
  description?: string
  initial?: Task | null
  users: User[]
  loadingUsers?: boolean
  canAssignOthers: boolean
  currentUserId: string
}

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  initial,
  users,
  loadingUsers,
  canAssignOthers,
  currentUserId,
}: TaskFormDialogProps) {
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('Todo')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [assignee, setAssignee] = useState<string>('unassigned')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setFormTitle(initial?.title ?? '')
      setFormDescription(initial?.description ?? '')
      setStatus(initial?.status ?? 'Todo')
      setPriority(initial?.priority ?? 'Medium')
      setAssignee(initial?.assignee?.id ?? 'unassigned')
      setError(null)
    }
  }, [open, initial])

  const handleSubmit = async () => {
    setError(null)

    if (!formTitle.trim()) {
      setError('Title is required')
      return
    }

    const input: TaskInput = {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      status,
      priority,
      assignee: assignee === 'unassigned' ? null : assignee,
    }

    setSubmitting(true)
    try {
      await onSubmit(input)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="border-b px-5 py-4 pr-12 text-left">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-5 py-5">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="What needs to be done?"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Add more details…"
              maxLength={2000}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select
              value={assignee}
              onValueChange={setAssignee}
              disabled={loadingUsers || !canAssignOthers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingUsers ? 'Loading…' : canAssignOthers ? 'Select' : 'Only you'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {canAssignOthers
                  ? users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))
                  : (
                      <SelectItem key="me" value={currentUserId}>
                        Me ({currentUserId})
                      </SelectItem>
                    )}
              </SelectContent>
            </Select>
            {!canAssignOthers && (
              <p className="text-[10px] text-[#9ca3af]">
                Members can only assign tasks to themselves.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Spinner />}
            {initial ? 'Save changes' : 'Create task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
