import { useState, useMemo } from "react"
import { useParams, useNavigate, Navigate } from "react-router"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MeasurementLineChart } from "@/components/tracker/measurement-line-chart"
import { CategoryDialog } from "@/components/tracker/category-dialog"
import { MeasurementDialog } from "@/components/tracker/measurement-dialog"
import { useTracker } from "@/hooks/use-tracker"
import type { TrackerMeasurement } from "@/types/tracker"

function formatValue(v: number): string {
  if (Number.isInteger(v)) return v.toString()
  return parseFloat(v.toFixed(2)).toString()
}

export function TrackerDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const {
    categories,
    loading,
    measurementsByCategory,
    updateCategory,
    deleteCategory,
    createMeasurement,
    updateMeasurement,
    deleteMeasurement,
  } = useTracker()

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false)
  const [editingMeasurement, setEditingMeasurement] =
    useState<TrackerMeasurement | null>(null)

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  )

  const measurementsAsc = useMemo(
    () => (categoryId ? measurementsByCategory(categoryId) : []),
    [categoryId, measurementsByCategory],
  )

  const measurementsDesc = useMemo(
    () => [...measurementsAsc].reverse(),
    [measurementsAsc],
  )

  const stats = useMemo(() => {
    if (measurementsAsc.length === 0) return null
    const values = measurementsAsc.map((m) => m.value)
    const latest = measurementsAsc[measurementsAsc.length - 1].value
    const first = measurementsAsc[0].value
    return {
      latest,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      change: latest - first,
    }
  }, [measurementsAsc])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!category) {
    return <Navigate to="/tracker" replace />
  }

  const openCreateMeasurement = () => {
    setEditingMeasurement(null)
    setMeasurementDialogOpen(true)
  }

  const openEditMeasurement = (m: TrackerMeasurement) => {
    setEditingMeasurement(m)
    setMeasurementDialogOpen(true)
  }

  const handleSaveMeasurement = async (
    data: import("@/types/tracker").TrackerMeasurementFormData,
  ) => {
    if (editingMeasurement) {
      await updateMeasurement(editingMeasurement.id, data)
    } else {
      await createMeasurement(category.id, data)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id)
    navigate("/tracker")
  }

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate("/tracker")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {category.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Measured in {category.unit}
              {category.note ? ` · ${category.note}` : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCategoryDialogOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={openCreateMeasurement}>
            <Plus className="h-4 w-4 mr-1" />
            Log
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="Latest" value={`${formatValue(stats.latest)} ${category.unit}`} />
            <Stat
              label="Change"
              value={`${stats.change > 0 ? "+" : ""}${formatValue(stats.change)}`}
              color={
                stats.change === 0
                  ? "text-foreground"
                  : stats.change > 0
                  ? "text-green-600 dark:text-green-500"
                  : "text-red-600 dark:text-red-500"
              }
            />
            <Stat label="Min" value={formatValue(stats.min)} />
            <Stat label="Max" value={formatValue(stats.max)} />
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Trend
          </h2>
          <MeasurementLineChart
            measurements={measurementsAsc}
            unit={category.unit}
          />
        </section>

        {measurementsDesc.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              History
            </h2>
            <div className="space-y-1">
              {measurementsDesc.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => openEditMeasurement(m)}
                  className="w-full flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm">
                      {format(parseISO(m.measured_date), "EEE, MMM d, yyyy")}
                    </p>
                    {m.note && (
                      <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                        {m.note}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-mono font-medium">
                    {formatValue(m.value)} {category.unit}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        existingCategory={category}
        onSave={(data) => updateCategory(category.id, data)}
        onDelete={handleDeleteCategory}
      />

      <MeasurementDialog
        open={measurementDialogOpen}
        onOpenChange={setMeasurementDialogOpen}
        categoryName={category.name}
        unit={category.unit}
        existingMeasurement={editingMeasurement}
        onSave={handleSaveMeasurement}
        onDelete={editingMeasurement ? deleteMeasurement : undefined}
      />
    </>
  )
}

function Stat({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-lg font-bold font-mono ${color ?? ""}`}>{value}</p>
    </div>
  )
}
