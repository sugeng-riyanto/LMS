import { Inter } from "next/font/google"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"

const inter = Inter({ subsets: ["latin"] })

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let brandName = "SHB Learning Hub"
  let logoUrl = ""
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase.from("school_settings") as any)
      .select("brand_name, logo_url")
      .eq("id", 1)
      .single()
    if (data?.brand_name) brandName = data.brand_name
    if (data?.logo_url) logoUrl = data.logo_url
  } catch {}

  return (
    <div className={`${inter.className} flex min-h-screen items-center justify-center bg-muted p-4`}>
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex flex-col items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-16 w-16 rounded-lg object-contain" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-2xl font-bold text-primary">{brandName.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-xl font-semibold tracking-tight">{brandName}</h1>
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </div>
  )
}
