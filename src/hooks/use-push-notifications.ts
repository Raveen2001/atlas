import { useState, useEffect, useCallback } from "react"
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
      if (perm === "granted") {
        const subscription = await subscribeToPush()
        if (subscription) {
          await saveSubscription(subscription)
          setIsSubscribed(true)
        }
      }
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
