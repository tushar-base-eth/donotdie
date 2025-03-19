"use client";

import { useUserProfile } from "@/contexts/profile-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Settings, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const { state } = useUserProfile(); // First hook
  const pathname = usePathname(); // Second hook, called unconditionally

  // If no profile exists (user not signed in), do not render the nav bar
  if (!state.profile) {
    return null;
  }

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/history", icon: History, label: "History" },
    { href: "/dashboard", icon: LineChart, label: "Dashboard" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border shadow-lg rounded-t-3xl bottom-nav"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="grid h-16 max-w-lg grid-cols-4 mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              scroll={false}
              className={cn(
                "flex flex-col items-center justify-center p-2 transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
