import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { AuthLayout } from "@/layouts/auth-layout"
import { PublicLayout } from "@/layouts/public-layout"
import { LoginPage } from "@/pages/login"
import { AuthCallbackPage } from "@/pages/auth-callback"
import { DashboardPage } from "@/pages/dashboard"
import { TasksPage } from "@/pages/tasks"
import { RemindersPage } from "@/pages/reminders"
import { InvestmentsPage } from "@/pages/investments"
import { TasksClosedPage } from "@/pages/tasks-closed"
import { HabitsPage } from "@/pages/habits"
import { IdeasPage } from "@/pages/ideas"
import { AchievementsPage } from "@/pages/achievements"
import { TrackerPage } from "@/pages/tracker"
import { TrackerDetailPage } from "@/pages/tracker-detail"

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Route>

      <Route
        element={user ? <AuthLayout /> : <Navigate to="/login" replace />}
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/closed" element={<TasksClosedPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/ideas" element={<IdeasPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/tracker/:categoryId" element={<TrackerDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}
