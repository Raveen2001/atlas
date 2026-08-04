export type AssetCategory =
  | "land"
  | "gold"
  | "silver"
  | "jewellery"
  | "electronics"
  | "appliance"
  | "furniture"
  | "vehicle"
  | "fitness"
  | "kitchen"
  | "other"

export type AssetStatus = "active" | "sold" | "disposed"

export interface Asset {
  id: string
  user_id: string
  name: string
  category: AssetCategory
  purchase_date: string // "YYYY-MM-DD"
  purchase_price: number
  current_value: number | null
  warranty_expiry: string | null // "YYYY-MM-DD"
  serial_number: string | null
  retailer: string | null
  status: AssetStatus
  sold_price: number | null
  sold_date: string | null // "YYYY-MM-DD"
  note: string | null
  created_at: string
  updated_at: string
}

export interface AssetFormData {
  name: string
  category: AssetCategory
  purchase_date: string
  purchase_price: number
  current_value: number | null
  warranty_expiry: string | null
  serial_number: string
  retailer: string
  status: AssetStatus
  sold_price: number | null
  sold_date: string | null
  note: string
}

// Offline investments — the primary thing this feature tracks
export const INVESTMENT_CATEGORIES: ReadonlySet<AssetCategory> = new Set([
  "land",
  "gold",
  "silver",
  "jewellery",
])

export const CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: "land", label: "Land / Property" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "jewellery", label: "Jewellery" },
  { value: "electronics", label: "Electronics" },
  { value: "appliance", label: "Appliance" },
  { value: "furniture", label: "Furniture" },
  { value: "vehicle", label: "Vehicle" },
  { value: "fitness", label: "Fitness" },
  { value: "kitchen", label: "Kitchen" },
  { value: "other", label: "Other" },
]

export const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "sold", label: "Sold" },
  { value: "disposed", label: "Disposed" },
]
