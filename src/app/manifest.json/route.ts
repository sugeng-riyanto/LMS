import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  let name = "SHB Learning Hub"
  let iconUrl = "/icons/icon.svg"

  try {
    const supabase = createAdminClient()
    const { data } = await (supabase.from("school_settings") as any)
      .select("brand_name, logo_url")
      .eq("id", 1)
      .single()
    if (data?.brand_name) name = data.brand_name
    if (data?.logo_url) iconUrl = data.logo_url
  } catch {}

  const manifest = {
    name,
    short_name: name.length > 12 ? name.substring(0, 12) + "…" : name,
    description: `${name} — Multi-Subject Learning Platform for SHB Modernhill`,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#6d5acf",
    orientation: "portrait-primary",
    icons: [
      {
        src: iconUrl,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: iconUrl,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["education"],
    lang: "id-ID",
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
