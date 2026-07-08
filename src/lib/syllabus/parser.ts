export interface ParsedTopic {
  unitId: string
  topic: string
  subtopics: string[]
  objectives: string[]
}

export interface ParseResult {
  topics: ParsedTopic[]
  curriculum: string
}

function cleanLine(line: string): string {
  return line.replace(/^[䣧\s]+/, "").replace(/[\u0000-\u001f]/g, "").trim()
}

function isTopicHeader(line: string): boolean {
  return /^\d+\.\d+\s+[A-Za-z]/.test(line.trim())
}

function isTopLevelTopic(line: string): boolean {
  return /^\d+\s{2,}[A-Za-z]/.test(line.trim()) && !line.includes("Content overview") && !line.includes("Back to contents")
}

function extractObjectivesFromBlock(lines: string[], startIdx: number): string[] {
  const objectives: string[] = []
  let i = startIdx
  while (i < lines.length) {
    const line = cleanLine(lines[i])
    if (!line || line.match(/^(Core|Supplement|Candidates should|Back to|---|$)/) || isTopicHeader(line)) break
    const match = line.match(/^(\d+)[\s.䣧]+(.+)/)
    if (match) {
      const text = match[2].trim()
      if (text.length > 5 && !text.startsWith("(")) objectives.push(text)
    }
    i++
  }
  return objectives
}

function extractTKAObjectives(lines: string[]): ParsedTopic[] {
  const topics: ParsedTopic[] = []
  let currentTopic = ""
  let currentSubtopic = ""
  let currentObjectives: string[] = []
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = cleanLine(lines[i])
    if (!line) continue

    const topMatch = line.match(/^(\d+)\s{2,}(.+)/)
    if (topMatch && i > 20) {
      if (currentTopic && currentSubtopic && currentObjectives.length > 0) {
        topics.push({
          unitId: currentSubtopic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          topic: currentSubtopic,
          subtopics: [currentTopic],
          objectives: [...currentObjectives],
        })
        currentObjectives = []
      }
      currentTopic = topMatch[2].trim()
      continue
    }

    const rowMatch = line.match(/^[\d]+\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+?)(?:\s{2,}|$)/)
    if (rowMatch && currentTopic) {
      if (currentSubtopic && currentObjectives.length > 0) {
        topics.push({
          unitId: currentSubtopic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          topic: currentSubtopic,
          subtopics: [currentTopic],
          objectives: [...currentObjectives],
        })
        currentObjectives = []
      }
      currentSubtopic = rowMatch[1].trim()
      const competency = rowMatch[3].trim()
      if (competency.length > 10) currentObjectives.push(competency)
      inTable = true
      continue
    }

    const competenceMatch = line.match(/^(Menganalisis|Mengaitkan|Menerapkan|Menguraikan|Menelaah)/)
    if (competenceMatch && currentTopic) {
      currentObjectives.push(line)
    }
  }

  if (currentTopic && currentSubtopic && currentObjectives.length > 0) {
    topics.push({
      unitId: currentSubtopic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      topic: currentSubtopic,
      subtopics: [currentTopic],
      objectives: [...currentObjectives],
    })
  }

  return topics
}

function extractLowerSecObjectives(lines: string[]): ParsedTopic[] {
  const topics: ParsedTopic[] = []
  let currentUnit = ""

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const unitMatch = line.match(/^Unit\s+(\d+\.\d+)\s+(.+)/)
    if (unitMatch) {
      currentUnit = unitMatch[2].trim()
      continue
    }

    const loMatch = line.match(/^(\d+[A-Za-z]+\.\d+)\s+(.+?)(?:\s{2,}|$)/)
    if (loMatch && currentUnit) {
      const code = loMatch[1]
      const objective = loMatch[2].trim()
      const unitId = code.toLowerCase()

      const existing = topics.find(t => t.unitId === unitId)
      if (existing) {
        existing.objectives.push(objective)
      } else {
        topics.push({
          unitId,
          topic: objective.split(/[,:]/)[0].trim(),
          subtopics: [currentUnit],
          objectives: [objective],
        })
      }
    }
  }

  return topics
}

export function parseSyllabusText(text: string, subject = "PHY", grade = 10): ParseResult {
  const lines = text.split("\n")
  const topics: ParsedTopic[] = []
  let curriculum = "Cambridge"
  let inSubjectContent = false
  let currentTopic = ""
  let currentSubTopic = ""
  let currentObjectives: string[] = []
  let awaitingObjectives = false
  let format: "igcse" | "alevel" | "lowersecondary" | "tka" | "unknown" = "unknown"

  if (text.includes("Lower Secondary") || text.includes("Stage 7") || text.includes("Scheme of Work")) {
    format = "lowersecondary"
    const lsTopics = extractLowerSecObjectives(lines)
    if (lsTopics.length > 0) return { topics: lsTopics, curriculum: "Cambridge Lower Secondary" }
  }

  if (text.includes("TKA") || text.includes("Asesmen")) {
    format = "tka"
    const tkaTopics = extractTKAObjectives(lines)
    if (tkaTopics.length > 0) return { topics: tkaTopics, curriculum: "TKA" }
  }

  if (text.includes("AS & A Level") || text.includes("AS Level subject content")) {
    curriculum = "Cambridge AS & A Level"
    format = "alevel"
  } else if (text.includes("IGCSE")) {
    curriculum = "Cambridge IGCSE"
    format = "igcse"
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!inSubjectContent && line.toLowerCase().includes("subject content") && /\d/.test(line)) {
      inSubjectContent = true
      continue
    }
    if (!inSubjectContent) continue

    if (line.startsWith("---") || line.match(/^Back to contents/i) || line.includes("www.cambridge")) {
      if (currentSubTopic && currentObjectives.length > 0) {
        topics.push({
          unitId: currentSubTopic.toLowerCase().replace(/[\s.]+/g, "-").replace(/[^a-z0-9-]/g, ""),
          topic: currentSubTopic,
          subtopics: currentTopic ? [currentTopic] : [],
          objectives: [...currentObjectives],
        })
        currentObjectives = []
      }
      if (!line.startsWith("---")) continue
      inSubjectContent = false
      continue
    }

    if (isTopicHeader(line)) {
      if (currentSubTopic && currentObjectives.length > 0) {
        topics.push({
          unitId: currentSubTopic.toLowerCase().replace(/[\s.]+/g, "-").replace(/[^a-z0-9-]/g, ""),
          topic: currentSubTopic,
          subtopics: currentTopic ? [currentTopic] : [],
          objectives: [...currentObjectives],
        })
        currentObjectives = []
      }
      currentSubTopic = line.replace(/^\d+\.\d+\s+/, "")
      awaitingObjectives = true
      continue
    }

    if (isTopLevelTopic(line)) {
      currentTopic = line.replace(/^\d+\s+/, "")
      continue
    }

    if (format === "alevel" && line.includes("Candidates should be able to")) {
      awaitingObjectives = true
      continue
    }

    if (awaitingObjectives) {
      const objMatch = line.match(/^(\d+)[\s.䣧]+(.+)/)
      if (objMatch && currentSubTopic) {
        const objText = objMatch[2].trim()
        if (objText.length > 5) currentObjectives.push(objText)
      } else if (line === "" || isTopicHeader(line)) {
        awaitingObjectives = false
      }
    }
  }

  if (currentSubTopic && currentObjectives.length > 0) {
    topics.push({
      unitId: currentSubTopic.toLowerCase().replace(/[\s.]+/g, "-").replace(/[^a-z0-9-]/g, ""),
      topic: currentSubTopic,
      subtopics: currentTopic ? [currentTopic] : [],
      objectives: [...currentObjectives],
    })
  }

  return { topics, curriculum }
}

export interface DistributionResult {
  week: number
  unitId: string
  topic: string
  objectives: string[]
}

export function distributeTopics(
  topics: ParsedTopic[],
  totalWeeks = 22,
): DistributionResult[] {
  if (topics.length === 0) return []

  const totalObjectives = topics.reduce((sum, t) => sum + Math.max(t.objectives.length, 1), 0)
  const weeksPerObjective = totalWeeks / totalObjectives

  const result: DistributionResult[] = []
  let week = 1

  for (const topic of topics) {
    const objCount = Math.max(topic.objectives.length, 1)
    const topicWeeks = Math.max(1, Math.round(objCount * weeksPerObjective))

    for (let w = 0; w < topicWeeks && week <= totalWeeks; w++) {
      const startIdx = Math.floor((w / topicWeeks) * objCount)
      const endIdx = Math.floor(((w + 1) / topicWeeks) * objCount)
      const weekObjectives = topic.objectives.slice(startIdx, endIdx)

      result.push({
        week,
        unitId: topic.unitId,
        topic: topic.topic,
        objectives: weekObjectives,
      })
      week++
    }
  }

  return result
}
