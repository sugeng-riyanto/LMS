import type { Metadata } from "next"

export const dynamic = "force-dynamic"
import "@/styles/globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { ToastProvider } from "@/providers/toast-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { FontSizeProvider } from "@/providers/font-size-provider"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { CriticalPagePrefetcher } from "@/components/critical-page-prefetcher"
import { createAdminClient } from "@/lib/supabase/admin"

export async function generateMetadata(): Promise<Metadata> {
  let brandName = "SHB Learning Hub"
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase.from("school_settings") as any)
      .select("brand_name")
      .eq("id", 1)
      .single()
    if (data?.brand_name) brandName = data.brand_name
  } catch {}
  return {
    title: brandName,
    description: `${brandName} — AI-Powered Learning Platform for SHB Modernhill`,
    manifest: "/manifest.json",
    icons: { icon: "/api/favicon", apple: "/icons/icon.svg" },
  }
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
      <body className="font-sans antialiased">
        <ServiceWorkerRegister />
        <ThemeProvider>
          <AuthProvider>
            <CriticalPagePrefetcher />
            <FontSizeProvider>
              <QueryProvider>
                {children}
                <ToastProvider />
              </QueryProvider>
            </FontSizeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
