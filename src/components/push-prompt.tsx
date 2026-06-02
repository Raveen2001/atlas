import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, X } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export function PushPrompt() {
  const { permission, isSubscribed, loading, subscribe } =
    usePushNotifications()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || isSubscribed || permission === "denied") return null

  return (
    <Card className="border-primary/20 bg-accent">
      <CardContent className="flex items-center gap-4 py-4">
        <Bell className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Enable notifications</p>
          <p className="text-xs text-muted-foreground">
            Get reminded about tasks and events
          </p>
        </div>
        <Button size="sm" onClick={subscribe} disabled={loading}>
          Enable
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
