import { differenceInCalendarDays, format } from "date-fns"
import { INVESTMENT_CATEGORIES } from "@/types/assets"
import type { Asset } from "@/types/assets"

const inrFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
})

export function formatAmount(amount: number): string {
  return "₹" + inrFormat.format(amount)
}

export function formatGain(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : ""
  return sign + "₹" + inrFormat.format(Math.abs(amount))
}

export function getGainColor(amount: number): string {
  if (amount > 0) return "text-green-600"
  if (amount < 0) return "text-red-600"
  return "text-muted-foreground"
}

export function isInvestmentAsset(asset: Asset): boolean {
  return INVESTMENT_CATEGORIES.has(asset.category)
}

export interface AssetGain {
  amount: number
  pct: number
}

// Unrealised gain for active assets (needs a current value),
// realised gain for sold ones (needs a sold price)
export function getAssetGain(asset: Asset): AssetGain | null {
  const value =
    asset.status === "sold" ? asset.sold_price : asset.current_value
  if (value === null || asset.status === "disposed") return null
  const amount = value - asset.purchase_price
  const pct =
    asset.purchase_price > 0 ? (amount / asset.purchase_price) * 100 : 0
  return { amount, pct }
}

export type WarrantyState = "active" | "expiring" | "expired"

export interface WarrantyInfo {
  state: WarrantyState
  label: string
}

// Expiring = within 30 days of warranty end
export function getWarrantyInfo(asset: Asset): WarrantyInfo | null {
  if (!asset.warranty_expiry || asset.status !== "active") return null
  const expiry = new Date(asset.warranty_expiry + "T00:00:00")
  const daysLeft = differenceInCalendarDays(expiry, new Date())

  if (daysLeft < 0) {
    return { state: "expired", label: "Warranty expired" }
  }
  if (daysLeft <= 30) {
    return {
      state: "expiring",
      label: daysLeft === 0 ? "Warranty ends today" : `Warranty ends in ${daysLeft}d`,
    }
  }
  return {
    state: "active",
    label: `Warranty till ${format(expiry, "MMM yyyy")}`,
  }
}

export interface AssetStats {
  invested: number // purchase total of active investment assets
  investedValue: number // current value of active investment assets
  investedGain: number
  investedGainPct: number
  otherSpent: number // purchase total of active non-investment assets
  underWarranty: number
}

export function computeAssetStats(assets: Asset[]): AssetStats {
  const active = assets.filter((a) => a.status === "active")
  const investments = active.filter(isInvestmentAsset)
  const others = active.filter((a) => !isInvestmentAsset(a))

  const invested = investments.reduce((sum, a) => sum + a.purchase_price, 0)
  const investedValue = investments.reduce(
    (sum, a) => sum + (a.current_value ?? a.purchase_price),
    0,
  )
  const investedGain = investedValue - invested

  return {
    invested,
    investedValue,
    investedGain,
    investedGainPct: invested > 0 ? (investedGain / invested) * 100 : 0,
    otherSpent: others.reduce((sum, a) => sum + a.purchase_price, 0),
    underWarranty: active.filter((a) => {
      const info = getWarrantyInfo(a)
      return info !== null && info.state !== "expired"
    }).length,
  }
}
