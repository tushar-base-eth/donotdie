"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Settings, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/history", icon: History, label: "History" },
    { href: "/dashboard", icon: LineChart, label: "Dashboard" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-background/85 border-t border-border/50 shadow-lg rounded-t-xl glass h-16 safe-area-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25, duration: 0.5 }}
      role="navigation"
      aria-label="Main navigation"
    >
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
                "flex flex-col items-center justify-center p-3 min-h-[48px] transition-all duration-300",
                isActive
                  ? "text-primary bg-primary/10 rounded-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
              )}
              aria-label={item.label}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="h-6 w-6 mb-1" />
              </motion.div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}