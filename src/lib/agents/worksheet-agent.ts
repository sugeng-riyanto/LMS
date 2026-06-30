import type { AgentInput, Worksheet, WorksheetLevel, WorksheetQuestion } from "./agent-types"

const EXAM_SOURCES_BY_GRADE: Record<number, string> = {
  7: "Cambridge Checkpoint 0893",
  8: "Cambridge Checkpoint 0893",
  9: "Cambridge IGCSE 0625",
  10: "Cambridge IGCSE 0625",
  11: "Cambridge AS Level 9702",
  12: "Cambridge A Level 9702"
}

interface TopicQuestionBank {
  level1: WorksheetQuestion[]
  level2: WorksheetQuestion[]
  level3: WorksheetQuestion[]
}

const QUESTION_BANKS: Record<string, TopicQuestionBank> = {
  kinematics: {
    level1: [
      {
        id: "k1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "Which of the following is the SI unit for velocity?",
        options: ["m/s", "m/s²", "km/h", "N/kg"],
        correct: "m/s",
        explanation: "Velocity in SI is measured in metres per second (m/s). km/h is not an SI unit.",
        mark_scheme: "1 mark for correct answer (m/s)"
      },
      {
        id: "k1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "A runner covers a distance of 100 metres in 10 seconds. What is their average speed?",
        options: ["5 m/s", "10 m/s", "100 m/s", "0.1 m/s"],
        correct: "10 m/s",
        explanation: "v = s/t = 100/10 = 10 m/s",
        mark_scheme: "1 mark for correct answer (10 m/s)"
      },
      {
        id: "k1-03",
        type: "short_answer",
        bloom: "remember",
        question: "What is the main difference between distance and displacement?",
        mark_scheme: "1 mark: distance is a scalar quantity (magnitude only), displacement is a vector quantity (magnitude and direction). 1 mark: stating that distance = total path length, displacement = final position − initial position."
      }
    ],
    level2: [
      {
        id: "k2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "A car travels at a constant velocity of 20 m/s for 5 seconds, then accelerates at 2 m/s² for 3 seconds. Calculate:\n\na) The total distance travelled by the car\nb) The final velocity of the car\nc) Draw a velocity-time graph for this motion\n\nInstruction: This question contains an INTENTIONAL ERROR in a particular step — find and correct it!",
        intentional_error: "In step (a), if the student fails to distinguish between uniform linear motion (constant velocity) and uniformly accelerated linear motion, and uses the formula s = vt for the entire motion, the result will be incorrect. The constant-velocity segment (20 m/s × 5 s = 100 m) must be separated from the accelerated segment (s = v₀t + ½at² = 20×3 + ½×2×9 = 60 + 9 = 69 m).",
        solution_steps: [
          "Constant velocity segment: s₁ = v × t₁ = 20 × 5 = 100 m",
          "Accelerated segment: v₀ = 20 m/s, a = 2 m/s², t₂ = 3 s",
          "s₂ = v₀t + ½at² = 20(3) + ½(2)(9) = 60 + 9 = 69 m",
          "s_total = s₁ + s₂ = 100 + 69 = 169 m",
          "Final velocity: v = v₀ + at = 20 + 2(3) = 26 m/s",
          "Graph: horizontal line at 20 m/s from t=0 to t=5, then a straight line rising to 26 m/s from t=5 to t=8"
        ],
        mark_scheme: "a) 2 marks: s_total = 169 m. b) 1 mark: v = 26 m/s. c) 2 marks: correct graph with labelled axes and appropriate scale. 1 mark: identifying the intentional error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[10]} October 2023 Paper 2 Variant 2 (adapted)`
      },
      {
        id: "k2-02",
        type: "long_answer",
        bloom: "analyze",
        question: "Two cars, A and B, move towards each other. Car A moves with a velocity of 15 m/s from the left, and car B moves with a velocity of 10 m/s from the right. The initial distance between the two cars is 500 metres.\n\na) When and where will the two cars meet?\nb) If car A starts moving 2 seconds earlier, how does the meeting time change?\n\n⚠️ This question contains an intentional error in the provided solution — find it!",
        intentional_error: "Common mistake: adding velocities without considering relative direction. Also, in part (b), students often forget to account for the 2-second delay when A has already started moving but B has not.",
        solution_steps: [
          "a) Relative velocity = v_A + v_B = 15 + 10 = 25 m/s (approaching each other)",
          "Time to meet: t = s / v_rel = 500 / 25 = 20 s",
          "Position from A: s_A = 15 × 20 = 300 m from the left",
          "Position from B: s_B = 10 × 20 = 200 m from the right",
          "b) In 2 seconds, A travels 15 × 2 = 30 m",
          "Remaining distance = 500 − 30 = 470 m",
          "Remaining time = 470 / 25 = 18.8 s",
          "Total time from A's start = 2 + 18.8 = 20.8 s"
        ],
        mark_scheme: "a) 2 marks: t = 20 s, position = 300 m from A. b) 2 marks: t = 20.8 s. 1 mark: identifying the error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[10]} March 2023 Paper 4 Variant 1 (adapted)`
      }
    ],
    level3: [
      {
        id: "k3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: A tennis ball and a bowling ball are dropped from the same height simultaneously. The bowling ball reaches the ground first.\n\nCER Task:\nCLAIM: Is this statement physically correct or incorrect? Explain!\nEVIDENCE: Support your claim with physical laws and calculations (ignore air resistance for simplification).\nREASONING: If there is a difference in time, what factors cause it? If there should not be one, why do everyday observations often show different results?\n\nEvaluate the limitations of this experiment as a physics model!",
        phenomenon: "A bowling ball is heavier than a tennis ball, but in a vacuum both fall together.",
        mark_scheme: "CLAIM (2 marks): States whether correct or incorrect with scientific justification. EVIDENCE (3 marks): Uses h = ½gt², calculates fall time — without air resistance, mass does not affect time. REASONING (3 marks): Air causes resistance — the tennis ball is lighter and more affected. Evaluation of limitations (2 marks): The model ignores significant air resistance for lightweight objects.",
        model_answer: "CLAIM: In physics, this statement is incorrect in a vacuum — both balls would fall together. However, in the real world, air resistance causes a small difference.\n\nEVIDENCE: h = ½gt² → t = √(2h/g). Gravitational acceleration g = 9.8 m/s² is CONSTANT for all objects. Mass does not appear in the formula — therefore fall time does NOT depend on mass.\n\nREASONING: In air, the tennis ball has a larger surface area-to-mass ratio, making air resistance more significant. This slows the tennis ball down. The basic physics model (without air resistance) is an idealisation — it is useful for understanding fundamental principles but is not perfect for predicting real-world situations.",
        derivation_method: "h = ½gt² → t = √(2h/g). Gravitational acceleration g = 9.8 m/s² for all masses. Experimental evidence: Apollo 15 — a feather and a hammer fell together on the Moon."
      }
    ]
  },
  forces: {
    level1: [
      {
        id: "f1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "Newton's First Law is also known as the law of...",
        options: ["Action-Reaction", "Inertia", "Acceleration", "Gravity"],
        correct: "Inertia",
        explanation: "Newton's First Law states that objects tend to maintain their state (at rest or in uniform straight-line motion) — known as the law of inertia.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "f1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "A 2 kg book is placed on a table. What is the magnitude of the normal force acting on the book? (g = 9.8 m/s²)",
        options: ["0 N", "2 N", "19.6 N", "9.8 N"],
        correct: "19.6 N",
        explanation: "Normal force = weight = m × g = 2 × 9.8 = 19.6 N (upward).",
        mark_scheme: "1 mark for correct answer with unit"
      },
      {
        id: "f1-03",
        type: "short_answer",
        bloom: "understand",
        question: "State and describe three types of frictional force!",
        mark_scheme: "1 mark for each type of frictional force correctly stated and described: (1) Static friction — stationary objects, (2) Kinetic friction — moving objects, (3) Rolling friction — objects that roll."
      }
    ],
    level2: [
      {
        id: "f2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "A 5 kg block is pulled with a horizontal force of 30 N across a rough surface. The coefficient of kinetic friction between the block and the surface is 0.2. (g = 10 m/s²)\n\na) Draw a free body diagram of the block.\nb) Calculate the acceleration of the block.\nc) How far will the block travel in 4 seconds if the force is applied continuously?\n\nNote: This question contains an intentional error — verify whether all forces have been accounted for.",
        intentional_error: "Students frequently neglect to calculate the normal force first (N = mg), then the frictional force (f = μN), leading to an overestimated acceleration. They also commonly forget that friction opposes motion and reduces the net force.",
        solution_steps: [
          "Identify forces: Applied force = 30 N (horizontal), Weight = mg = 50 N (downward), Normal reaction (upward) = Weight = 50 N, Friction = μ × N = 0.2 × 50 = 10 N (opposing motion)",
          "ΣF_x = Applied − Friction = 30 − 10 = 20 N",
          "a = ΣF / m = 20 / 5 = 4 m/s²",
          "s = v₀t + ½at² = 0 + ½(4)(16) = 32 m",
          "FBD: rightward arrow (30 N), leftward arrow (10 N), upward arrow (50 N), downward arrow (50 N)"
        ],
        mark_scheme: "a) 2 marks: correct FBD with 4 forces. b) 2 marks: a = 4 m/s². c) 1 mark: s = 32 m. 1 mark: identifying the error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[10]} IGCSE 0625 May 2023 Paper 3 (adapted)`
      }
    ],
    level3: [
      {
        id: "f3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: A car travelling at 72 km/h brakes suddenly and comes to a stop after travelling 40 metres.\n\nCER Task:\nCLAIM: Will the braking distance be longer or shorter if the car carries a 500 kg load? Explain using the concepts of force, mass, and acceleration!\nEVIDENCE: Use Newton's Second Law to support your claim.\nREASONING: Explain what factors affect braking distance in the real world — do not limit yourself to mass alone!",
        phenomenon: "A fully loaded car requires a longer braking distance than an empty car.",
        mark_scheme: "CLAIM (2 marks): Correctly states the effect of mass on braking distance with full justification. EVIDENCE (3 marks): Uses F = ma, with constant braking force F, if m increases then a (deceleration) decreases. Additionally uses the formula v² = u² + 2as. REASONING (3 marks): Other factors — tyre condition, road surface, initial speed, weather, ABS system. 2 marks for critical evaluation.",
        model_answer: "CLAIM: The braking distance will be LONGER if the car carries a 500 kg load.\n\nEVIDENCE: F = ma → a = F/m. The maximum braking force is relatively constant (limited by tyre-road friction). If mass increases from m to m+500, the acceleration (deceleration) decreases. v² = u² + 2as, with v=0 then s = −u²/(2a). If a is smaller, s is larger.\n\nEvaluation: This model assumes constant braking force. In the real world, greater mass → greater normal force → greater maximum frictional force (f = μN). Therefore the relationship is not a simple linear one. Wet roads, tyre condition, and the ABS system also have significant effects.",
        derivation_method: "v² = u² + 2as. v = 0, u = 72 km/h = 20 m/s, s = 40 m. 0 = 400 + 2a(40) → a = −5 m/s². Braking force F = ma = 1500 × 5 = 7500 N (for a car mass of ~1500 kg)."
      }
    ]
  },
  energy: {
    level1: [
      {
        id: "e1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "The Law of Conservation of Energy states that...",
        options: [
          "Energy can be created and destroyed",
          "Energy cannot be created or destroyed, it can only be converted from one form to another",
          "Energy always decreases over time",
          "Energy exists in only one form"
        ],
        correct: "Energy cannot be created or destroyed, it can only be converted from one form to another",
        explanation: "The Law of Conservation of Energy: the total energy in an isolated system remains constant.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "e1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "A ball of mass 0.5 kg is dropped from a height of 10 m. What is the gravitational potential energy of the ball at the top? (g = 10 m/s²)",
        options: ["5 J", "50 J", "0.5 J", "500 J"],
        correct: "50 J",
        explanation: "GPE = mgh = 0.5 × 10 × 10 = 50 J",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "e1-03",
        type: "short_answer",
        bloom: "understand",
        question: "Give 3 examples of energy transformations in everyday life! Identify the initial and final forms of energy!",
        mark_scheme: "1 mark per correct example. Examples: (1) Lamp — electrical energy → light + heat, (2) Fan — electrical → kinetic, (3) Food — chemical → heat + motion."
      }
    ],
    level2: [
      {
        id: "e2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "A roller coaster of mass 500 kg starts from point A at a height of 40 m. The track forms a vertical loop with a radius of 10 m at the lowest point. (g = 10 m/s², ignore friction)\n\na) Calculate the velocity of the roller coaster at the lowest point (point B)!\nb) Calculate the velocity of the roller coaster at the top of the loop (point C)! \nc) Will the roller coaster reach point C? Prove with calculations!\n\n⚠️ Intentional error: In step (b), note that point C is at a height of 20 m from point B, not 40 m!",
        intentional_error: "Students often incorrectly use h = 40 m for all calculations, failing to recognise that point C is only 20 m below point B (diameter of the circle is 20 m). They also neglect the principle that gravitational potential energy at A is converted into both kinetic energy and potential energy at each subsequent point.",
        solution_steps: [
          "a) PE_A = mgh_A = 500 × 10 × 40 = 200,000 J",
          "At B: PE_B = 0 (reference), KE_B = PE_A = 200,000 J",
          "½mv_B² = 200,000 → v_B² = 800 → v_B = 28.28 m/s",
          "b) At C: height = 20 m (diameter of the circle = 2R = 20 m)",
          "PE_C = mgh_C = 500 × 10 × 20 = 100,000 J",
          "KE_C = PE_A − PE_C = 200,000 − 100,000 = 100,000 J",
          "½mv_C² = 100,000 → v_C² = 400 → v_C = 20 m/s",
          "c) Condition to reach the top of the loop: v_min = √(gR) = √(10×10) = 10 m/s",
          "v_C = 20 m/s > 10 m/s, so the roller coaster safely reaches point C."
        ],
        mark_scheme: "a) 2 marks: v_B = 28.28 m/s. b) 2 marks: v_C = 20 m/s. c) 2 marks: comparison with v_min and conclusion. 1 mark: identifying the error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[11]} AS Level 9702 November 2022 Paper 4 (adapted)`
      }
    ],
    level3: [
      {
        id: "e3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: A ball is dropped from a height of 2 metres. After bouncing, the ball only reaches a height of 1.2 metres.\n\nCER Task:\nCLAIM: Is energy lost when the ball bounces? Where does the energy go?\nEVIDENCE: Calculate the potential energy before and after the bounce. Determine the percentage of energy that is 'lost'.\nREASONING: Explain the concept of energy conservation — if energy is not lost, into what form does it transform? Evaluate the 'perfect ball' model versus the 'real ball' model!",
        phenomenon: "The ball bounces lower each time it touches the ground.",
        mark_scheme: "CLAIM (2 marks): Energy is NOT lost — it transforms into other forms. EVIDENCE (2 marks): Initial PE = mgh₁, final PE = mgh₂, calculate the ratio and percentage. REASONING (3 marks): Energy transforms into heat at the point of impact + sound. Evaluation (3 marks): Ideal ball model (perfect bounce) versus real ball (inelastic), coefficient of restitution.",
        model_answer: "CLAIM: Energy is not lost — mechanical energy is transformed into heat and sound during the collision.\n\nEVIDENCE: Initial PE = m × 9.8 × 2 = 19.6m J. Final PE = m × 9.8 × 1.2 = 11.76m J. Percentage of mechanical energy remaining = 11.76 / 19.6 × 100% = 60%. 'Lost' 40%.\n\nREASONING: The law of conservation of energy still applies. The energy 'lost' from PE transforms into: (1) heat — the molecules of the ball and floor vibrate more rapidly, (2) sound — sound waves. The ideal ball model ignores deformation and heating — this is a useful simplification for initial calculations but is inaccurate for real-world situations. Coefficient of restitution e = √(h₂/h₁) = √(1.2/2) = 0.775.",
        derivation_method: "PE = mgh. Ratio of final/initial PE = h₂/h₁ (mass is the same, g is the same). Percentage 'loss' = (1 − h₂/h₁) × 100% = 40%."
      }
    ]
  }
}

function findBank(topic: string): { bank: TopicQuestionBank; label: string } {
  const key = topic.toLowerCase()
  for (const [k, v] of Object.entries(QUESTION_BANKS)) {
    if (key.includes(k)) return { bank: v, label: k.charAt(0).toUpperCase() + k.slice(1) }
  }
  return {
    bank: {
      level1: [
        {
          id: "gen-l1-01",
          type: "multiple_choice",
          bloom: "remember",
          question: `What is the main concept in the topic of ${topic}?`,
          options: ["Concept A", "Concept B", "Concept C", "Concept D"],
          correct: "Concept A",
          explanation: "A brief explanation of the main concept.",
          mark_scheme: "1 mark"
        }
      ],
      level2: [],
      level3: []
    },
    label: topic
  }
}

export async function generateWorksheet(input: AgentInput): Promise<Worksheet> {
  const { bank, label } = findBank(input.topic)
  const examRef = EXAM_SOURCES_BY_GRADE[input.grade] || "Cambridge IGCSE 0625"

  const levels: WorksheetLevel[] = [
    {
      level: 1,
      name: "Sanity Check",
      minutes: 10,
      questions: bank.level1.map(q => ({
        ...q,
        bloom: q.bloom as "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create"
      }))
    },
    {
      level: 2,
      name: "Productive Struggle",
      minutes: 20,
      questions: bank.level2.map(q => ({
        ...q,
        bloom: "analyze",
        exam_source: q.exam_source?.replace("adapted", `adapted for Grade ${input.grade} ${input.syllabus_ref}`)
      }))
    },
    {
      level: 3,
      name: "CER Challenge",
      minutes: 10,
      questions: bank.level3.map(q => ({
        ...q,
        bloom: "evaluate"
      }))
    }
  ]

  const title = `${label} — ${examRef} | Leveled Worksheet (Grade ${input.grade})`

  return { title, levels }
}
