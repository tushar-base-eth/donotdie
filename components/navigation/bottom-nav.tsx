"use client"

import { Home, History, BarChart2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const items = [
    {
      title: "Home",
      href: "/",
      icon: Home,
    },
    {
      title: "History",
      href: "/history",
      icon: History,
    },
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart2,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-4 backdrop-blur-lg">
      {items.map((item) => (
        <button
          key={item.href}
          onClick={() => router.push(item.href)}
          className={cn(
            "flex flex-col items-center justify-center gap-1",
            pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary",
          )}
        >
          <item.icon className="h-6 w-6" />
          <span className="text-xs">{item.title}</span>
        </button>
      ))}
    </div>
  )
}

