import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { KiteConnect } from "npm:kiteconnect@5.3.0"

const KITE_API_KEY = Deno.env.get("KITE_API_KEY")!
const KITE_API_SECRET = Deno.env.get("KITE_API_SECRET")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return json({ error: "Missing authorization" }, 401)

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) return json({ error: "Invalid user" }, 401)
  const userId = userData.user.id

  let body: { request_token?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }
  const requestToken = body.request_token?.trim()
  if (!requestToken) return json({ error: "request_token required" }, 400)

  const kc = new KiteConnect({ api_key: KITE_API_KEY })

  let session: {
    access_token: string
    public_token?: string
    user_id: string
    user_name?: string
    broker?: string
    login_time?: string | Date
  }
  try {
    session = await kc.generateSession(requestToken, KITE_API_SECRET)
  } catch (e) {
    console.error("[KITE] generateSession failed", e)
    const msg = e instanceof Error ? e.message : "Token exchange failed"
    return json({ error: msg }, 400)
  }

  const loginTime =
    session.login_time instanceof Date
      ? session.login_time.toISOString()
      : typeof session.login_time === "string"
        ? new Date(session.login_time.replace(" ", "T") + "+05:30").toISOString()
        : null

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { error: upsertErr } = await admin
    .from("kite_credentials")
    .upsert({
      user_id: userId,
      kite_user_id: session.user_id,
      kite_username: session.user_name ?? null,
      kite_broker: session.broker ?? null,
      access_token: session.access_token,
      public_token: session.public_token ?? null,
      login_time: loginTime,
    }, { onConflict: "user_id" })

  if (upsertErr) {
    console.error("[KITE] Upsert failed", upsertErr)
    return json({ error: "Failed to store credentials" }, 500)
  }

  return json({
    connected: true,
    kite_user_id: session.user_id,
    kite_username: session.user_name ?? null,
  })
})
