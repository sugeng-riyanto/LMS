import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { ToastProvider } from "@/providers/toast-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { CriticalPagePrefetcher } from "@/components/critical-page-prefetcher"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Physics Command Center",
  description: "AI-Powered Physics Teaching Platform for SHB Modernhill",
  manifest: "/manifest.json",
  icons: { icon: "/api/favicon", apple: "/icons/icon.svg" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://yvnomvcmqsfbkqqjwzhi.supabase.co" />
        <link rel="dns-prefetch" href="https://yvnomvcmqsfbkqqjwzhi.supabase.co" />
        <style>{`*,*::before,*::after{box-sizing:border-box}.sk-init{display:flex;min-height:100vh;align-items:center;justify-content:center;background:#fff;color:#6b7280}.sk-init.dark{background:#030712;color:#9ca3af}.sk-spinner{width:2.5rem;height:2.5rem;border:4px solid #2563eb;border-top-color:transparent;border-radius:9999px;animation:sk-spin .8s linear infinite;margin:0 auto 1rem}.sk-text{font-family:system-ui,sans-serif;font-size:.875rem}@keyframes sk-spin{to{transform:rotate(360deg)}}`}</style>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ServiceWorkerRegister />
        <ThemeProvider>
          <AuthProvider>
            <CriticalPagePrefetcher />
            <QueryProvider>
              {children}
              <ToastProvider />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
