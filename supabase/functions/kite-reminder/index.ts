import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import moment from "npm:moment-timezone@0.5.46"

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const KITE_API_KEY = Deno.env.get("KITE_API_KEY")!

const TZ = "Asia/Kolkata"
const KITE_LOGIN_URL = `https://kite.zerodha.com/connect/login?api_key=${encodeURIComponent(KITE_API_KEY)}&v=3`

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<boolean> {
  try {
    const { default: webpush } = await import("npm:web-push@3.6.7")
    webpush.setVapidDetails("mailto:atlas@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      payload,
    )
    return true
  } catch (e) {
    console.error("[PUSH] Failed to send:", e)
    return false
  }
}

Deno.serve(async (_req) => {
  const startTime = Date.now()
  const now = moment().tz(TZ)
  const dayOfWeek = now.day() // 0=Sun, 6=Sat

  console.log(`[KITE-REMINDER] Invoked | IST: ${now.format("YYYY-MM-DD HH:mm:ss")} | Day: ${dayOfWeek}`)

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log("[KITE-REMINDER] Weekend — skipping")
    return new Response(JSON.stringify({ skipped: "weekend", elapsed: Date.now() - startTime }), {
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Today's 6 AM IST cutoff: any Kite login before this is stale.
    const cutoff = moment.tz(now.format("YYYY-MM-DD") + " 06:00", "YYYY-MM-DD HH:mm", TZ)

    const { data: allSubs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("user_id")
    if (subsError) throw subsError

    const userIds = [...new Set((allSubs ?? []).map((s) => s.user_id))]
    if (userIds.length === 0) {
      console.log("[KITE-REMINDER] No users with push subscriptions")
      return new Response(JSON.stringify({ sent: 0, elapsed: Date.now() - startTime }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    const { data: creds, error: credsError } = await supabase
      .from("kite_credentials")
      .select("user_id, login_time")
      .in("user_id", userIds)
    if (credsError) throw credsError

    const loginByUser = new Map<string, string | null>()
    for (const row of creds ?? []) loginByUser.set(row.user_id, row.login_time)

    let sent = 0
    let failed = 0
    let skipped = 0

    for (const userId of userIds) {
      const loginTime = loginByUser.get(userId)
      const isFresh = loginTime && moment(loginTime).tz(TZ).isSameOrAfter(cutoff)
      if (isFresh) {
        skipped++
        continue
      }

      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId)
      if (!subs?.length) continue

      const payload = JSON.stringify({
        title: "Connect to Kite",
        body: "You haven't connected today. Tap to log in.",
        tag: "kite-reconnect",
        url: KITE_LOGIN_URL,
      })

      for (const sub of subs) {
        const ok = await sendWebPush(sub, payload)
        ok ? sent++ : failed++
        console.log(`[KITE-REMINDER] ${ok ? "✓" : "✗"} → ${userId.slice(0, 8)}...`)
      }
    }

    const summary = { sent, failed, skipped, users: userIds.length, elapsed: Date.now() - startTime }
    console.log("[KITE-REMINDER] Done:", JSON.stringify(summary))
    return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } })
  } catch (e) {
    console.error("[KITE-REMINDER] Fatal:", e)
    return new Response(JSON.stringify({ error: String(e), elapsed: Date.now() - startTime }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
