import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import * as api from "@/lib/kite-api"

export function useKite() {
  const { user } = useAuth()
  const [credentials, setCredentials] = useState<api.KiteCredentials | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.fetchKiteCredentials(user.id)
      setCredentials(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const expiry = useMemo(
    () => api.getKiteTokenExpiry(credentials?.login_time),
    [credentials?.login_time],
  )
  const expired = !credentials || !expiry || now >= expiry.getTime()
  const connected = !!credentials && !expired

  const connect = useCallback(() => {
    try {
      window.location.href = api.buildKiteLoginUrl()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kite is not configured")
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (!user) return
    try {
      await api.disconnectKite(user.id)
      setCredentials(null)
      toast.success("Kite disconnected")
    } catch (e) {
      toast.error("Failed to disconnect Kite")
      console.error(e)
    }
  }, [user])

  return {
    credentials,
    connected,
    expired: !!credentials && expired,
    expiry,
    loading,
    connect,
    disconnect,
    refresh,
  }
}
