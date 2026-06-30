import * as fs from "node:fs";
import * as path from "node:path";

const KNOWLEDGE_BASE_DIR = path.resolve(import.meta.dirname, "..", "knowledge-base");
const CHUNK_SIZE_WORDS = 750;
const OVERLAP_WORDS = 100;

interface Chunk {
  file_name: string;
  chunk_index: number;
  chunk_text: string;
  metadata: Record<string, unknown>;
}

function readMarkdownFiles(dir: string): { file_name: string; content: string }[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: { file_name: string; content: string }[] = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const content = fs.readFileSync(path.join(dir, entry.name), "utf-8");
      files.push({ file_name: entry.name, content });
    }
  }

  return files.sort((a, b) => a.file_name.localeCompare(b.file_name));
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  if (words.length === 0) return chunks;

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(" ");
    chunks.push(chunk);

    if (end >= words.length) break;

    start = end - overlap;
  }

  return chunks;
}

function main() {
  console.log(`Reading knowledge base from: ${KNOWLEDGE_BASE_DIR}`);
  console.log("");

  const files = readMarkdownFiles(KNOWLEDGE_BASE_DIR);
  console.log(`Found ${files.length} markdown files\n`);

  const allChunks: Chunk[] = [];

  for (const file of files) {
    const chunks = chunkText(file.content, CHUNK_SIZE_WORDS, OVERLAP_WORDS);
    console.log(`  ${file.file_name}: ${file.content.split(/\s+/).filter(Boolean).length} words → ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const metadata: Record<string, unknown> = {
        file_name: file.file_name,
        chunk_index: i,
        total_chunks: chunks.length,
        char_length: chunks[i].length,
        word_count: chunks[i].split(/\s+/).filter(Boolean).length,
      };

      allChunks.push({
        file_name: file.file_name,
        chunk_index: i,
        chunk_text: chunks[i],
        metadata,
      });
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total files processed: ${files.length}`);
  console.log(`Total chunks generated: ${allChunks.length}`);
  console.log(`Total words across all files: ${allChunks.reduce((sum, c) => sum + c.chunk_text.split(/\s+/).filter(Boolean).length, 0)}`);

  console.log(`\n=== FIRST CHUNK PREVIEW ===`);
  if (allChunks.length > 0) {
    console.log(`File: ${allChunks[0].file_name}, Chunk: ${allChunks[0].chunk_index}`);
    console.log(`Text preview: ${allChunks[0].chunk_text.slice(0, 200)}...`);
  }

  console.log(`\nIn production, these chunks would be embedded via OpenAI ADA-002
and stored in supabase knowledge_base table with pgvector.

Run with: npx tsx scripts/seed-knowledge-base.ts`);
}

main();
