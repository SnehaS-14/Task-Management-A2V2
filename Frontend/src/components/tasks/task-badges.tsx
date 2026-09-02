import { cn } from '@/lib/utils'
import { statusVariant, priorityVariant, statusDotClass, priorityDotClass } from '@/lib/format'
import type { TaskPriority, TaskStatus } from '@/lib/types'

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
        statusVariant[status],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', statusDotClass[status])} />
      {status}
    </span>
  )
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
        priorityVariant[priority],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', priorityDotClass[priority])} />
      {priority}
    </span>
  )
}
