import { useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { buildKiteLoginUrl } from "@/lib/kite-api"

export function KiteLoginPage() {
  const navigate = useNavigate()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    try {
      window.location.replace(buildKiteLoginUrl())
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kite is not configured")
      navigate("/", { replace: true })
    }
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      <p className="text-sm text-muted-foreground">Redirecting to Kite…</p>
    </div>
  )
}
