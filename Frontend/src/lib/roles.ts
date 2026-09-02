import type { UserRole } from '@/lib/types'

const ROLE_PRIORITY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  member: 1,
}

export function canAssignTasks(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

export function hasPermission(
  role: UserRole | undefined,
  required: UserRole
): boolean {
  if (!role) return false
  return ROLE_PRIORITY[role] >= ROLE_PRIORITY[required]
}

export function isAdmin(role?: UserRole): boolean {
  return role === 'admin'
}

export function isManager(role?: UserRole): boolean {
  return role === 'manager'
}

export function getRoleLabel(role?: UserRole): string {
  if (!role) return 'Member'
  return role.charAt(0).toUpperCase() + role.slice(1)
}
