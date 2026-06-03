import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import moment from "npm:moment-timezone@0.5.46"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const TZ = "Asia/Kolkata"

Deno.serve(async (_req) => {
  const startTime = Date.now()
  const now = moment().tz(TZ)
  const todayStr = now.format("YYYY-MM-DD")

  console.log(`[RECURRING-TASKS] Invoked | IST: ${now.format("YYYY-MM-DD HH:mm:ss")} | Today: ${todayStr}`)

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch recurring tasks that are done and due to reopen (using IST date)
    const { data: tasks, error: fetchError } = await supabase
      .from("tasks")
      .select("id, title, user_id, recurrence_type, recurrence_start_day, recurrence_due_offset, next_recurrence_date")
      .eq("is_recurring", true)
      .eq("status", "done")
      .lte("next_recurrence_date", todayStr)

    if (fetchError) throw fetchError

    console.log(`[RECURRING-TASKS] ${tasks?.length ?? 0} tasks to reopen`)

    if (!tasks?.length) {
      return new Response(JSON.stringify({ reopened: 0, elapsed: Date.now() - startTime }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    let reopened = 0, failed = 0

    for (const task of tasks) {
      try {
        // Compute due date using moment in IST
        const nextDate = moment(task.next_recurrence_date).tz(TZ)
        const offset = task.recurrence_due_offset ?? 0
        const dueDateStr = nextDate.add(offset, "days").format("YYYY-MM-DD")

        // Get max position in todo column
        const { data: maxPos } = await supabase
          .from("tasks")
          .select("position")
          .eq("user_id", task.user_id)
          .eq("status", "todo")
          .order("position", { ascending: false })
          .limit(1)
          .single()

        const { error: updateError } = await supabase
          .from("tasks")
          .update({
            status: "todo",
            due_date: dueDateStr,
            completed_at: null,
            next_recurrence_date: null,
            position: (maxPos?.position ?? 0) + 1000,
          })
          .eq("id", task.id)

        if (updateError) {
          console.error(`[RECURRING-TASKS] ✗ "${task.title}":`, updateError)
          failed++
        } else {
          console.log(`[RECURRING-TASKS] ✓ Reopened "${task.title}" → due ${dueDateStr}`)
          reopened++
        }
      } catch (e) {
        console.error(`[RECURRING-TASKS] ✗ "${task.title}":`, e)
        failed++
      }
    }

    const summary = { reopened, failed, checked: tasks.length, elapsed: Date.now() - startTime }
    console.log("[RECURRING-TASKS] Done:", JSON.stringify(summary))
    return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } })
  } catch (e) {
    console.error("[RECURRING-TASKS] Fatal:", e)
    return new Response(JSON.stringify({ error: String(e), elapsed: Date.now() - startTime }), {
      status: 500, headers: { "Content-Type": "application/json" },
    })
  }
})
