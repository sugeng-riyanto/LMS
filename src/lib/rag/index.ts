export { generateEmbedding, generateEmbeddingsBatch } from "./embedding"
export {
  storeChunk,
  storeChunks,
  searchSimilarChunks,
  deleteFileChunks,
  getChunksByFile
} from "./vector-store"
export { querySHBCalendar } from "./calendar-search"
export type { CalendarEventResult, ConflictResult } from "./calendar-search"
export { getSyllabusSequence } from "./syllabus-search"
export { searchPastPaper, listPastPapers } from "./past-paper-search"
