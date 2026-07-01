import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#3b82f6"/><text x="16" y="22" text-anchor="middle" font-size="18" font-weight="bold" fill="white">P</text></svg>`

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase.from("school_settings") as any)
      .select("logo_url")
      .eq("id", 1)
      .maybeSingle()

    const logoUrl = data?.logo_url as string | null

    if (logoUrl && logoUrl.startsWith("data:image")) {
      const matches = logoUrl.match(/^data:image\/(\w+);base64,(.+)$/)
      if (matches) {
        const ext = matches[1]
        const base64 = matches[2]
        const mime = ext === "svg+xml" ? "image/svg+xml" : `image/${ext}`
        const buffer = Buffer.from(base64, "base64")
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=86400",
          },
        })
      }
    }

    return new NextResponse(DEFAULT_SVG, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch {
    return new NextResponse(DEFAULT_SVG, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    })
  }
}
