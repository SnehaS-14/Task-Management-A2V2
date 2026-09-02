import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError } from '../utils/errors';
import { UserRole } from '../models/User';

export const ROLE_PRIORITY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  member: 1,
};

export function requireRole(...roles: UserRole[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    const userRole = (req.user?.role as UserRole) ?? 'member';
    if (!roles.includes(userRole)) {
      return next(
        new ForbiddenError(
          `Access denied. Required role${roles.length > 1 ? 's' : ''}: ${roles.join(', ')}`
        )
      );
    }
    next();
  };
}

export function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if ((req.user?.role as UserRole) !== 'admin') {
    return next(
      new ForbiddenError('Access denied. Admin role required')
    );
  }
  next();
}

export function hasPermission(
  userRole: UserRole | undefined,
  requiredRole: UserRole
): boolean {
  const current = ROLE_PRIORITY[userRole ?? 'member'];
  const required = ROLE_PRIORITY[requiredRole];
  return current >= required;
}

export function canAssignTasks(userRole: UserRole | undefined): boolean {
  if (!userRole) return false;
  return userRole === 'admin' || userRole === 'manager';
}
