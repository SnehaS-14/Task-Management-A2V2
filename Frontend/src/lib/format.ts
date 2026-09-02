import type { TaskPriority, TaskStatus } from '@/lib/types'

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-pink-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export const statusVariant: Record<TaskStatus, string> = {
  Todo: 'bg-gray-100 text-gray-700 border-transparent',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export const priorityVariant: Record<TaskPriority, string> = {
  Low: 'bg-gray-100 text-gray-600 border-transparent',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
}

export const statusDotClass: Record<TaskStatus, string> = {
  Todo: 'bg-gray-400',
  'In Progress': 'bg-blue-500',
  Done: 'bg-emerald-500',
}

export const priorityDotClass: Record<TaskPriority, string> = {
  Low: 'bg-gray-400',
  Medium: 'bg-amber-500',
  High: 'bg-orange-500',
  Urgent: 'bg-red-500',
}
