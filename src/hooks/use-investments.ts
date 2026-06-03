import { useState, useEffect, useCallback, useMemo } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import * as api from "@/lib/investments-api"
import { computeInvestmentStats } from "@/lib/investment-utils"
import type {
  InvestmentLog,
  InvestmentSettings,
  InvestmentFormData,
  InvestmentSettingsFormData,
} from "@/types/investments"

export function useInvestments() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<InvestmentLog[]>([])
  const [settings, setSettings] = useState<InvestmentSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    try {
      const [logsData, settingsData] = await Promise.all([
        api.fetchInvestmentLogs(user.id),
        api.fetchInvestmentSettings(user.id),
      ])
      setLogs(logsData)
      setSettings(settingsData)
    } catch (e) {
      toast.error("Failed to load investments")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const logPnl = useCallback(
    async (formData: InvestmentFormData) => {
      if (!user) return
      try {
        await api.upsertInvestmentLog(user.id, formData)
        await fetchAll()
        toast.success("P&L logged")
      } catch (e) {
        toast.error("Failed to log P&L")
        console.error(e)
      }
    },
    [user, fetchAll],
  )

  const deleteLog = useCallback(
    async (logId: string) => {
      try {
        await api.deleteInvestmentLog(logId)
        setLogs((prev) => prev.filter((l) => l.id !== logId))
        toast.success("Entry deleted")
      } catch (e) {
        toast.error("Failed to delete entry")
        console.error(e)
      }
    },
    [],
  )

  const updateSettings = useCallback(
    async (formData: InvestmentSettingsFormData) => {
      if (!user) return
      try {
        await api.upsertInvestmentSettings(user.id, formData)
        const updated = await api.fetchInvestmentSettings(user.id)
        setSettings(updated)
        toast.success("Settings saved")
      } catch (e) {
        toast.error("Failed to save settings")
        console.error(e)
      }
    },
    [user],
  )

  const stats = useMemo(() => computeInvestmentStats(logs), [logs])

  const todayLog = useMemo(
    () =>
      logs.find((l) => l.logged_date === format(new Date(), "yyyy-MM-dd")) ??
      null,
    [logs],
  )

  return {
    logs,
    settings,
    stats,
    todayLog,
    loading,
    logPnl,
    deleteLog,
    updateSettings,
    refetch: fetchAll,
  }
}
