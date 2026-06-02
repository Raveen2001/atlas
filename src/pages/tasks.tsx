import { Link } from "react-router"
import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "@/components/tasks/kanban-board"

export function TasksPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <div className="flex items-center gap-2">
          <Link to="/tasks/closed">
            <Button variant="ghost" size="sm">
              <Archive className="h-4 w-4 mr-1" />
              Closed
            </Button>
          </Link>
        </div>
      </div>

      <KanbanBoard />
    </div>
  )
}
