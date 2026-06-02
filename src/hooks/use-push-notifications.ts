import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  requestNotificationPermission,
  subscribeToPush,
  saveSubscription,
  unsubscribeFromPush,
} from "@/lib/push-notifications"
import { useAuth } from "@/hooks/use-auth"

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied",
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub)
        })
      })
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const perm = await requestNotificationPermission()
      setPermission(perm)
      if (perm === "denied") {
        toast.error("Notification permission denied. Enable it in browser settings.")
        return
      }
      if (perm === "granted") {
        const subscription = await subscribeToPush()
        if (subscription) {
          await saveSubscription(subscription)
          setIsSubscribed(true)
          toast.success("Notifications enabled")
        } else {
          toast.error("Failed to subscribe to push notifications")
        }
      }
    } catch (e) {
      console.error("Push subscription error:", e)
      toast.error("Failed to enable notifications: " + (e instanceof Error ? e.message : String(e)))
    } finally {
      setLoading(false)
    }
  }, [user])

  const unsubscribe = useCallback(async () => {
    setLoading(true)
    try {
      await unsubscribeFromPush()
      setIsSubscribed(false)
    } finally {
      setLoading(false)
    }
  }, [])

  return { permission, isSubscribed, loading, subscribe, unsubscribe }
}
