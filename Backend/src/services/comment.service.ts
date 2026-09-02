import Comment from '../models/Comment';
import Task from '../models/Task';
import { NotFoundError } from '../utils/errors';

export interface CommentDetail {
  id: string;
  task: string;
  content: string;
  author: { id: string; name: string; email: string };
  createdAt: Date;
  updatedAt: Date;
}

export async function addComment(
  taskId: string,
  authorId: string,
  content: string
): Promise<CommentDetail> {
  const taskExists = await Task.exists({ _id: taskId });
  if (!taskExists) {
    throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
  }

  const comment = await Comment.create({ task: taskId, author: authorId, content });
  return toDetail(comment);
}

export async function listComments(taskId: string): Promise<CommentDetail[]> {
  const taskExists = await Task.exists({ _id: taskId });
  if (!taskExists) {
    throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
  }

  const comments = await Comment.find({ task: taskId })
    .populate('author', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return comments.map((c) =>
    mapComment(c as unknown as Record<string, unknown>)
  );
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<CommentDetail> {
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true, runValidators: true }
  );
  if (!comment) {
    throw new NotFoundError('Comment not found', 'COMMENT_NOT_FOUND');
  }
  return toDetail(comment);
}

export async function deleteComment(commentId: string): Promise<void> {
  const result = await Comment.findByIdAndDelete(commentId);
  if (!result) {
    throw new NotFoundError('Comment not found', 'COMMENT_NOT_FOUND');
  }
}

export async function getCommentOrNull(
  commentId: string
): Promise<{ id: string; author: string } | null> {
  const comment = await Comment.findById(commentId).lean();
  if (!comment) return null;
  return { id: comment._id.toString(), author: comment.author.toString() };
}

async function toDetail(
  comment: InstanceType<typeof Comment>
): Promise<CommentDetail> {
  const populated = await comment.populate('author', 'name email');
  return mapComment(populated as unknown as Record<string, unknown>);
}

function mapComment(comment: Record<string, unknown>): CommentDetail {
  const author = comment.author as unknown as {
    _id: string;
    name: string;
    email: string;
  };
  const task = comment.task as unknown;
  return {
    id: (comment._id as string).toString(),
    task: (task as { toString?: unknown }).toString
      ? ((task as { toString: () => string }).toString())
      : String(task),
    content: comment.content as string,
    author: {
      id: author._id.toString(),
      name: author.name,
      email: author.email,
    },
    createdAt: comment.createdAt as Date,
    updatedAt: comment.updatedAt as Date,
  };
}
