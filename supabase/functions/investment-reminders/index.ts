import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import moment from "npm:moment-timezone@0.5.46"

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const TZ = "Asia/Kolkata"

// Defaults matching DEFAULT_SETTINGS in src/types/investments.ts
const DEFAULTS = {
  buy_reminder_enabled: true,
  buy_reminder_time: "15:25:00",
  log_reminder_enabled: true,
  log_reminder_time: "16:00:00",
  followup_enabled: true,
  end_of_day_time: "23:00:00",
}

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
  const currentTime = now.format("HH:mm")
  const todayStr = now.format("YYYY-MM-DD")
  const dayOfWeek = now.day() // 0=Sun, 6=Sat

  console.log(`[INVEST-REMINDERS] Invoked | IST: ${now.format("YYYY-MM-DD HH:mm:ss")} | Day: ${dayOfWeek}`)

  // Skip weekends — no trading
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log("[INVEST-REMINDERS] Weekend — skipping")
    return new Response(JSON.stringify({ skipped: "weekend", elapsed: Date.now() - startTime }), {
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all users with push subscriptions (these are the users who can receive notifications)
    const { data: allSubs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("user_id")

    if (subsError) throw subsError

    // Deduplicate user IDs
    const userIds = [...new Set((allSubs ?? []).map((s) => s.user_id))]
    if (userIds.length === 0) {
      console.log("[INVEST-REMINDERS] No users with push subscriptions")
      return new Response(JSON.stringify({ sent: 0, noUsers: true, elapsed: Date.now() - startTime }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch settings for users who have them
    const { data: settingsRows, error: settingsError } = await supabase
      .from("investment_settings")
      .select("*")
      .in("user_id", userIds)

    if (settingsError) throw settingsError

    const settingsMap = new Map<string, typeof DEFAULTS>()
    for (const row of settingsRows ?? []) {
      settingsMap.set(row.user_id, row)
    }

    let sent = 0
    let failed = 0

    for (const userId of userIds) {
      // Use user's settings or fall back to defaults
      const settings = settingsMap.get(userId) ?? DEFAULTS
      const buyTime = settings.buy_reminder_time?.slice(0, 5)
      const logTime = settings.log_reminder_time?.slice(0, 5)
      const endTime = settings.end_of_day_time?.slice(0, 5)

      let shouldNotify = false
      let title = ""
      let body = ""
      let tag = ""

      // Check 1: Buy reminder
      if (settings.buy_reminder_enabled && currentTime === buyTime) {
        shouldNotify = true
        title = "Time to buy stocks!"
        body = "Market closing soon. Place your orders."
        tag = "investment-buy"
      }

      // Check 2: Log P&L reminder
      if (!shouldNotify && settings.log_reminder_enabled && currentTime === logTime) {
        const { data: todayLog } = await supabase
          .from("investment_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("logged_date", todayStr)
          .limit(1)

        if (!todayLog?.length) {
          shouldNotify = true
          title = "Log your P&L"
          body = "Market is closed. How did you do today?"
          tag = "investment-log"
        }
      }

      // Check 3: Follow-up reminders (hourly after log time until end of day)
      if (!shouldNotify && settings.followup_enabled && settings.log_reminder_enabled) {
        const logMoment = moment.tz(`${todayStr} ${logTime}`, "YYYY-MM-DD HH:mm", TZ)
        const endMoment = moment.tz(`${todayStr} ${endTime}`, "YYYY-MM-DD HH:mm", TZ)

        if (now.isAfter(logMoment) && now.isBefore(endMoment)) {
          const minutesSinceLog = now.diff(logMoment, "minutes")
          // Fire on hour boundaries (with 1-minute tolerance for cron drift)
          if (minutesSinceLog > 0 && minutesSinceLog % 60 <= 1) {
            const { data: todayLog } = await supabase
              .from("investment_logs")
              .select("id")
              .eq("user_id", userId)
              .eq("logged_date", todayStr)
              .limit(1)

            if (!todayLog?.length) {
              shouldNotify = true
              title = "Don't forget to log P&L!"
              body = "You still haven't logged today's P&L."
              tag = "investment-followup"
            }
          }
        }
      }

      if (!shouldNotify) continue

      // Fetch push subscriptions and send
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId)

      if (!subs?.length) continue

      const payload = JSON.stringify({ title, body, tag, url: "/investments" })

      for (const sub of subs) {
        const ok = await sendWebPush(sub, payload)
        ok ? sent++ : failed++
        console.log(`[INVEST-REMINDERS] ${ok ? "✓" : "✗"} ${tag} → ${userId.slice(0, 8)}...`)
      }
    }

    const summary = { sent, failed, users: userIds.length, elapsed: Date.now() - startTime }
    console.log("[INVEST-REMINDERS] Done:", JSON.stringify(summary))
    return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } })
  } catch (e) {
    console.error("[INVEST-REMINDERS] Fatal:", e)
    return new Response(JSON.stringify({ error: String(e), elapsed: Date.now() - startTime }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
