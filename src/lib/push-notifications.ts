import { supabase } from "./supabase"

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported")
    return "denied"
  }
  return await Notification.requestPermission()
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) {
    console.error("[PUSH] Service workers not supported")
    return null
  }
  if (!VAPID_PUBLIC_KEY) {
    console.error("[PUSH] VAPID public key not configured")
    return null
  }

  console.log("[PUSH] VAPID key:", VAPID_PUBLIC_KEY.slice(0, 20) + "...")
  console.log("[PUSH] Waiting for service worker ready...")

  const registration = await navigator.serviceWorker.ready
  console.log("[PUSH] SW ready, scope:", registration.scope)

  // Check for existing subscription first
  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    console.log("[PUSH] Found existing subscription, reusing")
    return existing
  }

  console.log("[PUSH] Subscribing to push...")
  const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  console.log("[PUSH] Key bytes length:", applicationServerKey.length)

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey as BufferSource,
  })

  console.log("[PUSH] Subscribed:", subscription.endpoint.slice(0, 50) + "...")
  return subscription
}

export async function saveSubscription(
  subscription: PushSubscription,
): Promise<void> {
  const key = subscription.getKey("p256dh")
  const auth = subscription.getKey("auth")

  if (!key || !auth) throw new Error("Invalid subscription keys")

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
      user_id: user?.id,
    },
    { onConflict: "user_id,endpoint" },
  )

  if (error) throw error
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
  }
}
