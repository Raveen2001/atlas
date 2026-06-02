import { Outlet } from "react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav"

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: sidebar + content */}
      <div className="hidden md:flex">
        <AppSidebar />
        <main className="flex-1 p-6 ml-64">
          <Outlet />
        </main>
      </div>

      {/* Mobile: content + bottom nav */}
      <div className="md:hidden">
        <main className="p-4 pb-20">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
