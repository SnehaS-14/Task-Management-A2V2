import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/protected-route'
import { GuestRoute } from '@/components/guest-route'
import { AdminRoute } from '@/components/admin-route'
import LoginPage from '@/pages/login'
import RegisterPage from '@/pages/register'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import TasksPage from '@/pages/tasks'
import TaskDetailPage from '@/pages/task-detail'
import EditTaskPage from '@/pages/edit-task'
import MyTasksPage from '@/pages/my-tasks'
import NotFoundPage from '@/pages/not-found'
import TeamPage from '@/pages/team'
import SettingsPage from '@/pages/settings'
import DashboardPage from '@/pages/dashboard'
import AdminPage from '@/pages/admin'

function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/tasks/:id/edit" element={<EditTaskPage />} />
          <Route path="/my-tasks" element={<MyTasksPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
