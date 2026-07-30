import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import * as api from "@/lib/stocks-api"
import { fetchRealisedTrades } from "@/lib/investments-api"
import { resyncKitePnl } from "@/lib/kite-api"
import {
  deriveHoldings,
  bookedPnlBySymbol,
} from "@/lib/stock-utils"
import type { StockSet } from "@/lib/stock-utils"
import type { HoldingsSnapshot } from "@/lib/stocks-api"
import type { RealisedTrade } from "@/types/investments"

export function useStocks() {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<HoldingsSnapshot | null>(null)
  const [sets, setSets] = useState<StockSet[]>([])
  const [trades, setTrades] = useState<RealisedTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [resyncing, setResyncing] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!user) return
    try {
      const [snapshotData, setsData, tradesData] = await Promise.all([
        api.fetchLatestHoldingsSnapshot(user.id),
        api.fetchStockSets(user.id),
        fetchRealisedTrades(user.id),
      ])
      setSnapshot(snapshotData)
      setSets(setsData)
      setTrades(tradesData)
    } catch (e) {
      toast.error("Failed to load stocks")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const createSet = useCallback(
    async (name: string, symbols: string[]) => {
      if (!user) return false
      try {
        const created = await api.createStockSet(user.id, name, symbols)
        setSets((prev) => [...prev, created])
        toast.success("Set created")
        return true
      } catch (e) {
        toast.error(
          api.isDuplicateNameError(e)
            ? "A set with that name already exists"
            : "Failed to create set",
        )
        console.error(e)
        return false
      }
    },
    [user],
  )

  const updateSet = useCallback(
    async (setId: string, patch: { name?: string; symbols?: string[] }) => {
      try {
        const updated = await api.updateStockSet(setId, patch)
        setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)))
        toast.success("Set updated")
        return true
      } catch (e) {
        toast.error(
          api.isDuplicateNameError(e)
            ? "A set with that name already exists"
            : "Failed to update set",
        )
        console.error(e)
        return false
      }
    },
    [],
  )

  const deleteSet = useCallback(async (setId: string) => {
    try {
      await api.deleteStockSet(setId)
      setSets((prev) => prev.filter((s) => s.id !== setId))
      toast.success("Set deleted")
      return true
    } catch (e) {
      toast.error("Failed to delete set")
      console.error(e)
      return false
    }
  }, [])

  const resync = useCallback(async () => {
    if (resyncing) return
    setResyncing(true)
    try {
      const result = await resyncKitePnl()
      if (result.skipped === "weekend") {
        toast.info("Market closed for the weekend — nothing to sync")
      } else if (result.synced === 0) {
        toast.warning("No fresh Kite token — reconnect Kite, then resync")
      } else {
        toast.success("Holdings resynced from Kite")
      }
      await fetchAll()
    } catch (e) {
      toast.error("Resync failed")
      console.error(e)
    } finally {
      setResyncing(false)
    }
  }, [resyncing, fetchAll])

  const holdings = useMemo(
    () => (snapshot ? deriveHoldings(snapshot.holdings) : []),
    [snapshot],
  )

  const bookedBySymbol = useMemo(() => bookedPnlBySymbol(trades), [trades])

  return {
    snapshot,
    holdings,
    sets,
    bookedBySymbol,
    loading,
    resyncing,
    createSet,
    updateSet,
    deleteSet,
    resync,
    refetch: fetchAll,
  }
}
