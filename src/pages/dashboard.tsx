import { useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PushPrompt } from "@/components/push-prompt"
import { useAuth } from "@/hooks/use-auth"
import { useTasks } from "@/hooks/use-tasks"
import { useHabits } from "@/hooks/use-habits"
import { useInvestments } from "@/hooks/use-investments"
import { useReminders } from "@/hooks/use-reminders"
import { useIdeas } from "@/hooks/use-ideas"
import { useAchievements } from "@/hooks/use-achievements"
import { useKite } from "@/hooks/use-kite"
import { formatPnl, getPnlColor } from "@/lib/investment-utils"

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { columns } = useTasks()
  const { todayDue, todayCompleted } = useHabits()
  const { todayLog, stats } = useInvestments()
  const { active } = useReminders()
  const { ideas } = useIdeas()
  const { achievements } = useAchievements()
  const {
    connected: kiteConnected,
    expired: kiteExpired,
    expiry: kiteExpiry,
    credentials: kiteCreds,
    loading: kiteLoading,
    connect: connectKite,
  } = useKite()
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "there"

  const openTasks =
    columns.todo.length + columns.in_progress.length + columns.blocked.length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Hey, {firstName}
      </h1>

      <PushPrompt />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            if (kiteLoading) return
            if (!kiteConnected) connectKite()
          }}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kite
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kiteConnected ? (
              <div>
                <p className="text-lg font-semibold">Connected</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {kiteCreds?.kite_username ?? kiteCreds?.kite_user_id}
                </p>
                {kiteExpiry && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires{" "}
                    {kiteExpiry.toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            ) : kiteExpired ? (
              <div>
                <p className="text-lg font-semibold text-destructive">Reconnect</p>
                <p className="text-xs text-muted-foreground mt-1">Token expired</p>
              </div>
            ) : (
              <p className="text-lg font-semibold text-primary">
                {kiteLoading ? "…" : "Connect with Kite"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/tasks")}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{openTasks}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/habits")}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Habits Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">
              {todayCompleted}
              <span className="text-lg text-muted-foreground">
                /{todayDue.length}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/reminders")}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{active.length}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/investments")}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {todayLog ? "Today's P&L" : "All Time P&L"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold font-mono ${getPnlColor(todayLog ? todayLog.pnl_amount : stats.allTime)}`}>
              {todayLog
                ? formatPnl(todayLog.pnl_amount)
                : stats.totalDays > 0
                  ? formatPnl(stats.allTime)
                  : "0"}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/ideas")}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{ideas.length}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/achievements")}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">{achievements.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
