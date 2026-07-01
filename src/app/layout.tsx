import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { ToastProvider } from "@/providers/toast-provider"
import { AuthProvider } from "@/providers/auth-provider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Physics Command Center",
  description: "AI-Powered Physics Teaching Platform for SHB Modernhill",
  manifest: "/manifest.json",
  icons: { icon: "/api/favicon", apple: "/icon-192x192.png" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
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
