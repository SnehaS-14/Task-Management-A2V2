import { Response } from 'express';
import Task from '../models/Task';
import { AuthenticatedRequest } from '../types';
import * as taskService from '../services/task.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ForbiddenError } from '../utils/errors';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
} from '../validators/task';
import { canUpdateTask, canAssigneeBeSet } from '../services/authorization.service';
import { UserRole } from '../models/User';

export const createTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const input = req.body as CreateTaskInput;

    // Role-based check: only admins/managers may assign other users.
    if (
      !canAssigneeBeSet(
        { userId: req.user!.id, role: (req.user!.role as UserRole) || 'member' },
        input.assignee
      )
    ) {
      throw new ForbiddenError(
        'Only admins or managers can assign a task to other users'
      );
    }

    const task = await taskService.createTask(req.user!.id, input);
    sendSuccess(res, { task }, 201);
  }
);

export const listTasks = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as unknown as ListTasksQuery;
    const result = await taskService.listTasks(req.user!.id, query);
    sendSuccess(res, result);
  }
);

export const getTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const task = await taskService.getTask(id);
    sendSuccess(res, { task });
  }
);

export const updateTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const input = req.body as UpdateTaskInput;

    const existing = await Task.findById(id).lean();
    if (!existing) {
      const { NotFoundError } = await import('../utils/errors');
      throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
    }

    const onlyStatus = 'status' in input && Object.keys(input).length === 1;

    const role = (req.user!.role as UserRole) || 'member';
    const isCreator = existing.creator.toString() === req.user!.id;
    const isAdminRole = role === 'admin';

    // Admins may update any task. Otherwise use ownership rules.
    const allowed = isAdminRole || canUpdateTask(
      req.user!.id,
      {
        creator: existing.creator.toString(),
        assignee: existing.assignee?.toString(),
      },
      { status: onlyStatus }
    );

    if (!allowed) {
      throw new ForbiddenError(
        'Only the task creator can edit this task; the assignee may update status'
      );
    }

    // Even the creator cannot reassign a task unless they hold a
    // manager/admin role (members may only self-assign / unassign).
    if ('assignee' in input) {
      const allowedAssignee = canAssigneeBeSet(
        { userId: req.user!.id, role },
        input.assignee
      );
      // Creator may unassign their own task regardless of role.
      const canUnassign = isCreator && input.assignee == null;
      if (!isAdminRole && !allowedAssignee && !canUnassign) {
        throw new ForbiddenError(
          'Only admins or managers can reassign tasks to other users'
        );
      }
    }

    const task = await taskService.updateTask(id, input);
    sendSuccess(res, { task });
  }
);

export const deleteTask = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const existing = await Task.findById(id).lean();
    if (!existing) {
      const { NotFoundError } = await import('../utils/errors');
      throw new NotFoundError('Task not found', 'TASK_NOT_FOUND');
    }

    const role = (req.user!.role as UserRole) || 'member';
    if (existing.creator.toString() !== req.user!.id && role !== 'admin') {
      throw new ForbiddenError('Only the task creator can delete this task');
    }

    await taskService.deleteTask(id);
    sendSuccess(res, { message: 'Task deleted successfully' });
  }
);
