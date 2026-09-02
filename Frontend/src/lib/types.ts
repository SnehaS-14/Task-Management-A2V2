export type TaskStatus = 'Todo' | 'In Progress' | 'Done'
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type UserRole = 'admin' | 'manager' | 'member'
export type JobRole =
  | 'Engineer'
  | 'Product Designer'
  | 'UI/UX Designer'
  | 'Product Manager'
  | 'QA Engineer'
  | 'Other'

export const TASK_STATUSES: TaskStatus[] = ['Todo', 'In Progress', 'Done']
export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent']
export const USER_ROLES: UserRole[] = ['admin', 'manager', 'member']
export const JOB_ROLES: JobRole[] = [
  'Engineer',
  'Product Designer',
  'UI/UX Designer',
  'Product Manager',
  'QA Engineer',
  'Other',
]

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  jobRole: JobRole
  avatarUrl?: string
}

export interface AuthUser extends User {
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: User | null
  creator: User
  dueDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  task: string
  content: string
  author: User
  createdAt: string
  updatedAt: string
}

export interface TaskWithComments extends Task {
  comments: Comment[]
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface TaskListResult {
  tasks: Task[]
  pagination: Pagination
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiErrorDetail {
  success: false
  error: {
    code: string
    message: string
    details?: unknown[]
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorDetail

export interface TaskQuery {
  page?: number
  limit?: number
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee?: string
  creator?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface TaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee?: string | null
  dueDate?: string | null
}

export interface CommentInput {
  content: string
}
