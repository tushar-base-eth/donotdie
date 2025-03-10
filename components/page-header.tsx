"use client";

import type React from "react";
import { Settings, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  showSettings?: boolean;
  rightContent?: React.ReactNode;
}

export function PageHeader({ title, showSettings = true, rightContent }: PageHeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 backdrop-blur-lg rounded-b-3xl">
      <h1 className="text-lg font-semibold">{title}</h1>
      {rightContent ||
        (showSettings && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        ))}
    </header>
  );
}