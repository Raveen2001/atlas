import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import * as api from "@/lib/tracker-api"
import type {
  TrackerCategory,
  TrackerMeasurement,
  TrackerCategoryFormData,
  TrackerMeasurementFormData,
  TrackerCategorySummary,
} from "@/types/tracker"

export function useTracker() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<TrackerCategory[]>([])
  const [measurements, setMeasurements] = useState<TrackerMeasurement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    try {
      const [cats, ms] = await Promise.all([
        api.fetchTrackerCategories(user.id),
        api.fetchTrackerMeasurements(user.id),
      ])
      setCategories(cats)
      setMeasurements(ms)
    } catch (e) {
      toast.error("Failed to load tracker data")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const createCategory = useCallback(
    async (formData: TrackerCategoryFormData) => {
      if (!user) return
      try {
        await api.createTrackerCategory(user.id, formData)
        await fetchAll()
        toast.success("Category created")
      } catch (e) {
        toast.error("Failed to create category")
        console.error(e)
      }
    },
    [user, fetchAll],
  )

  const updateCategory = useCallback(
    async (categoryId: string, formData: TrackerCategoryFormData) => {
      try {
        await api.updateTrackerCategory(categoryId, formData)
        await fetchAll()
        toast.success("Category updated")
      } catch (e) {
        toast.error("Failed to update category")
        console.error(e)
      }
    },
    [fetchAll],
  )

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      try {
        await api.deleteTrackerCategory(categoryId)
        await fetchAll()
        toast.success("Category deleted")
      } catch (e) {
        toast.error("Failed to delete category")
        console.error(e)
      }
    },
    [fetchAll],
  )

  const createMeasurement = useCallback(
    async (categoryId: string, formData: TrackerMeasurementFormData) => {
      if (!user) return
      try {
        await api.createTrackerMeasurement(user.id, categoryId, formData)
        await fetchAll()
        toast.success("Measurement logged")
      } catch (e) {
        toast.error("Failed to log measurement")
        console.error(e)
      }
    },
    [user, fetchAll],
  )

  const updateMeasurement = useCallback(
    async (measurementId: string, formData: TrackerMeasurementFormData) => {
      try {
        await api.updateTrackerMeasurement(measurementId, formData)
        await fetchAll()
        toast.success("Measurement updated")
      } catch (e) {
        toast.error("Failed to update measurement")
        console.error(e)
      }
    },
    [fetchAll],
  )

  const deleteMeasurement = useCallback(
    async (measurementId: string) => {
      try {
        await api.deleteTrackerMeasurement(measurementId)
        setMeasurements((prev) => prev.filter((m) => m.id !== measurementId))
        toast.success("Measurement deleted")
      } catch (e) {
        toast.error("Failed to delete measurement")
        console.error(e)
      }
    },
    [],
  )

  const summaries = useMemo<TrackerCategorySummary[]>(() => {
    return categories.map((cat) => {
      const catMeasurements = measurements
        .filter((m) => m.category_id === cat.id)
        .sort((a, b) => b.measured_date.localeCompare(a.measured_date))

      const latest = catMeasurements[0] ?? null
      const previous = catMeasurements[1] ?? null

      return {
        category: cat,
        latestValue: latest?.value ?? null,
        latestDate: latest?.measured_date ?? null,
        measurementCount: catMeasurements.length,
        trend:
          latest && previous ? latest.value - previous.value : null,
      }
    })
  }, [categories, measurements])

  const measurementsByCategory = useCallback(
    (categoryId: string) =>
      measurements
        .filter((m) => m.category_id === categoryId)
        .sort((a, b) => a.measured_date.localeCompare(b.measured_date)),
    [measurements],
  )

  return {
    categories,
    measurements,
    summaries,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    createMeasurement,
    updateMeasurement,
    deleteMeasurement,
    measurementsByCategory,
    refetch: fetchAll,
  }
}
