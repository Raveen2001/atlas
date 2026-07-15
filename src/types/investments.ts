export interface InvestmentLog {
  id: string
  user_id: string
  logged_date: string // "YYYY-MM-DD"
  pnl_amount: number // combined day P&L = stock_pnl + mf_pnl
  stock_pnl: number | null // equity mark-to-market day P&L
  mf_pnl: number | null // MF day P&L (back-filled next run)
  stock_pct: number | null
  mf_pct: number | null
  nifty50_pct: number | null
  realised_pnl: number | null // combined = realised_stock_pnl + realised_mf_pnl
  realised_stock_pnl: number | null
  realised_mf_pnl: number | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface RealisedTrade {
  order_id: string
  user_id: string
  kind: "stock" | "mf"
  symbol: string // tradingsymbol (stocks) / ISIN (MF)
  name: string | null // scheme name for MF
  quantity: number
  avg_buy_price: number
  sell_price: number
  realised_pnl: number
  trade_date: string // "YYYY-MM-DD"
  created_at: string
}

export interface InvestmentSettings {
  id: string
  user_id: string
  buy_reminder_enabled: boolean
  buy_reminder_time: string // "HH:MM:SS"
  log_reminder_enabled: boolean
  log_reminder_time: string
  followup_enabled: boolean
  end_of_day_time: string
  created_at: string
  updated_at: string
}

export interface InvestmentFormData {
  logged_date: string
  pnl_amount: number // derived = (stock_pnl ?? 0) + (mf_pnl ?? 0)
  stock_pnl: number | null
  mf_pnl: number | null
  stock_pct: number | null
  mf_pct: number | null
  nifty50_pct: number | null
  realised_pnl: number | null // derived = (realised_stock_pnl ?? 0) + (realised_mf_pnl ?? 0)
  realised_stock_pnl: number | null
  realised_mf_pnl: number | null
  note: string
}

export interface InvestmentSettingsFormData {
  buy_reminder_enabled: boolean
  buy_reminder_time: string // "HH:MM"
  log_reminder_enabled: boolean
  log_reminder_time: string
  followup_enabled: boolean
  end_of_day_time: string
}

export interface InvestmentStats {
  yesterday: number | null
  thisWeek: number
  thisMonth: number
  allTime: number
  totalDays: number
  profitDays: number
  lossDays: number
  bestDay: number
  worstDay: number
  comparableDays: number
  beatNiftyDays: number
  beatNiftyRate: number
  realisedMonth: number
  realisedAllTime: number
}

export const DEFAULT_SETTINGS: InvestmentSettingsFormData = {
  buy_reminder_enabled: true,
  buy_reminder_time: "15:25",
  log_reminder_enabled: true,
  log_reminder_time: "16:00",
  followup_enabled: true,
  end_of_day_time: "23:00",
}
