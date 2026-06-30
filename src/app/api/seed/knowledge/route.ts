import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

const KNOWLEDGE_BASE_DIR = join(process.cwd(), "knowledge-base")

function chunkText(text: string, fileName: string, maxTokens = 500): { text: string; index: number }[] {
  const lines = text.split("\n")
  const chunks: { text: string; index: number }[] = []
  let current = ""
  let index = 0
  for (const line of lines) {
    const candidate = current ? current + "\n" + line : line
    if (candidate.length > maxTokens && current) {
      chunks.push({ text: current, index })
      index++
      current = line
    } else {
      current = candidate
    }
  }
  if (current) {
    chunks.push({ text: current, index })
  }
  return chunks
}

export async function POST() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const supabase = await createServerSupabaseClient()
    const files = readdirSync(KNOWLEDGE_BASE_DIR).filter((f) => f.endsWith(".md"))
    const allChunks: Record<string, unknown>[] = []

    for (const file of files) {
      const content = readFileSync(join(KNOWLEDGE_BASE_DIR, file), "utf-8")
      const chunks = chunkText(content, file)
      for (const chunk of chunks) {
        allChunks.push({
          file_name: file,
          chunk_index: chunk.index,
          chunk_text: chunk.text,
          embedding: null,
        })
      }
    }

    if (allChunks.length === 0) {
      return NextResponse.json({ message: "No knowledge base files found" }, { status: 404 })
    }

    const kbTable = supabase.from("knowledge_base") as any
    await kbTable.delete().gt("created_at", "2000-01-01")

    const { error: insertError } = await kbTable.insert(allChunks)
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Seeded ${allChunks.length} chunks from ${files.length} files`,
      files: files.length,
      chunks: allChunks.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
