export interface TrackerCategory {
  id: string
  user_id: string
  name: string
  unit: string
  note: string | null
  created_at: string
  updated_at: string
}

export interface TrackerMeasurement {
  id: string
  user_id: string
  category_id: string
  value: number
  measured_date: string // "YYYY-MM-DD"
  note: string | null
  created_at: string
  updated_at: string
}

export interface TrackerCategoryFormData {
  name: string
  unit: string
  note: string
}

export interface TrackerMeasurementFormData {
  value: number
  measured_date: string
  note: string
}

export interface TrackerCategorySummary {
  category: TrackerCategory
  latestValue: number | null
  latestDate: string | null
  measurementCount: number
  trend: number | null // diff between latest and previous
}
