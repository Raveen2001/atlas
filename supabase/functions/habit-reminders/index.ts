import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const DAY_MAP: Record<number, string> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
}

function isHabitDueToday(habit: {
  frequency_type: string
  frequency_days: string[]
}): boolean {
  const today = DAY_MAP[new Date().getDay()]
  switch (habit.frequency_type) {
    case "daily":
      return true
    case "weekdays":
      return ["mon", "tue", "wed", "thu", "fri"].includes(today)
    case "specific_days":
      return habit.frequency_days.includes(today)
    case "times_per_week":
      return true
    default:
      return false
  }
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<boolean> {
  try {
    const { default: webpush } = await import("npm:web-push@3.6.7")
    webpush.setVapidDetails(
      "mailto:atlas@example.com",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY,
    )

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
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
  console.log("[HABIT-REMINDERS] Function invoked at", new Date().toISOString())

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const todayStr = now.toISOString().slice(0, 10) // YYYY-MM-DD

    console.log("[HABIT-REMINDERS] Current time:", currentTime, "| Today:", todayStr)

    // Fetch all active habits with reminders where reminder_time <= current time
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("id, user_id, name, frequency_type, frequency_days, reminder_time")
      .eq("archived", false)
      .not("reminder_time", "is", null)
      .lte("reminder_time", currentTime + ":59")

    if (habitsError) {
      console.error("[HABIT-REMINDERS] Error fetching habits:", habitsError)
      throw habitsError
    }

    console.log(`[HABIT-REMINDERS] Found ${habits?.length ?? 0} habits with reminder_time <= ${currentTime}`)

    // Filter to habits that are due today
    const dueHabits = (habits ?? []).filter((h) => isHabitDueToday(h))
    console.log(`[HABIT-REMINDERS] ${dueHabits.length} habits due today after frequency filter`)

    if (dueHabits.length === 0) {
      const elapsed = Date.now() - startTime
      console.log(`[HABIT-REMINDERS] No habits to notify. Done in ${elapsed}ms`)
      return new Response(JSON.stringify({ sent: 0, checked: 0, elapsed }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch today's logs to exclude already-completed habits
    const habitIds = dueHabits.map((h) => h.id)
    const { data: todayLogs, error: logsError } = await supabase
      .from("habit_logs")
      .select("habit_id")
      .eq("logged_date", todayStr)
      .in("habit_id", habitIds)

    if (logsError) {
      console.error("[HABIT-REMINDERS] Error fetching logs:", logsError)
      throw logsError
    }

    const completedHabitIds = new Set((todayLogs ?? []).map((l) => l.habit_id))
    const unfinishedHabits = dueHabits.filter((h) => !completedHabitIds.has(h.id))

    console.log(`[HABIT-REMINDERS] ${completedHabitIds.size} already completed, ${unfinishedHabits.length} unfinished`)

    if (unfinishedHabits.length === 0) {
      const elapsed = Date.now() - startTime
      console.log(`[HABIT-REMINDERS] All habits completed. Done in ${elapsed}ms`)
      return new Response(JSON.stringify({ sent: 0, checked: dueHabits.length, allDone: true, elapsed }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Group by user
    const habitsByUser = new Map<string, typeof unfinishedHabits>()
    for (const habit of unfinishedHabits) {
      const existing = habitsByUser.get(habit.user_id) ?? []
      existing.push(habit)
      habitsByUser.set(habit.user_id, existing)
    }

    let totalSent = 0
    let totalFailed = 0

    for (const [userId, userHabits] of habitsByUser) {
      console.log(`[HABIT-REMINDERS] User ${userId.slice(0, 8)}...: ${userHabits.length} unfinished habits`)

      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId)

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`[HABIT-REMINDERS] User ${userId.slice(0, 8)}...: no push subscriptions, skipping`)
        continue
      }

      console.log(`[HABIT-REMINDERS] User ${userId.slice(0, 8)}...: ${subscriptions.length} subscription(s)`)

      for (const habit of userHabits) {
        const payload = JSON.stringify({
          title: `Reminder: ${habit.name}`,
          body: `You haven't completed "${habit.name}" yet today!`,
          tag: `habit-${habit.id}`,
          url: "/habits",
        })

        for (const sub of subscriptions) {
          console.log(`[HABIT-REMINDERS] Sending push for "${habit.name}" to endpoint ${sub.endpoint.slice(0, 50)}...`)
          const success = await sendWebPush(sub, payload)
          if (success) {
            totalSent++
            console.log(`[HABIT-REMINDERS] ✓ Push sent for "${habit.name}"`)
          } else {
            totalFailed++
            console.log(`[HABIT-REMINDERS] ✗ Push failed for "${habit.name}"`)
          }
        }
      }
    }

    const elapsed = Date.now() - startTime
    const summary = {
      sent: totalSent,
      failed: totalFailed,
      unfinished: unfinishedHabits.length,
      checked: dueHabits.length,
      elapsed,
    }
    console.log("[HABIT-REMINDERS] Done:", JSON.stringify(summary))

    return new Response(JSON.stringify(summary), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    const elapsed = Date.now() - startTime
    console.error("[HABIT-REMINDERS] Fatal error:", e)
    return new Response(JSON.stringify({ error: String(e), elapsed }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
