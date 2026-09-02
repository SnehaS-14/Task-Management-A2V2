import { useState } from 'react'
import {
  MessageSquare,
  MoreVertical,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/loading'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAvatarColor, getInitials } from '@/lib/format'
import { timeAgo } from '@/lib/date'
import { useAuth } from '@/context/auth-context'
import { getErrorMessage, addComment, updateComment, deleteComment } from '@/lib/api'
import type { Comment as CommentType } from '@/lib/types'

interface CommentsSectionProps {
  taskId: string
  comments: CommentType[]
  onCommentsChange: (comments: CommentType[]) => void
}

export function CommentsSection({
  taskId,
  comments,
  onCommentsChange,
}: CommentsSectionProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const comment = await addComment(taskId, { content: content.trim() })
      onCommentsChange([comment, ...comments])
      setContent('')
      toast.success('Comment added')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (c: CommentType) => {
    setEditingId(c.id)
    setEditingContent(c.content)
  }

  const saveEdit = async (c: CommentType) => {
    setBusy(c.id)
    try {
      const updated = await updateComment(c.id, { content: editingContent.trim() })
      onCommentsChange(
        comments.map((item) => (item.id === c.id ? updated : item))
      )
      setEditingId(null)
      toast.success('Comment updated')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const handleDelete = async (c: CommentType) => {
    setBusy(c.id)
    try {
      await deleteComment(c.id)
      onCommentsChange(comments.filter((item) => item.id !== c.id))
      toast.success('Comment deleted')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments.length})
      </h3>

      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={getAvatarColor(user?.name ?? '') + ' text-xs'}>
            {getInitials(user?.name ?? '')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            maxLength={1000}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={submitting || !content.trim()}
            >
              {submitting ? <Spinner /> : <Send className="h-4 w-4" />}
              Comment
            </Button>
          </div>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No comments yet. Start the discussion.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => {
            const isAuthor = c.author.id === user?.id
            const isEditing = editingId === c.id
            return (
              <li key={c.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className={getAvatarColor(c.author.name) + ' text-xs'}
                  >
                    {getInitials(c.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {c.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(c.createdAt)}
                    </span>
                    {isAuthor && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-6 w-6"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(c)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onClick={() => handleDelete(c)}
                            disabled={busy === c.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="mt-1 space-y-2">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={2}
                        maxLength={1000}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(c)}
                          disabled={busy === c.id || !editingContent.trim()}
                        >
                          {busy === c.id && <Spinner />}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {c.content}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
