import { Inter } from "next/font/google"
import { FlaskConical } from "lucide-react"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"

const inter = Inter({ subsets: ["latin"] })

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let brandName = "SHB Learning Hub"
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase.from("school_settings") as any)
      .select("brand_name")
      .eq("id", 1)
      .single()
    if (data?.brand_name) brandName = data.brand_name
  } catch {}

  return (
    <div className={`${inter.className} flex min-h-screen items-center justify-center bg-muted p-4`}>
      <div className="w-full max-w-sm space-y-6">
        <Link href="/login" className="flex flex-col items-center gap-2">
          <FlaskConical className="h-10 w-10 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">{brandName}</h1>
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </div>
  )
}
