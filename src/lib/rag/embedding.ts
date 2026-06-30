const EMBEDDING_DIMENSION = 1536
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function generateMockEmbedding(text: string): number[] {
  const hash = text.split("").reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0
  }, 0)

  const seed = Math.abs(hash)
  const embedding: number[] = []
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    const x = Math.sin(seed * (i + 1)) * 10000
    embedding.push(x - Math.floor(x))
  }

  const mag = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0))
  return embedding.map(v => v / mag)
}

async function openAIEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not set — using mock embedding")
    return generateMockEmbedding(text)
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
      model: OPENAI_EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSION
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI embedding error (${response.status}): ${errorBody}`)
  }

  const data = await response.json() as { data: { embedding: number[] }[] }
  return data.data[0].embedding
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    return await openAIEmbedding(text)
  } catch (error) {
    console.error("Embedding generation failed, falling back to mock:", error)
    return generateMockEmbedding(text)
  }
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return texts.map(text => generateMockEmbedding(text))
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: texts,
        model: OPENAI_EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSION
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`OpenAI batch embedding error (${response.status}): ${errorBody}`)
    }

    const data = await response.json() as { data: { embedding: number[]; index: number }[] }
    const sorted = data.data.sort((a, b) => a.index - b.index)
    return sorted.map(item => item.embedding)
  } catch (error) {
    console.error("Batch embedding failed, falling back to mock:", error)
    return texts.map(text => generateMockEmbedding(text))
  }
}
