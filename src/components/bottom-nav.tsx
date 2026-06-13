import { NavLink, useLocation, useNavigate } from "react-router"
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  Bell,
  TrendingUp,
  Lightbulb,
  LineChart,
  Trophy,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const primaryItems = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/habits", icon: Repeat, label: "Habits" },
  { to: "/tracker", icon: LineChart, label: "Tracker" },
]

const overflowItems = [
  { to: "/investments", icon: TrendingUp, label: "Investments" },
  { to: "/reminders", icon: Bell, label: "Reminders" },
  { to: "/ideas", icon: Lightbulb, label: "Ideas" },
  { to: "/achievements", icon: Trophy, label: "Achievements" },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const isOverflowActive = overflowItems.some((it) =>
    location.pathname.startsWith(it.to),
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {primaryItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                  isOverflowActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
            }
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={8}
            className="min-w-44 mb-[env(safe-area-inset-bottom)]"
          >
            {overflowItems.map(({ to, icon: Icon, label }) => {
              const active = location.pathname.startsWith(to)
              return (
                <DropdownMenuItem
                  key={to}
                  onClick={() => navigate(to)}
                  className={active ? "text-primary" : ""}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
