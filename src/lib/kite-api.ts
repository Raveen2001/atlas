import { supabase } from "./supabase"

export type KiteCredentials = {
  user_id: string
  kite_user_id: string
  kite_username: string | null
  kite_broker: string | null
  access_token: string
  public_token: string | null
  login_time: string | null
  created_at: string
  updated_at: string
}

const KITE_API_KEY = import.meta.env.VITE_KITE_API_KEY as string | undefined

export function getKiteApiKey(): string {
  if (!KITE_API_KEY) throw new Error("VITE_KITE_API_KEY not configured")
  return KITE_API_KEY
}

export function buildKiteLoginUrl(): string {
  const apiKey = getKiteApiKey()
  return `https://kite.zerodha.com/connect/login?api_key=${encodeURIComponent(apiKey)}&v=3`
}

export async function fetchKiteCredentials(userId: string): Promise<KiteCredentials | null> {
  const { data, error } = await supabase
    .from("kite_credentials")
    .select("*")
    .eq("user_id", userId)
    .limit(1)

  if (error) throw error
  return (data?.[0] as KiteCredentials) ?? null
}

export async function exchangeKiteRequestToken(
  requestToken: string,
): Promise<{ connected: true; kite_user_id: string; kite_username: string | null }> {
  const { data, error } = await supabase.functions.invoke("kite-exchange-token", {
    body: { request_token: requestToken },
  })
  if (error) throw error
  if (!data?.connected) throw new Error(data?.error ?? "Failed to exchange token")
  return data
}

export async function disconnectKite(userId: string): Promise<void> {
  const { error } = await supabase.from("kite_credentials").delete().eq("user_id", userId)
  if (error) throw error
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export function getKiteTokenExpiry(loginTimeISO: string | null | undefined): Date | null {
  if (!loginTimeISO) return null
  const login = new Date(loginTimeISO)
  if (Number.isNaN(login.getTime())) return null
  const istClock = new Date(login.getTime() + IST_OFFSET_MS)
  const istHour = istClock.getUTCHours()
  const cutoffIstMs = Date.UTC(
    istClock.getUTCFullYear(),
    istClock.getUTCMonth(),
    istClock.getUTCDate() + (istHour >= 6 ? 1 : 0),
    6, 0, 0, 0,
  )
  return new Date(cutoffIstMs - IST_OFFSET_MS)
}

export function isKiteTokenExpired(loginTimeISO: string | null | undefined): boolean {
  const expiry = getKiteTokenExpiry(loginTimeISO)
  if (!expiry) return true
  return Date.now() >= expiry.getTime()
}
