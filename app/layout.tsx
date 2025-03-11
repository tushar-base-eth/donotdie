import type React from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ConditionalBottomNav } from "@/components/navigation/conditional-bottom-nav";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

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
      <body className={cn("min-h-screen bg-background antialiased vsc-initialized", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          disableTransitionOnChange
        >
          <AuthProvider>
              <ErrorBoundary>
                <div className="h-[calc(100vh-64px)] overflow-auto">{children}</div>
                <ConditionalBottomNav />
              </ErrorBoundary>
              <Toaster />
              <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}