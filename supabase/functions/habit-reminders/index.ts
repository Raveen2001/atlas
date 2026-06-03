import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import moment from "npm:moment-timezone@0.5.46"

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const TZ = "Asia/Kolkata"

const DAY_MAP: Record<number, string> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
}

function isHabitDueToday(habit: { frequency_type: string; frequency_days: string[] }): boolean {
  const today = DAY_MAP[moment().tz(TZ).day()]
  switch (habit.frequency_type) {
    case "daily": return true
    case "weekdays": return ["mon", "tue", "wed", "thu", "fri"].includes(today)
    case "specific_days": return habit.frequency_days.includes(today)
    case "times_per_week": return true
    default: return false
  }
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

  console.log(`[HABIT-REMINDERS] Invoked | IST: ${now.format("YYYY-MM-DD HH:mm:ss")} | Matching: ${currentTime}`)

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch habits with reminders matching the current IST minute
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("id, user_id, name, frequency_type, frequency_days, reminder_time")
      .eq("archived", false)
      .gte("reminder_time", currentTime + ":00")
      .lte("reminder_time", currentTime + ":59")

    if (habitsError) throw habitsError

    console.log(`[HABIT-REMINDERS] ${habits?.length ?? 0} habits match reminder_time ${currentTime}`)

    const dueHabits = (habits ?? []).filter((h) => isHabitDueToday(h))
    console.log(`[HABIT-REMINDERS] ${dueHabits.length} due today`)

    if (dueHabits.length === 0) {
      return new Response(JSON.stringify({ sent: 0, checked: 0, elapsed: Date.now() - startTime }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Exclude already-completed habits
    const habitIds = dueHabits.map((h) => h.id)
    const { data: todayLogs, error: logsError } = await supabase
      .from("habit_logs")
      .select("habit_id")
      .eq("logged_date", todayStr)
      .in("habit_id", habitIds)

    if (logsError) throw logsError

    const completedIds = new Set((todayLogs ?? []).map((l) => l.habit_id))
    const unfinished = dueHabits.filter((h) => !completedIds.has(h.id))

    console.log(`[HABIT-REMINDERS] ${completedIds.size} done, ${unfinished.length} unfinished`)

    if (unfinished.length === 0) {
      return new Response(JSON.stringify({ sent: 0, checked: dueHabits.length, allDone: true, elapsed: Date.now() - startTime }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Group by user and send
    const byUser = new Map<string, typeof unfinished>()
    for (const h of unfinished) {
      byUser.set(h.user_id, [...(byUser.get(h.user_id) ?? []), h])
    }

    let sent = 0, failed = 0

    for (const [userId, userHabits] of byUser) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId)

      if (!subs?.length) {
        console.log(`[HABIT-REMINDERS] User ${userId.slice(0, 8)}...: no subscriptions`)
        continue
      }

      for (const habit of userHabits) {
        const payload = JSON.stringify({
          title: `Reminder: ${habit.name}`,
          body: `You haven't completed "${habit.name}" yet today!`,
          tag: `habit-${habit.id}`,
          url: "/habits",
        })

        for (const sub of subs) {
          const ok = await sendWebPush(sub, payload)
          ok ? sent++ : failed++
          console.log(`[HABIT-REMINDERS] ${ok ? "✓" : "✗"} "${habit.name}"`)
        }
      }
    }

    const summary = { sent, failed, unfinished: unfinished.length, checked: dueHabits.length, elapsed: Date.now() - startTime }
    console.log("[HABIT-REMINDERS] Done:", JSON.stringify(summary))
    return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } })
  } catch (e) {
    console.error("[HABIT-REMINDERS] Fatal:", e)
    return new Response(JSON.stringify({ error: String(e), elapsed: Date.now() - startTime }), {
      status: 500, headers: { "Content-Type": "application/json" },
    })
  }
})
