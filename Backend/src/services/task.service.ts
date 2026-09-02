import { FilterQuery, PopulateOptions } from 'mongoose';
import Task, { ITask } from '../models/Task';
import Comment from '../models/Comment';
import User from '../models/User';
import { NotFoundError } from '../utils/errors';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
} from '../validators/task';

export interface TaskListResult {
  tasks: TaskDetail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: { id: string; name: string; email: string; role: string } | null;
  creator: { id: string; name: string; email: string; role: string };
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskWithComments extends TaskDetail {
  comments: Array<{
    id: string;
    content: string;
    author: { id: string; name: string; email: string };
    createdAt: Date;
    updatedAt: Date;
  }>;
}

const taskPopulate: PopulateOptions[] = [
  { path: 'creator', select: 'name email role' },
  { path: 'assignee', select: 'name email role' },
];

export async function createTask(
  creatorId: string,
  input: CreateTaskInput
): Promise<TaskDetail> {
  if (input.assignee) {
    const assigneeExists = await User.exists({ _id: input.assignee });
    if (!assigneeExists) {
      throw new NotFoundError('Assignee user not found', 'ASSIGNEE_NOT_FOUND');
    }
  }

  const task = await Task.create({
    ...input,
    assignee: input.assignee ?? null,
    creator: creatorId,
    dueDate: input.dueDate ? new Date(input.dueDate as string) : null,
  });

  return (await toTaskDetail(task)) as TaskDetail;
}

export async function listTasks(
  userId: string,
  query: ListTasksQuery
): Promise<TaskListResult> {
  const filter: FilterQuery<ITask> = {};
  const { page, limit, search, status, priority, assignee, creator, sortBy, sortOrder } = query;

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee;
  if (creator) filter.creator = creator;

  if (search) {
    // Search while the user types: MongoDB text search is word-based, so it
    // does not reliably match partial input such as "auth" for
    // "Authentication". Escape the query and use a case-insensitive
    // substring match on both searchable task fields instead.
    const escapedSearch = escapeRegex(search);
    filter.$or = [
      { title: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const sort: Record<string, 1 | -1> = { [sortBy]: sortDirection };

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(taskPopulate)
      .lean(),
    Task.countDocuments(filter),
  ]);

  const mappedTasks = tasks.map((t) => mapTask(t));

  return {
    tasks: mappedTasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTask(
  taskId: string,
  includeComments = true
): Promise<TaskWithComments> {
  const task = await Task.findById(taskId)
    .populate(taskPopulate)
    .lean();
  if (!task) {
    throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
  }

  const detail = mapTask(task);

  let comments: TaskWithComments['comments'] = [];
  if (includeComments) {
    const commentDocs = await Comment.find({ task: taskId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    comments = commentDocs.map((c) => ({
      id: c._id.toString(),
      content: c.content,
      author: {
        id: (c.author as unknown as { _id: string })._id.toString(),
        name: (c.author as unknown as { name: string }).name,
        email: (c.author as unknown as { email: string }).email,
      },
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  return { ...detail, comments };
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<TaskDetail> {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
  }

  if (input.assignee) {
    const assigneeExists = await User.exists({ _id: input.assignee });
    if (!assigneeExists) {
      throw new NotFoundError('Assignee user not found', 'ASSIGNEE_NOT_FOUND');
    }
  }

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.status !== undefined) updates.status = input.status;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.assignee !== undefined) {
    updates.assignee = input.assignee || null;
  }
  if ('dueDate' in input) {
    updates.dueDate = input.dueDate ? new Date(input.dueDate as string) : null;
  }

  const updated = await Task.findByIdAndUpdate(taskId, updates, {
    new: true,
    runValidators: true,
  })
    .populate(taskPopulate)
    .lean();

  if (!updated) {
    throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
  }

  return mapTask(updated);
}

export async function deleteTask(taskId: string): Promise<void> {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
  }

  // Cascade delete: remove all comments referencing this task.
  await Comment.deleteMany({ task: taskId });
  await Task.findByIdAndDelete(taskId);
}

async function toTaskDetail(task: ITask): Promise<TaskDetail> {
  const populated = await task.populate(taskPopulate);
  return mapTask(populated as unknown as Record<string, unknown>);
}

function mapTask(task: Record<string, unknown>): TaskDetail {
  const creator = task.creator as unknown as {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  const assignee = task.assignee as
    | { _id: string; name: string; email: string; role?: string }
    | null
    | undefined;

  return {
    id: (task._id as string).toString(),
    title: task.title as string,
    description: (task.description as string) ?? undefined,
    status: task.status as string,
    priority: task.priority as string,
    assignee: assignee
      ? {
          id: assignee._id.toString(),
          name: assignee.name,
          email: assignee.email,
          role: assignee.role ?? 'member',
        }
      : null,
    creator: creator
      ? {
          id: creator._id.toString(),
          name: creator.name ?? 'Unknown',
          email: creator.email ?? '',
          role: creator.role ?? 'member',
        }
      : { id: '', name: 'Unknown', email: '', role: 'member' },
    dueDate: (task.dueDate as Date) ?? null,
    createdAt: task.createdAt as Date,
    updatedAt: task.updatedAt as Date,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
