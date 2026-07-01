import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const supabase = createAdminClient()

    // Auto-create bucket if missing
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find(b => b.id === "worksheets")) {
      await supabase.storage.createBucket("worksheets", { public: true })
    }

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const ext = file.name.endsWith(".png") ? "image/png" : file.name.endsWith(".jpg") || file.name.endsWith(".jpeg") ? "image/jpeg" : file.type
    const { data, error } = await supabase.storage
      .from("worksheets")
      .upload(fileName, file, { contentType: ext, cacheControl: "3600" })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage
      .from("worksheets")
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl, filename: fileName })
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
