import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())

    console.log("[Supabase Webhook] Received event:", {
      type: body.type,
      table: body.table,
      schema: body.schema,
      record: body.record,
      old_record: body.old_record,
      timestamp: new Date().toISOString(),
      headers: {
        "user-agent": headers["user-agent"],
        "x-forwarded-for": headers["x-forwarded-for"],
      },
    })

    return NextResponse.json({ received: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("[Supabase Webhook] Error processing event:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
