import { z } from 'zod';
import { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task';

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assignee: z
    .string()
    .refine((v) => /^[0-9a-fA-F]{24}$/.test(v), {
      message: 'Assignee must be a valid ObjectId',
    })
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  // At least one field must be present
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listTasksQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(200).optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    assignee: z.string().optional(),
    creator: z.string().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'priority', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine((data) => !data.assignee || /^[0-9a-fA-F]{24}$/.test(data.assignee), {
    message: 'assignee must be a valid ObjectId',
  })
  .refine((data) => !data.creator || /^[0-9a-fA-F]{24}$/.test(data.creator), {
    message: 'creator must be a valid ObjectId',
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

export const idParamSchema = z.object({
  id: z.string().refine((v) => /^[0-9a-fA-F]{24}$/.test(v), 'Invalid ID format'),
});

export const taskIdParamSchema = z.object({
  taskId: z
    .string()
    .refine((v) => /^[0-9a-fA-F]{24}$/.test(v), 'Invalid task ID format'),
});

export const commentIdParamSchema = z.object({
  commentId: z
    .string()
    .refine((v) => /^[0-9a-fA-F]{24}$/.test(v), 'Invalid comment ID format'),
});
