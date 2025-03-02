"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Settings, History } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", icon: Home, label: "Home" }, // Changed from '/' to '/home' to align with typical app structure
    { href: "/history", icon: History, label: "History" },
    { href: "/dashboard", icon: LineChart, label: "Dashboard" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background border-t border-border safe-area-bottom">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              scroll={false}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 group",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}