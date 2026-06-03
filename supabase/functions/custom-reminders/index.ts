import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import moment from "npm:moment-timezone@0.5.46"

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const TZ = "Asia/Kolkata"

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
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

  console.log(`[CUSTOM-REMINDERS] Invoked | IST: ${now.format("YYYY-MM-DD HH:mm:ss")}`)

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch enabled reminders matching the current minute
    const { data: reminders, error: remindersError } = await supabase
      .from("reminders")
      .select("id, user_id, title, note, remind_time, remind_date, recurrence")
      .eq("enabled", true)
      .gte("remind_time", currentTime + ":00")
      .lte("remind_time", currentTime + ":59")

    if (remindersError) throw remindersError

    console.log(`[CUSTOM-REMINDERS] ${reminders?.length ?? 0} reminders match ${currentTime}`)

    if (!reminders?.length) {
      return new Response(JSON.stringify({ sent: 0, elapsed: Date.now() - startTime }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Filter by recurrence
    const due = reminders.filter((r) => {
      switch (r.recurrence) {
        case "daily":
          return true
        case "weekdays":
          return isWeekday
        case "once":
          return r.remind_date === todayStr
        default:
          return false
      }
    })

    console.log(`[CUSTOM-REMINDERS] ${due.length} due now`)

    if (due.length === 0) {
      return new Response(JSON.stringify({ sent: 0, checked: reminders.length, elapsed: Date.now() - startTime }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Group by user
    const byUser = new Map<string, typeof due>()
    for (const r of due) {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r])
    }

    let sent = 0
    let failed = 0

    for (const [userId, userReminders] of byUser) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId)

      if (!subs?.length) continue

      for (const reminder of userReminders) {
        const payload = JSON.stringify({
          title: reminder.title,
          body: reminder.note || "Reminder",
          tag: `reminder-${reminder.id}`,
          url: "/reminders",
        })

        for (const sub of subs) {
          const ok = await sendWebPush(sub, payload)
          ok ? sent++ : failed++
          console.log(`[CUSTOM-REMINDERS] ${ok ? "✓" : "✗"} "${reminder.title}"`)
        }

        // Disable one-off reminders after sending
        if (reminder.recurrence === "once") {
          await supabase
            .from("reminders")
            .update({ enabled: false })
            .eq("id", reminder.id)
          console.log(`[CUSTOM-REMINDERS] Disabled one-off: "${reminder.title}"`)
        }
      }
    }

    const summary = { sent, failed, due: due.length, elapsed: Date.now() - startTime }
    console.log("[CUSTOM-REMINDERS] Done:", JSON.stringify(summary))
    return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } })
  } catch (e) {
    console.error("[CUSTOM-REMINDERS] Fatal:", e)
    return new Response(JSON.stringify({ error: String(e), elapsed: Date.now() - startTime }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
