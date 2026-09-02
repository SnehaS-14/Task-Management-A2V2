import { useNavigate } from 'react-router-dom'
import { Calendar, MessageSquare, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { PriorityBadge, StatusBadge } from '@/components/tasks/task-badges'
import { getAvatarColor, getInitials } from '@/lib/format'
import type { Task } from '@/lib/types'
import { formatDate } from '@/lib/date'

interface TaskCardProps {
  task: Task
  commentCount?: number
}

export function TaskCard({ task, commentCount = 0 }: TaskCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="cursor-pointer p-4 transition-all hover:border-primary/40 hover:shadow-md"
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-snug text-foreground">
          {task.title}
        </h3>
        <div className="flex shrink-0 gap-1.5">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {task.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(task.createdAt)}
          </span>
          {commentCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {commentCount}
            </span>
          )}
        </div>

        {task.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback
                className={getAvatarColor(task.assignee.name) + ' text-[10px]'}
              >
                {getInitials(task.assignee.name)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[100px] truncate">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Unassigned
          </span>
        )}
      </div>
    </Card>
  )
}
