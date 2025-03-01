import type React from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { WorkoutProvider } from "@/contexts/workout-context";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ConditionalBottomNav } from '@/components/navigation/conditional-bottom-nav';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>DoNotDie - Track your workouts and stay alive</title>
        <meta name="description" content="Track your workouts and stay alive with DoNotDie" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <WorkoutProvider>
              <div className="pb-20">
                {children}
              </div>
              <ConditionalBottomNav />
              <Toaster />
            </WorkoutProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}