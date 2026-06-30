import { createClient } from "../supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"

interface ChunkRow {
  id: string
  file_name: string
  chunk_index: number
  chunk_text: string
  embedding: number[]
  metadata: Record<string, unknown> | null
  created_at: string
}

function getClient(): SupabaseClient {
  return createClient()
}

export async function storeChunk(
  fileName: string,
  chunkIndex: number,
  chunkText: string,
  embedding: number[],
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getClient()
    const { error } = await supabase.from("knowledge_base").insert({
      file_name: fileName,
      chunk_index: chunkIndex,
      chunk_text: chunkText,
      embedding,
      metadata: metadata || null
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error storing chunk"
    return { success: false, error: message }
  }
}

export async function storeChunks(
  chunks: { fileName: string; chunkIndex: number; chunkText: string; embedding: number[]; metadata?: Record<string, unknown> }[]
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []

  for (const chunk of chunks) {
    const result = await storeChunk(
      chunk.fileName,
      chunk.chunkIndex,
      chunk.chunkText,
      chunk.embedding,
      chunk.metadata
    )
    if (!result.success && result.error) {
      errors.push(`[${chunk.fileName}:${chunk.chunkIndex}] ${result.error}`)
    }
  }

  return { success: errors.length === 0, errors }
}

export async function searchSimilarChunks(
  embedding: number[],
  matchCount: number = 5,
  filterMetadata?: Record<string, unknown>
): Promise<ChunkRow[]> {
  try {
    const supabase = getClient()
    const { data, error } = await supabase.rpc("match_knowledge_base", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: matchCount,
      filter_metadata: filterMetadata || null
    })

    if (error) {
      console.error("Vector search failed:", error)
      return []
    }

    return (data || []) as ChunkRow[]
  } catch (err) {
    console.error("Vector search error:", err)
    return []
  }
}

export async function deleteFileChunks(fileName: string): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from("knowledge_base")
      .delete()
      .eq("file_name", fileName)
      .select("id")

    if (error) {
      return { success: false, deleted: 0, error: error.message }
    }

    return { success: true, deleted: data?.length || 0 }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error deleting chunks"
    return { success: false, deleted: 0, error: message }
  }
}

export async function getChunksByFile(fileName: string): Promise<ChunkRow[]> {
  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("file_name", fileName)
      .order("chunk_index", { ascending: true })

    if (error) {
      console.error("Failed to get chunks:", error)
      return []
    }

    return (data || []) as ChunkRow[]
  } catch (err) {
    console.error("Get chunks error:", err)
    return []
  }
}
