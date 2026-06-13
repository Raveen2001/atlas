import { useState } from "react"
import { useNavigate } from "react-router"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryCard } from "@/components/tracker/category-card"
import { CategoryDialog } from "@/components/tracker/category-dialog"
import { useTracker } from "@/hooks/use-tracker"

export function TrackerPage() {
  const navigate = useNavigate()
  const { summaries, loading, createCategory } = useTracker()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Tracker</h1>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New category
          </Button>
        </div>

        {summaries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-4">
              No categories yet. Track anything measurable — weight, lifts,
              expenses, sleep — and watch it move over time.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create your first category
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {summaries.map((s) => (
              <CategoryCard
                key={s.category.id}
                summary={s}
                onClick={() => navigate(`/tracker/${s.category.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingCategory={null}
        onSave={createCategory}
      />
    </>
  )
}
