import { NavLink } from "react-router"
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Bell,
  TrendingUp,
  Lightbulb,
  Trophy,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/habits", icon: Repeat, label: "Habits" },
  { to: "/reminders", icon: Bell, label: "Reminders" },
  { to: "/investments", icon: TrendingUp, label: "Investments" },
  { to: "/ideas", icon: Lightbulb, label: "Ideas" },
  { to: "/achievements", icon: Trophy, label: "Achievements" },
]

export function AppSidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-sidebar p-4 flex flex-col">
      <div className="flex items-center gap-2 px-2 py-4">
        <span className="text-xl font-bold tracking-tight text-primary">
          Atlas
        </span>
      </div>
      <Separator />
      <nav className="flex-1 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Separator />
      <div className="flex items-center gap-3 px-2 py-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback>
            {user?.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {user?.user_metadata?.full_name ?? user?.email}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  )
}
