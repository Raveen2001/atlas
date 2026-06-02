import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PushPrompt } from "@/components/push-prompt"
import { useAuth } from "@/hooks/use-auth"
import { useHabits } from "@/hooks/use-habits"

export function DashboardPage() {
  const { user } = useAuth()
  const { todayDue, todayCompleted } = useHabits()
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "there"

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Hey, {firstName}
      </h1>

      <PushPrompt />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">0</p>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-mono">0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
