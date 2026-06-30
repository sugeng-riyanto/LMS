import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"
import { readdir, readFile } from "fs/promises"
import { join } from "path"

const KNOWLEDGE_BASE_DIR = join(process.cwd(), "knowledge-base")
const CHUNK_SIZE = 750
const CHUNK_OVERLAP = 100

function chunkText(text: string, fileName: string): Array<{ chunk_text: string; chunk_index: number }> {
  const words = text.split(/\s+/)
  const chunks: Array<{ chunk_text: string; chunk_index: number }> = []
  let index = 0

  for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ")
    if (chunk.trim()) {
      chunks.push({ chunk_text: chunk, chunk_index: index++ })
    }
  }

  return chunks
}

export async function POST(_request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const adminClient = createAdminClient()

    let files: string[]
    try {
      files = await readdir(KNOWLEDGE_BASE_DIR)
    } catch {
      return NextResponse.json({ error: "knowledge-base directory not found" }, { status: 404 })
    }

    const mdFiles = files.filter((f) => f.endsWith(".md"))

    if (mdFiles.length === 0) {
      return NextResponse.json({ error: "No markdown files found in knowledge-base" }, { status: 404 })
    }

    const allChunks: Array<{
      file_name: string
      chunk_index: number
      chunk_text: string
      metadata: Record<string, unknown>
    }> = []

    for (const file of mdFiles) {
      const content = await readFile(join(KNOWLEDGE_BASE_DIR, file), "utf-8")
      const chunks = chunkText(content, file)

      for (const chunk of chunks) {
        allChunks.push({
          file_name: file,
          chunk_index: chunk.chunk_index,
          chunk_text: chunk.chunk_text,
          metadata: {
            source: file,
            char_length: chunk.chunk_text.length,
            word_count: chunk.chunk_text.split(/\s+/).length,
          },
        })
      }
    }

    const BATCH_SIZE = 20
    let insertedCount = 0

    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE)
      const { error } = await adminClient.from("knowledge_base").insert(batch as any)

      if (error) {
        return NextResponse.json(
          { error: `Failed to insert batch ${i}: ${error.message}`, insertedCount },
          { status: 500 }
        )
      }
      insertedCount += batch.length
    }

    return NextResponse.json({
      message: `Successfully seeded ${insertedCount} knowledge chunks from ${mdFiles.length} files`,
      chunks_inserted: insertedCount,
      files_processed: mdFiles.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
