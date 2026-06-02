import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare } from "lucide-react"

export function TasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <CheckSquare className="h-5 w-5" />
            No tasks yet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your tasks will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
