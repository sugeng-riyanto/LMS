import type { AgentInput, LessonPlan, LessonPlanPhase } from "./agent-types"

const TOPIC_PHYSICS: Record<string, { hook: string; myth: string; phenomenon: string }> = {
  "kinematics": {
    hook: "Could a cheetah outrun a car travelling at 100 km/h? Let us calculate!",
    myth: "Many assume heavier objects fall faster — yet without air resistance, all objects accelerate at 9.8 m/s² regardless of mass.",
    phenomenon: "Why do astronauts aboard the ISS appear to float when gravity there is approximately 90% of Earth's gravity?"
  },
  "forces": {
    hook: "How does an aircraft weighing 400 tonnes remain airborne?",
    myth: "Hot air does NOT cause a balloon to rise — it is the difference in density that generates lift!",
    phenomenon: "An egg sinks in fresh water but floats in salt water — what explains this phenomenon?"
  },
  "energy": {
    hook: "Can energy truly be created? Spoiler: It cannot!",
    myth: "We do not 'consume' energy — we merely transform it from one form to another!",
    phenomenon: "A basketball dropped from a height never rebounds to its original height — where does the energy go?"
  },
  "waves": {
    hook: "How can blue whales communicate with each other across hundreds of kilometres?",
    myth: "Waves transfer energy, NOT matter — this is why a boat is not carried ashore by incoming waves.",
    phenomenon: "Why does the sky appear blue during the day but red during sunset?"
  },
  "electricity": {
    hook: "What would happen if you inserted a fork into an electrical socket? (Do not attempt!)",
    myth: "Conventional current flows from positive to negative — but electrons actually move from negative to positive!",
    phenomenon: "Why can birds perch on high-voltage power lines without being electrocuted?"
  },
  "magnetism": {
    hook: "Could we construct a train that levitates without touching the rails?",
    myth: "A compass needle points north — but this is actually the Earth's magnetic SOUTH pole!",
    phenomenon: "Why can a strong magnet cause data loss on a hard drive?"
  },
  "thermal": {
    hook: "How does a thermos flask maintain coffee temperature for up to 12 hours?",
    myth: "A jacket does not warm the body — it traps body heat and prevents it from escaping!",
    phenomenon: "Why does a beverage in an aluminium can cool faster than in a glass container?"
  },
  "pressure": {
    hook: "Why does a sharp knife cut more easily than a blunt one?",
    myth: "Drinking through a straw is not caused by 'sucking' — it is atmospheric pressure pushing the liquid upward!",
    phenomenon: "Why do our ears feel 'blocked' during aeroplane ascent and descent?"
  },
  "density": {
    hook: "Why does ice float on water when both consist of H₂O?",
    myth: "A larger object is not necessarily heavier — density is the determining factor!",
    phenomenon: "How can a steel ship float while a steel nail sinks?"
  }
}

function getTopicContent(topic: string): { hook: string; myth: string; phenomenon: string } {
  const key = topic.toLowerCase()
  for (const [k, v] of Object.entries(TOPIC_PHYSICS)) {
    if (key.includes(k)) return v
  }
  return {
    hook: `What would happen if ${topic} did not exist in our world?`,
    myth: "Let us examine a common misconception surrounding this topic.",
    phenomenon: "What observable phenomena can we investigate related to this concept?"
  }
}

export async function generateLessonPlan(input: AgentInput): Promise<LessonPlan> {
  const content = getTopicContent(input.topic)
  const gradeLabel = `Grade ${input.grade}`
  const title = `${input.topic} — ${gradeLabel} | Flipped Classroom Lesson`

  const phases: LessonPlanPhase[] = [
    {
      phase: "Entry Ticket & Hook",
      minutes: 5,
      hook_question: content.hook,
      activity: `Students complete an individual entry ticket quiz (3 multiple-choice questions) on ${input.topic}. The teacher presents the hook question and facilitates a brief class discussion. Use interactive polling to gather students' initial predictions.`,
      mythbuster_or_analogy: content.myth,
      differentiation: "Students with IEPs receive a visual concept map and the option to respond orally. Entry tickets are provided in digital format with adjustable font size."
    },
    {
      phase: "Productive Struggle",
      minutes: 20,
      activity: `Students work in heterogeneous groups of 3-4 to complete a Level 2 worksheet on ${input.topic}. Each group receives a different intentional error to identify and correct. The teacher circulates providing scaffolding prompts.`,
      group_rule: "Each member must contribute at least one idea. Use 'talking chips' — surrender a chip each time you speak. When chips are exhausted, it is another member's turn.",
      differentiation: "Support: Prompt cards with step-by-step solution frameworks are provided for groups requiring assistance. Challenge: Advanced students receive problems without answer frameworks and are asked to develop alternative solutions.",
      peer_grading_instruction: "After 15 minutes, exchange answers between groups. Use the rubric: (1) Were variables correctly identified? (2) Was the appropriate formula applied? (3) Are the units correct? Score 1-4 and provide one suggestion for improvement."
    },
    {
      phase: "CER Challenge",
      minutes: 10,
      phenomenon: content.phenomenon,
      cer_template: `CLAIM: [Answer the phenomenon question in one sentence]

EVIDENCE: [Data/calculations/results supporting the claim]
- From simulation/experiment: ...
- From calculations: ...
- From graphs/tables: ...

REASONING: [Scientific explanation of why the evidence supports the claim]
- Relevant physics concepts: ...
- Cause-and-effect relationships: ...
- Underlying principles/laws: ...`,
      activity: `The teacher presents a brief phenomenon related to ${input.topic}. Each student independently constructs a CLAIM, EVIDENCE, and REASONING argument within 10 minutes. Two volunteers present their responses for class discussion.`,
      differentiation: "Support: Sentence starters are provided ('My claim is...', 'The evidence demonstrates...', 'This occurs because...'). Challenge: Students are asked to critically evaluate weaknesses in their own reasoning."
    },
    {
      phase: "Wrap-up & Mistake Journal",
      minutes: 5,
      reflection_prompt: `Record the following in your Mistake Journal:
1. Which concept from ${input.topic} was most confusing today?
2. What errors did you make while solving problems?
3. On a scale of 1-5, how well do you understand this topic? (circle one)
4. What question do you still have for the next session?

Remember: Mistakes are evidence that you are engaging in meaningful learning.`,
      activity: `Students write a brief reflection in their digital Mistake Journal. The teacher provides a preview of next week's topic and reminds students to watch the pre-class video.`,
      differentiation: "Students may choose to write or record a voice note for their reflection. Additional prompts are provided for students who struggle to articulate their thoughts."
    }
  ]

  return {
    title,
    grade: input.grade,
    duration_minutes: 40,
    phases
  }
}
