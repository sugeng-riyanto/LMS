import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { callLLM } from "@/lib/agents/call-llm"

export async function POST(request: NextRequest) {
  let requestBody: any
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    requestBody = await request.json()
    const grade = requestBody.grade
    const week = requestBody.week
    const topic = requestBody.topic

    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 })
    }

    const systemPrompt = `You are a Cambridge Physics teacher at SHB Modernhill. Generate syllabus content for a Flipped Classroom lesson.

LANGUAGE REQUIREMENT: Write ALL content in fluent, grammatically correct academic English at IELTS band 7.5 or higher. Use precise physics terminology. Maintain coherence and logical flow. Minimum standard: IELTS 7.5.

Output ONLY valid JSON with these fields:
- opening_ideas: string (a provocative hook question in fluent English, 1-2 sentences, minimum IELTS 7.5)
- activity_questions: array of { question: string, bloom: "remember"|"understand"|"apply"|"analyze"|"evaluate"|"create", timing: "10 min"|"20 min" } (3 questions for Level 1-2 Productive Struggle, academic English)
- problems: array of { problem: string, level: "L1"|"L2"|"L3" } (2-3 problems, L1=sanity check, L2=mistake hunter, L3=CER challenge)`

    const prompt = `Generate flipped classroom content for:
Grade: ${grade}, Week: ${week}, Topic: ${topic}, Curriculum: Cambridge Physics`

    const { content } = await callLLM(prompt, { systemPrompt, temperature: 0.8, maxTokens: 2048 })

    const cleaned = content.replace(/```json?\s*/gi, "").replace(/```\s*$/g, "").trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      opening_ideas: parsed.opening_ideas ?? "",
      activity_questions: parsed.activity_questions ?? [],
      problems: parsed.problems ?? [],
    })
  } catch (error) {
    const ft = typeof requestBody?.topic === "string" ? requestBody.topic : "this topic"
    return NextResponse.json({
      opening_ideas: `Why is ${ft} significant in our everyday lives? Let us investigate through scientific inquiry.`,
      activity_questions: [
        { question: `What fundamental principles govern ${ft}?`, bloom: "remember", timing: "10 min" },
        { question: `How can the concepts of ${ft} be applied to solve practical problems?`, bloom: "apply", timing: "20 min" },
      ],
      problems: [
        { problem: `Explain the core principles of ${ft} using appropriate terminology.`, level: "L1" },
        { problem: `Analyse the following case study related to ${ft} and identify any conceptual errors.`, level: "L2" },
      ],
    })
  }
}
