import type React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ProfileProvider } from "@/contexts/profile-context";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/navigation/bottom-nav";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Zero - Simple way to not die</title>
        <meta
          name="description"
          content="Things changes when you start from zero"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
      </head>
      <body className="min-h-screen bg-background antialiased vsc-initialized">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ProfileProvider>
            <ErrorBoundary>
              <div className="h-[calc(100vh-64px)] overflow-auto">
                {children}
              </div>
              <BottomNav />
            </ErrorBoundary>
            <Toaster />
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
