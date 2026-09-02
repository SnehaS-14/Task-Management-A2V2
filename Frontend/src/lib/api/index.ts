import apiClient from '@/lib/client'
import {
  getErrorMessage,
  getToken,
  setToken,
} from '@/lib/client'
export { getErrorMessage, getToken, setToken }
import type {
  AuthUser,
  Comment,
  CommentInput,
  LoginInput,
  RegisterInput,
  Task,
  TaskInput,
  TaskListResult,
  TaskQuery,
  TaskWithComments,
  User,
  UserRole,
  JobRole,
} from '@/lib/types'

export async function register(data: RegisterInput): Promise<{
  token: string
  user: AuthUser
}> {
  const res = await apiClient.post('/auth/register', data)
  return res.data.data
}

export async function login(data: LoginInput): Promise<{
  token: string
  user: AuthUser
}> {
  const res = await apiClient.post('/auth/login', data)
  return res.data.data
}

export async function getMe(): Promise<AuthUser> {
  const res = await apiClient.get('/auth/me')
  return res.data.data.user
}

export async function getUsers(search?: string): Promise<User[]> {
  const res = await apiClient.get('/users', {
    params: search ? { search } : undefined,
  })
  return res.data.data.users
}

export async function getAdmins(): Promise<User[]> {
  const res = await apiClient.get('/users/admins')
  return res.data.data.admins
}

export async function assignUserRole(
  userId: string,
  role: UserRole
): Promise<User> {
  const res = await apiClient.patch(`/users/${userId}/role`, { role })
  return res.data.data.user
}

export async function updateMyProfile(data: {
  name?: string
  jobRole?: JobRole
}): Promise<User> {
  const res = await apiClient.patch('/users/me/profile', data)
  return res.data.data.user
}

export async function uploadMyAvatar(dataUrl: string): Promise<User> {
  const res = await apiClient.post('/users/me/avatar', { dataUrl })
  return res.data.data.user
}

export async function removeMyAvatar(): Promise<User> {
  const res = await apiClient.delete('/users/me/avatar')
  return res.data.data.user
}

export async function createTask(data: TaskInput): Promise<Task> {
  const res = await apiClient.post('/tasks', data)
  return res.data.data.task
}

export async function listTasks(query: TaskQuery): Promise<TaskListResult> {
  const res = await apiClient.get('/tasks', { params: query })
  return res.data.data
}

export async function getTask(id: string): Promise<TaskWithComments> {
  const res = await apiClient.get(`/tasks/${id}`)
  return res.data.data.task
}

export async function updateTask(
  id: string,
  data: Partial<TaskInput>
): Promise<Task> {
  const res = await apiClient.patch(`/tasks/${id}`, data)
  return res.data.data.task
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`)
}

export async function addComment(
  taskId: string,
  data: CommentInput
): Promise<Comment> {
  const res = await apiClient.post(`/tasks/${taskId}/comments`, data)
  return res.data.data.comment
}

export async function getComments(taskId: string): Promise<Comment[]> {
  const res = await apiClient.get(`/tasks/${taskId}/comments`)
  return res.data.data.comments
}

export async function updateComment(
  commentId: string,
  data: CommentInput
): Promise<Comment> {
  const res = await apiClient.patch(`/comments/${commentId}`, data)
  return res.data.data.comment
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`)
}
