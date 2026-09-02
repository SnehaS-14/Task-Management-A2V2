// Authorization helpers. These define the rules for who can perform
// task and comment mutations.

import { UserRole } from '../models/User';

export type TaskOwnerInfo = {
  creator: string;
  assignee?: string | null;
};

export type TaskActor = {
  userId: string;
  role: UserRole;
};

export const ROLE_RANK: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  member: 1,
};

// Admins and managers may assign any user to a task.
export function canAssignTasks(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'manager';
}

// Members may only self-assign when the request does not come from an
// admin/manager allocation.
export function canAssigneeBeSet(
  actor: TaskActor,
  requestingAssignTo?: string | null
): boolean {
  // Admins and managers can always assign.
  if (canAssignTasks(actor.role)) return true;
  // Members may only set the assignee to themselves.
  if (requestingAssignTo == null) return true; // unassigning is allowed
  return requestingAssignTo === actor.userId;
}

export function canUpdateTask(
  userId: string,
  task: TaskOwnerInfo,
  requestedFields: { status?: boolean }
): boolean {
  // The task creator may always update any field.
  if (task.creator === userId) return true;
  // The assignee may update the status only (not other fields).
  const onlyStatus = requestedFields.status && Object.keys(requestedFields).length === 1;
  return Boolean(onlyStatus);
}
