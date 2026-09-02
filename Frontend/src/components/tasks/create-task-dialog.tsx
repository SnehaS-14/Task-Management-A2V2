import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { TaskFormDialog } from '@/components/tasks/task-form-dialog'
import { createTask, getUsers } from '@/lib/api'
import type { TaskInput, User } from '@/lib/types'
import { useAuth } from '@/context/auth-context'
import { canAssignTasks } from '@/lib/roles'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTaskDialogProps) {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoadingUsers(true)
    getUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false))
  }, [open])

  const handleSubmit = async (input: TaskInput) => {
    await createTask(input)
    toast.success('Task created')
    onOpenChange(false)
    onCreated?.()
  }

  return (
    <TaskFormDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title="Create new task"
      description="Add a task to your team's board"
      users={users}
      loadingUsers={loadingUsers}
      canAssignOthers={canAssignTasks(user?.role)}
      currentUserId={user?.id ?? ''}
    />
  )
}
