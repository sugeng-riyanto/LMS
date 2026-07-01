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
  },
  waves: {
    level1: [
      {
        id: "w1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "Which of the following correctly describes a transverse wave?",
        options: [
          "Particles vibrate parallel to the direction of wave propagation",
          "Particles vibrate perpendicular to the direction of wave propagation",
          "Particles do not vibrate at all",
          "Particles move in a circular motion"
        ],
        correct: "Particles vibrate perpendicular to the direction of wave propagation",
        explanation: "In a transverse wave, particle displacement is perpendicular to the wave direction. Light is an example of a transverse wave.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "w1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "A wave has a frequency of 50 Hz and a wavelength of 2 m. What is its speed?",
        options: ["25 m/s", "52 m/s", "100 m/s", "0.04 m/s"],
        correct: "100 m/s",
        explanation: "v = fλ = 50 × 2 = 100 m/s",
        mark_scheme: "1 mark for correct answer with unit"
      },
      {
        id: "w1-03",
        type: "short_answer",
        bloom: "understand",
        question: "State two differences between transverse waves and longitudinal waves. Give one example of each.",
        mark_scheme: "1 mark: transverse — particles vibrate perpendicular to wave direction (e.g., light, water waves). 1 mark: longitudinal — particles vibrate parallel to wave direction (e.g., sound)."
      }
    ],
    level2: [
      {
        id: "w2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "A student generates waves in a slinky by oscillating one end. The slinky is 6 m long. The student counts 12 complete oscillations in 6 seconds, and observes that there are exactly 3 complete waves along the length of the slinky at any moment.\n\na) Calculate the frequency of the wave.\nb) Calculate the wavelength of the wave.\nc) Calculate the wave speed.\nd) If the student doubles the oscillation frequency, what happens to the wavelength? Explain.\n\n⚠️ Intentional error: In part (d), many students incorrectly assume wave speed changes when frequency increases.",
        intentional_error: "Students often forget that wave speed is determined by the medium, not the source. Doubling the frequency halves the wavelength (v = fλ, v constant).",
        solution_steps: [
          "a) f = number of oscillations / time = 12 / 6 = 2 Hz",
          "b) 3 complete waves along 6 m → λ = 6 / 3 = 2 m",
          "c) v = fλ = 2 × 2 = 4 m/s",
          "d) Wave speed in the slinky is constant (same medium). v = fλ → if f doubles, λ must halve to keep v constant. New λ = 2 / 2 = 1 m"
        ],
        mark_scheme: "a) 1 mark: f = 2 Hz. b) 1 mark: λ = 2 m. c) 1 mark: v = 4 m/s. d) 2 marks: correct explanation that v is constant, λ halves. 1 mark: identifying the intentional error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[7]} Checkpoint 0893 Paper 2 (adapted)`
      }
    ],
    level3: [
      {
        id: "w3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: A student notices that when she drops a stone into a still pond, the ripples spread outward in circular patterns. A piece of leaf floating on the surface bobs up and down but does not move outward with the ripples.\n\nCER Task:\nCLAIM: Does the water itself travel outward from where the stone was dropped, or does something else travel? Explain!\nEVIDENCE: Use the wave equation and the concept of energy transfer to support your claim.\nREASONING: If waves do not transport matter, what do they transport? Evaluate the difference between wave motion and particle motion in this context.",
        phenomenon: "A floating leaf bobs up and down but does not move outward with the ripples.",
        mark_scheme: "CLAIM (2 marks): States that waves transfer energy, not matter. EVIDENCE (3 marks): The leaf stays in place — only the energy propagates outward. Uses v = fλ and describes particle motion as oscillation. REASONING (3 marks): Waves transport energy through a medium without net displacement of the medium. Evaluation (2 marks): Difference between particle velocity and wave velocity; the medium particles oscillate about equilibrium but do not travel with the wave.",
        model_answer: "CLAIM: Water waves transfer energy outward from the disturbance, but the water itself does not travel. The leaf bobs up and down because the water particles oscillate about their equilibrium positions rather than moving outward.\n\nEVIDENCE: The leaf remains at approximately the same position on the pond surface — it moves up and down (perpendicular to the wave direction for transverse waves) but does not drift outward. Energy is transferred through the water via particle-to-particle interaction. v = fλ describes the wave speed, which depends on the medium (water depth, density).\n\nREASONING: In wave motion, the medium's particles oscillate about a fixed equilibrium position. Energy is transferred because each particle passes its energy to the neighbouring particle. This is fundamentally different from the flow of matter. Real water waves are actually a combination of transverse and longitudinal motion (circular orbitals), but the net displacement of any water particle over one full cycle is zero.",
        derivation_method: "Wave speed v = fλ. For water waves, v depends on depth: v = √(gd) for shallow water waves."
      }
    ]
  },
  electric: {
    level1: [
      {
        id: "el1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "What is the SI unit of electric current?",
        options: ["Volt", "Ohm", "Ampere", "Watt"],
        correct: "Ampere",
        explanation: "Electric current is measured in amperes (A). 1 A = 1 C/s.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "el1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "A 6 V battery is connected across a 3 Ω resistor. What is the current flowing through the resistor?",
        options: ["0.5 A", "2 A", "18 A", "3 A"],
        correct: "2 A",
        explanation: "I = V/R = 6/3 = 2 A (Ohm's Law)",
        mark_scheme: "1 mark for correct answer with unit"
      },
      {
        id: "el1-03",
        type: "short_answer",
        bloom: "understand",
        question: "Explain the difference between a series circuit and a parallel circuit in terms of current flow and voltage distribution.",
        mark_scheme: "1 mark: in a series circuit, the same current flows through all components and voltage is divided. 1 mark: in a parallel circuit, voltage is the same across all branches and current is divided."
      }
    ],
    level2: [
      {
        id: "el2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "Three resistors, 4 Ω, 6 Ω, and 12 Ω, are connected in parallel across a 24 V power supply.\n\na) Calculate the total resistance of the circuit.\nb) Calculate the current drawn from the power supply.\nc) Calculate the current through the 6 Ω resistor.\nd) If the 12 Ω resistor blows (becomes an open circuit), what happens to the total current? Explain.\n\n⚠️ Intentional error: In part (a), many students incorrectly add parallel resistances as R_total = R₁ + R₂ + R₃.",
        intentional_error: "Students often confuse series and parallel resistance formulas. For parallel: 1/R_total = 1/R₁ + 1/R₂ + 1/R₃, NOT R_total = R₁ + R₂ + R₃.",
        solution_steps: [
          "a) 1/R_total = 1/4 + 1/6 + 1/12 = 3/12 + 2/12 + 1/12 = 6/12 = 1/2 → R_total = 2 Ω",
          "b) I_total = V / R_total = 24 / 2 = 12 A",
          "c) Voltage across 6 Ω resistor = 24 V (parallel). I₆ = 24 / 6 = 4 A",
          "d) New 1/R_total = 1/4 + 1/6 = 3/12 + 2/12 = 5/12 → R_total = 2.4 Ω. I_total = 24 / 2.4 = 10 A. Current decreases from 12 A to 10 A."
        ],
        mark_scheme: "a) 2 marks: R_total = 2 Ω with correct working. b) 1 mark: I = 12 A. c) 1 mark: I₆ = 4 A. d) 2 marks: correct calculation and explanation. 1 mark: identifying the intentional error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[7]} Checkpoint 0893 Paper 2 (adapted)`
      }
    ],
    level3: [
      {
        id: "el3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: When you plug too many appliances into a single power strip, the circuit breaker sometimes 'trips' (switches off).\n\nCER Task:\nCLAIM: What causes the circuit breaker to trip when too many appliances are connected? Explain in terms of electrical quantities!\nEVIDENCE: Use Ohm's Law and the relationship between power, current, and voltage to support your claim.\nREASONING: Explain why circuit breakers are important safety devices. Evaluate the difference between connecting appliances in series versus parallel in a home.",
        phenomenon: "Plugging too many appliances into one outlet causes the circuit breaker to trip.",
        mark_scheme: "CLAIM (2 marks): Correctly identifies that total current exceeds the rated limit. EVIDENCE (3 marks): Appliances in parallel → each draws current → total current = sum of individual currents. P = IV → more appliances → more total power → more current. REASONING (3 marks): Circuit breakers protect wires from overheating. Parallel connections ensure each appliance gets full voltage. Evaluation (2 marks): Series connections would divide voltage and reduce current but appliances would not operate correctly.",
        model_answer: "CLAIM: When too many appliances are connected in parallel, the total current drawn from the supply exceeds the circuit breaker's rated limit, causing it to trip.\n\nEVIDENCE: In a home, appliances are connected in parallel — each receives the full mains voltage (230 V). Each appliance draws current I = P/V. Total current I_total = I₁ + I₂ + I₃ + ... (parallel circuit). When I_total exceeds the circuit breaker rating (e.g., 10 A), the breaker 'trips' to interrupt the circuit.\n\nREASONING: Circuit breakers are safety devices that prevent overheating of wires (I²R heating). If current exceeds safe levels, wires can melt or cause fires. Series connections would cause all appliances to share the voltage (voltage divider), so each would receive less than the rated voltage and operate incorrectly. Parallel connection is the standard for household wiring because it ensures each appliance receives the correct voltage.",
        derivation_method: "P = IV → I = P/V. For parallel resistors: 1/R_total = 1/R₁ + 1/R₂ + ... I_total = V/R_total = I₁ + I₂ + ..."
      }
    ]
  },
  magnetism: {
    level1: [
      {
        id: "m1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "Which of the following materials is ferromagnetic and can be permanently magnetised?",
        options: ["Copper", "Iron", "Aluminium", "Plastic"],
        correct: "Iron",
        explanation: "Iron is a ferromagnetic material that can be permanently magnetised. Copper and aluminium are non-magnetic.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "m1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "If the north pole of a bar magnet is brought near the north pole of another bar magnet, what will happen?",
        options: ["They will attract", "They will repel", "Nothing will happen", "They will lose their magnetism"],
        correct: "They will repel",
        explanation: "Like poles repel. North-north or south-south poles push each other apart.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "m1-03",
        type: "short_answer",
        bloom: "remember",
        question: "Describe two methods that can be used to increase the strength of an electromagnet.",
        mark_scheme: "1 mark per method: (1) Increase the number of coils/windings. (2) Increase the electric current. (3) Use a soft iron core. (Any two.)"
      }
    ],
    level2: [
      {
        id: "m2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "A student constructs an electromagnet by wrapping 50 turns of wire around an iron nail and connecting it to a 3 V battery. The electromagnet picks up 8 paper clips.\n\na) Suggest two modifications the student could make to pick up more paper clips, and explain the physics behind each.\nb) If the student reverses the battery connections, what will happen? Explain.\nc) What would happen if the student replaces the iron nail with a wooden rod? Explain.\n\n⚠️ Intentional error: Some students think reversing the battery reverses the magnetic poles but does NOT affect the strength.",
        intentional_error: "Students may believe reversing battery polarity changes the strength of the electromagnet. It only reverses the magnetic poles (north/south swap) — the strength remains the same.",
        solution_steps: [
          "a) Modification 1: Increase the number of coil turns (more turns → stronger magnetic field). Modification 2: Increase voltage/current (higher current → stronger magnetic field).",
          "b) Reversing the battery reverses the direction of current flow, which reverses the magnetic poles (north becomes south, south becomes north). The strength stays the same.",
          "c) Iron is a ferromagnetic material that concentrates the magnetic field. Wood is non-magnetic — the magnetic field would be much weaker, and the electromagnet would pick up fewer (or zero) paper clips."
        ],
        mark_scheme: "a) 2 marks: correct modifications with physics explanation. b) 1 mark: poles reverse, strength unchanged. c) 2 marks: iron core concentrates field, wood does not. 1 mark: identifying the intentional error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[7]} Checkpoint 0893 Paper 1 (adapted)`
      }
    ],
    level3: [
      {
        id: "m3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: A maglev (magnetic levitation) train hovers above the track without touching it, allowing extremely high-speed travel with no friction.\n\nCER Task:\nCLAIM: Explain how maglev trains use magnetism to achieve levitation and propulsion. Can a maglev train work with permanent magnets alone?\nEVIDENCE: Use the principles of magnetic poles (attraction/repulsion) and electromagnets to support your claim.\nREASONING: Compare the advantages and limitations of using permanent magnets versus electromagnets in maglev systems. Evaluate why maglev trains are not yet widely adopted globally.",
        phenomenon: "Maglev trains float above the track using magnetic fields, eliminating friction.",
        mark_scheme: "CLAIM (2 marks): Explains basic principle of magnetic levitation (like poles repel or electromagnets create lift). EVIDENCE (3 marks): Like poles repel, opposite poles attract. Electromagnets can be controlled and switched. Permanent magnets provide constant field. REASONING (3 marks): Electromagnets allow controlled lift and propulsion. Permanent magnets alone cannot easily provide both levitation and stability. Evaluation (2 marks): High infrastructure cost, need for specialised tracks, energy consumption of electromagnets.",
        model_answer: "CLAIM: Maglev trains use magnetic repulsion between electromagnets on the train and conducting coils in the track to achieve levitation. Propulsion is achieved by alternating the magnetic field polarity — the train is 'pulled' forward. Pure permanent magnets could provide levitation but would lack the control and propulsion needed for practical operation.\n\nEVIDENCE: Like magnetic poles repel — this is the fundamental principle. Electromagnets have a key advantage: their polarity and strength can be controlled by varying current direction and magnitude. The German Transrapid system uses electromagnetic suspension (EMS — attractive force), while the Japanese SC Maglev uses electrodynamic suspension (EDS — repulsive force from superconducting magnets).\n\nREASONING: Permanent magnets provide a constant magnetic field — useful for basic levitation but impossible to turn off or adjust. Electromagnets can be switched on/off, their strength adjusted, and polarity reversed — essential for controlled propulsion and stabilisation. Maglev adoption is limited by: (1) enormous infrastructure cost ($50–100 million per km), (2) incompatibility with existing rail networks, (3) high energy consumption for superconducting magnets.",
        derivation_method: "Lorentz force: F = qvB. Magnetic field strength B = μ₀nI for a solenoid. Levitation force must exceed weight: F_mag ≥ mg."
      }
    ]
  },
  density: {
    level1: [
      {
        id: "d1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "What is the formula for calculating density?",
        options: ["Density = mass × volume", "Density = mass / volume", "Density = volume / mass", "Density = mass + volume"],
        correct: "Density = mass / volume",
        explanation: "Density (ρ) = mass (m) / volume (V). SI unit is kg/m³.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "d1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "A block has a mass of 200 g and a volume of 100 cm³. What is its density?",
        options: ["0.5 g/cm³", "2 g/cm³", "20,000 g/cm³", "200 g/cm³"],
        correct: "2 g/cm³",
        explanation: "ρ = m/V = 200 / 100 = 2 g/cm³",
        mark_scheme: "1 mark for correct answer with unit"
      },
      {
        id: "d1-03",
        type: "short_answer",
        bloom: "understand",
        question: "Ice floats on water. What does this tell you about the relative densities of ice and water? Explain why ice is less dense even though it is the same substance.",
        mark_scheme: "1 mark: ice has a lower density than water (about 0.92 g/cm³ vs 1.0 g/cm³). 1 mark: water expands when it freezes (the crystal structure of ice has more space between molecules), so the same mass occupies a larger volume → lower density."
      }
    ],
    level2: [
      {
        id: "d2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "A student is given a 50 g irregularly shaped stone, a measuring cylinder, and water.\n\na) Describe how the student can determine the volume of the stone.\nb) The measuring cylinder initially contains 30 cm³ of water. After submerging the stone, the water level rises to 48 cm³. Calculate the density of the stone.\nc) The student then dries the stone and places it in a beaker containing 50 cm³ of cooking oil (density = 0.92 g/cm³). Will the stone float or sink in the oil? Prove your answer with calculations.\n\n⚠️ Intentional error: Some students forget to subtract the initial water volume when calculating the stone's volume.",
        intentional_error: "Students often incorrectly record the final volume reading (48 cm³) as the stone's volume instead of calculating the difference (48 − 30 = 18 cm³).",
        solution_steps: [
          "a) Fill the measuring cylinder with a known volume of water. Carefully submerge the stone completely. The increase in water level equals the stone's volume.",
          "b) Volume of stone = 48 − 30 = 18 cm³. Density = 50 / 18 = 2.78 g/cm³",
          "c) Density of stone = 2.78 g/cm³. Density of oil = 0.92 g/cm³. Since the stone's density is greater than the oil's density, the stone will SINK in the oil."
        ],
        mark_scheme: "a) 2 marks: correct method (water displacement). b) 2 marks: V = 18 cm³, ρ = 2.78 g/cm³. c) 1 mark: correct comparison and conclusion. 1 mark: identifying the intentional error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[7]} Cambridge Checkpoint 0893 Paper 3 (adapted)`
      }
    ],
    level3: [
      {
        id: "d3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: A steel ship weighing thousands of tonnes floats on water, yet a small steel nail sinks immediately.\n\nCER Task:\nCLAIM: Explain how a massive steel ship can float while a tiny steel nail sinks. What determines whether an object floats or sinks?\nEVIDENCE: Use the concept of density, buoyant force (Archimedes' principle), and the shape of the ship to support your claim.\nREASONING: The ship's hull is made of steel, but the overall density of the ship is different from the density of steel. Explain why. Evaluate the engineering principles that allow ships to carry heavy cargo while remaining afloat.",
        phenomenon: "A large steel ship floats while a small steel nail sinks.",
        mark_scheme: "CLAIM (2 marks): An object floats if its average density is less than the density of the fluid. EVIDENCE (3 marks): Archimedes' principle — buoyant force = weight of fluid displaced. The ship's hull encloses a large volume of air → overall density of the ship < density of water. The nail is solid steel → density of nail > density of water. REASONING (3 marks): The ship's average density = total mass (steel + cargo + air) / total volume (steel + air spaces). The air inside the hull significantly reduces the average density. Evaluation (2 marks): Ship design must balance cargo capacity, hull strength, and stability. Displacement, freeboard, and centre of buoyancy are critical engineering considerations.",
        model_answer: "CLAIM: Whether an object floats or sinks depends on its AVERAGE density compared to the density of the fluid. The steel ship floats because its overall density (including the air inside the hull) is less than water's density. The solid steel nail has a density of approximately 7.8 g/cm³, which is greater than water's 1.0 g/cm³, so it sinks.\n\nEVIDENCE: Archimedes' principle states that the buoyant force on an object equals the weight of the fluid it displaces. For the ship: the hull shape displaces a large volume of water. The weight of this displaced water equals many tonnes — enough to counterbalance the ship's weight. The ship's average density = (mass of steel hull + cargo) / (hull volume). Since the hull contains large air-filled spaces, the denominator is large → average density < 1 g/cm³. For the nail: the nail's density = mass of steel / volume of steel ≈ 7.8 g/cm³ > 1.0 g/cm³ → sinks.\n\nREASONING: Submarines control their average density by taking in or expelling water (ballast tanks) — they can float on the surface, submerge, or maintain neutral buoyancy. The same principle applies to fish with swim bladders. Engineering considerations: the hull must be strong enough to withstand water pressure, stable enough not to capsize, and shaped to minimise drag.",
        derivation_method: "Archimedes' principle: F_b = ρ_fluid × V_displaced × g. Condition for floating: ρ_object < ρ_fluid. Average density = total mass / total volume."
      }
    ]
  },
  pressure: {
    level1: [
      {
        id: "p1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "What is the formula for pressure?",
        options: ["Pressure = force × area", "Pressure = force / area", "Pressure = area / force", "Pressure = mass × acceleration"],
        correct: "Pressure = force / area",
        explanation: "Pressure (P) = force (F) / area (A). SI unit is pascal (Pa) or N/m².",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "p1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "A force of 100 N is applied over an area of 2 m². What is the pressure?",
        options: ["50 Pa", "200 Pa", "100 Pa", "0.02 Pa"],
        correct: "50 Pa",
        explanation: "P = F/A = 100 / 2 = 50 Pa",
        mark_scheme: "1 mark for correct answer with unit"
      },
      {
        id: "p1-03",
        type: "short_answer",
        bloom: "apply",
        question: "Explain why a sharp knife cuts more easily than a blunt knife, using the concept of pressure.",
        mark_scheme: "1 mark: a sharp knife has a smaller contact area. 1 mark: for the same applied force, smaller area produces greater pressure, making it easier to cut."
      }
    ],
    level2: [
      {
        id: "p2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "A 60 kg woman is standing on the ground.\n\na) Calculate the force she exerts on the ground (g = 10 N/kg).\nb) When she stands on both feet, the total contact area of her shoes with the ground is 0.03 m². Calculate the pressure.\nc) When she stands on one foot, the contact area is 0.015 m². Calculate the new pressure.\nd) If she wears stiletto heels with a contact area of 0.5 cm² (0.00005 m²) on one heel, calculate the pressure when standing on one heel. Explain why stiletto heels can damage wooden floors.\n\n⚠️ Intentional error: Some students forget to convert the heel area from cm² to m².",
        intentional_error: "Students frequently neglect unit conversion when calculating pressure, especially with small areas in cm² that must be converted to m² (÷10,000).",
        solution_steps: [
          "a) F = mg = 60 × 10 = 600 N",
          "b) P = 600 / 0.03 = 20,000 Pa (20 kPa)",
          "c) P = 600 / 0.015 = 40,000 Pa (40 kPa)",
          "d) Area = 0.00005 m². P = 600 / 0.00005 = 12,000,000 Pa (12 MPa). The extremely high pressure under the tiny heel area causes dents and damage to wooden floors."
        ],
        mark_scheme: "a) 1 mark: F = 600 N. b) 1 mark: P = 20 kPa. c) 1 mark: P = 40 kPa. d) 2 marks: correct conversion + P = 12 MPa with explanation. 1 mark: identifying the intentional error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[7]} Cambridge Checkpoint 0893 Paper 2 (adapted)`
      }
    ],
    level3: [
      {
        id: "p3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: When a straw is used to drink a beverage, the liquid rises up the straw and into the mouth. Many people believe this is caused by 'sucking' or 'drawing' the liquid upward.\n\nCER Task:\nCLAIM: Is 'sucking' the correct scientific explanation for how a drinking straw works? What actually causes the liquid to rise?\nEVIDENCE: Use the concept of atmospheric pressure to support your claim.\nREASONING: What happens inside the mouth and inside the straw when you drink? Could you drink through a straw on the Moon? Explain why or why not.",
        phenomenon: "Liquid rises up a straw when you drink.",
        mark_scheme: "CLAIM (2 marks): Correctly identifies that atmospheric pressure pushes the liquid up, not 'sucking'. EVIDENCE (3 marks): Reducing air pressure in the mouth creates a pressure difference. Atmospheric pressure (≈101 kPa) pushes down on the liquid surface outside the straw. REASONING (3 marks): Lower pressure inside the straw → higher atmospheric pressure outside pushes liquid up. On the Moon, no atmosphere → no atmospheric pressure → cannot drink through a straw. Evaluation (2 marks): Maximum height of water column supported by atmospheric pressure is about 10.3 m (P = ρgh).",
        model_answer: "CLAIM: When drinking through a straw, the liquid is NOT 'sucked up' — it is pushed up by atmospheric pressure. The act of 'sucking' reduces the air pressure inside the mouth and straw, creating a pressure difference.\n\nEVIDENCE: The mouth reduces the air pressure inside the straw by expanding the chest cavity and lowering the diaphragm. Atmospheric pressure (approximately 101,325 Pa at sea level) acts on the surface of the beverage outside the straw. Since pressure inside the straw is now lower than atmospheric pressure, the net force pushes the liquid upward. This continues until the pressure difference is balanced by the weight of the liquid column.\n\nREASONING: P = ρgh → h = P/(ρg). For water (ρ = 1000 kg/m³): h = 101,325/(1000 × 9.8) ≈ 10.3 m. This is the theoretical maximum height — in practice, the human mouth cannot create a perfect vacuum. On the Moon, there is no atmosphere (P ≈ 0), so there is no external pressure to push the liquid up. Drinking through a straw on the Moon is impossible regardless of how hard you 'suck'.",
        derivation_method: "P = ρgh. Standard atmospheric pressure P_atm = 101,325 Pa. h_max = P_atm / (ρg) = 101,325 / (1000 × 9.8) = 10.34 m."
      }
    ]
  },
  thermal: {
    level1: [
      {
        id: "t1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "Which of the following is the SI unit of temperature?",
        options: ["Celsius", "Fahrenheit", "Kelvin", "Joule"],
        correct: "Kelvin",
        explanation: "The SI unit of temperature is Kelvin (K). 0°C = 273.15 K.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "t1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "Which method of heat transfer does NOT require a medium?",
        options: ["Conduction", "Convection", "Radiation", "All require a medium"],
        correct: "Radiation",
        explanation: "Radiation transfers heat via electromagnetic waves and can travel through a vacuum. Conduction and convection require a medium.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "t1-03",
        type: "short_answer",
        bloom: "understand",
        question: "Explain why a metal spoon feels colder than a wooden spoon at room temperature, even though both are at the same temperature.",
        mark_scheme: "1 mark: metal is a better thermal conductor than wood. 1 mark: heat from your hand is conducted away more rapidly by the metal spoon, making it feel colder."
      }
    ],
    level2: [
      {
        id: "t2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "A student investigates how different materials affect the rate of cooling. She pours 200 cm³ of hot water at 80°C into each of three identical containers: a metal cup, a ceramic mug, and a polystyrene (styrofoam) cup. She measures the temperature every 2 minutes for 20 minutes.\n\na) Predict which container will cool fastest and which will cool slowest. Explain using the concept of thermal conductivity.\nb) After 10 minutes, the metal cup contains water at 45°C, the ceramic mug at 52°C, and the polystyrene cup at 63°C. Calculate the temperature drop for each.\nc) What type of heat transfer is primarily responsible for the cooling of the water surface? How could the student reduce this?\n\n⚠️ Intentional error: Students often think the material of the container is the only factor affecting cooling rate, ignoring evaporation from the surface.",
        intentional_error: "Students commonly neglect evaporative cooling — heat loss from the water surface through evaporation is significant, especially for uncovered containers.",
        solution_steps: [
          "a) Metal cup will cool fastest (highest thermal conductivity → heat conducted away quickly). Polystyrene cup will cool slowest (good insulator → low thermal conductivity).",
          "b) Metal: 80 − 45 = 35°C drop. Ceramic: 80 − 52 = 28°C drop. Polystyrene: 80 − 63 = 17°C drop.",
          "c) Evaporation from the water surface is a significant cooling mechanism (evaporative cooling). To reduce it, cover the containers with lids."
        ],
        mark_scheme: "a) 2 marks: correct predictions with thermal conductivity explanation. b) 2 marks: correct calculations for all three. c) 2 marks: evaporation + lid suggestion. 1 mark: identifying the intentional error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[7]} Cambridge Checkpoint 0893 Paper 3 (adapted)`
      }
    ],
    level3: [
      {
        id: "t3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: A thermos (vacuum) flask can keep hot coffee hot for up to 12 hours and cold drinks cold for the same duration.\n\nCER Task:\nCLAIM: Explain how a thermos flask minimises all three methods of heat transfer simultaneously.\nEVIDENCE: Identify the specific design features of a thermos flask and explain which heat transfer method each feature addresses.\nREASONING: If the thermos flask is so effective at preventing heat transfer, why can it not keep contents hot indefinitely? Evaluate the practical limitations of the design.",
        phenomenon: "A thermos flask keeps hot drinks hot and cold drinks cold for many hours.",
        mark_scheme: "CLAIM (2 marks): The flask uses multiple insulation strategies to minimise conduction, convection, and radiation. EVIDENCE (3 marks): Double-walled construction with vacuum (prevents conduction + convection), silvered reflective surfaces (minimises radiation), stopper/cork (reduces conduction at opening). REASONING (3 marks): No insulator is perfect — some heat transfer still occurs through the stopper and the flask walls (the vacuum is never perfect). Evaluation (2 marks): Heat slowly conducted through the stopper, some radiation through the silver coating, heat loss at the flask rim.",
        model_answer: "CLAIM: A thermos flask is designed to minimise all three heat transfer mechanisms — conduction, convection, and radiation — so the contents remain at their initial temperature for extended periods.\n\nEVIDENCE: (1) Double-walled construction with a vacuum between the inner and outer walls: a vacuum contains no particles, so conduction (particle-to-particle transfer) and convection (bulk fluid movement) cannot occur through it. (2) Silvered reflective coating on the inner surfaces: shiny surfaces reflect thermal radiation back toward the contents, minimising radiative heat loss. (3) Tight-fitting stopper (often cork or plastic): reduces convection at the opening and provides insulation. (4) The outer case protects the glass/vacuum chamber.\n\nREASONING: No design is 100% efficient. Heat is still slowly transferred through: (1) the stopper — this is a solid material that conducts heat, albeit slowly, (2) the glass walls around the vacuum seal — these must make physical contact, creating a small conduction path, (3) frequent opening of the flask releases trapped warm air and allows convective heat loss. Over extended periods, these small losses accumulate, and the contents will eventually reach room temperature.",
        derivation_method: "Rate of heat transfer: Q/t = kAΔT/d (conduction). For a vacuum, k ≈ 0, so Q/t ≈ 0 through the double-walled region."
      }
    ]
  },
  light: {
    level1: [
      {
        id: "l1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "Which of the following describes the Law of Reflection?",
        options: [
          "Angle of incidence equals angle of refraction",
          "Angle of incidence equals angle of reflection",
          "Light always travels in curved paths",
          "Reflection only occurs on rough surfaces"
        ],
        correct: "Angle of incidence equals angle of reflection",
        explanation: "The Law of Reflection: the angle of incidence (θᵢ) equals the angle of reflection (θᵣ), both measured from the normal.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "l1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "When light passes from air into water, it bends...",
        options: [
          "Away from the normal",
          "Towards the normal",
          "It does not bend",
          "It reverses direction"
        ],
        correct: "Towards the normal",
        explanation: "When light travels from a less dense medium (air) to a more dense medium (water), it slows down and bends towards the normal.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "l1-03",
        type: "short_answer",
        bloom: "apply",
        question: "Explain why a straw placed in a glass of water appears bent or broken at the water's surface. Name the optical phenomenon responsible.",
        mark_scheme: "1 mark: refraction of light at the air-water boundary. 1 mark: light from the submerged part of the straw bends away from the normal when exiting water, making the straw appear at a different position."
      }
    ],
    level2: [
      {
        id: "l2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "A ray of light strikes a plane mirror at an angle of 30° to the mirror surface.\n\na) Draw what this looks like and calculate the angle of incidence.\nb) State the angle of reflection.\nc) If the mirror is rotated by 10°, what happens to the reflected ray? By how many degrees does the reflected ray shift?\nd) A periscope uses two plane mirrors at 45° angles. Sketch how light travels through a periscope and explain why the image appears upright.\n\n⚠️ Intentional error: Many students measure the angle of incidence from the mirror surface rather than from the normal.",
        intentional_error: "Angle of incidence is measured from the NORMAL (perpendicular line), not from the mirror surface. 30° to the mirror means the angle of incidence = 90° − 30° = 60°.",
        solution_steps: [
          "a) Angle to mirror = 30°. Angle of incidence (from normal) = 90° − 30° = 60°.",
          "b) Angle of reflection = angle of incidence = 60°.",
          "c) If the mirror rotates by 10°, the reflected ray rotates by 2 × 10° = 20°. Reason: the normal rotates with the mirror, affecting both the incident and reflected angles.",
          "d) In a periscope: top mirror at 45° deflects light downward by 90°. Bottom mirror at 45° deflects light horizontally by 90°. The image appears upright because the two reflections cancel the inversion."
        ],
        mark_scheme: "a) 1 mark: θᵢ = 60°. b) 1 mark: θᵣ = 60°. c) 2 marks: reflected ray shifts 20°. d) 2 marks: correct periscope explanation. 1 mark: identifying the intentional error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[7]} Cambridge Checkpoint 0893 Paper 2 (adapted)`
      }
    ],
    level3: [
      {
        id: "l3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: A fish in water appears to be at a different position than where it actually is. This is why spear-fishers must aim below the apparent position of the fish.\n\nCER Task:\nCLAIM: Explain why the fish appears to be at a shallower depth than its actual position. Use ray diagrams and the concept of refraction.\nEVIDENCE: Use Snell's Law and the concept of refractive index to support your claim.\nREASONING: How does the apparent depth depend on the angle of viewing? Evaluate what happens when viewing from directly above versus at an angle.",
        phenomenon: "A fish underwater appears closer to the surface than it actually is.",
        mark_scheme: "CLAIM (2 marks): Light from the fish refracts at the water-air boundary, making the fish appear shallower. EVIDENCE (3 marks): Snell's Law: n₁ sinθ₁ = n₂ sinθ₂. Water (n = 1.33) to air (n = 1.00) → light bends away from normal → brain traces ray back in a straight line → virtual image at shallower depth. REASONING (3 marks): Apparent depth = real depth / n. From directly above: minimal refraction, apparent depth ≈ real depth/1.33. At large angles: more refraction, greater apparent displacement. Evaluation (2 marks): The relationship is exact only for small angles; at large angles, the apparent position shifts laterally as well.",
        model_answer: "CLAIM: Light rays from the fish travel from water (n = 1.33) to air (n = 1.00). At the boundary, they refract away from the normal (bend toward the surface). The brain assumes light travels in straight lines, so it traces the refracted rays back to where they appear to originate — a point shallower than the fish's actual position.\n\nEVIDENCE: Snell's Law: n₁ sinθ₁ = n₂ sinθ₂. For water-air: 1.33 × sinθ_water = 1.00 × sinθ_air. Since n_water > n_air, θ_air > θ_water (rays bend away from normal in air). Apparent depth = actual depth / refractive index = d / 1.33. If the fish is 1 m deep, it appears at approximately 0.75 m.\n\nREASONING: When viewing from directly above (θ ≈ 0°), Snell's Law simplifies: sinθ ≈ θ (small angle approximation). The apparent depth is approximately real depth / n. When viewing from an angle, the apparent position shifts both vertically and horizontally. This is why spear-fishers are trained to aim below the apparent position — the true position is always deeper than it appears.",
        derivation_method: "Snell's Law: n₁ sinθ₁ = n₂ sinθ₂. Apparent depth = real depth × (n₂/n₁). For water (n₁ = 1.33) → air (n₂ = 1.00): apparent depth = real depth / 1.33."
      }
    ]
  },
  sound: {
    level1: [
      {
        id: "s1-01",
        type: "multiple_choice",
        bloom: "remember",
        question: "Sound waves are an example of which type of wave?",
        options: ["Transverse waves", "Longitudinal waves", "Electromagnetic waves", "Surface waves"],
        correct: "Longitudinal waves",
        explanation: "Sound waves are longitudinal waves — particles vibrate parallel to the direction of wave propagation, creating compressions and rarefactions.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "s1-02",
        type: "multiple_choice",
        bloom: "understand",
        question: "As the frequency of a sound wave increases, the pitch...",
        options: ["Decreases", "Increases", "Stays the same", "Disappears"],
        correct: "Increases",
        explanation: "Pitch is directly related to frequency — higher frequency = higher pitch.",
        mark_scheme: "1 mark for correct answer"
      },
      {
        id: "s1-03",
        type: "short_answer",
        bloom: "understand",
        question: "Why can sound NOT travel through a vacuum? Use the particle model to explain.",
        mark_scheme: "1 mark: sound requires a medium (solid, liquid, or gas) to travel through. 1 mark: a vacuum has no particles to vibrate and transmit the sound energy."
      }
    ],
    level2: [
      {
        id: "s2-01",
        type: "long_answer",
        bloom: "analyze",
        question: "A student stands 340 m from a tall cliff and shouts. She hears her echo 2.0 seconds later.\n\na) Calculate the speed of sound in air.\nb) If the student moves closer to the cliff, will she hear the echo sooner or later? Explain.\nc) The experiment is repeated on a cold day (0°C) and a hot day (40°C). On which day will the echo be heard sooner? Explain using the relationship between temperature and the speed of sound.\nd) If the cliff were replaced with a soft foam wall, would an echo still be heard? Explain.\n\n⚠️ Intentional error: Students often forget that the sound travels to the cliff AND back (double the distance).",
        intentional_error: "The distance is travelled twice (to the cliff and back). Total distance = 2 × 340 = 680 m, not 340 m.",
        solution_steps: [
          "a) Total distance travelled = 2 × 340 = 680 m. Time = 2.0 s. Speed = 680 / 2 = 340 m/s.",
          "b) Moving closer → shorter total distance → shorter time → echo heard sooner.",
          "c) On the hot day (40°C). Speed of sound increases with temperature (approximately 0.6 m/s per °C). Higher speed → shorter time for same distance.",
          "d) Soft foam absorbs sound energy rather than reflecting it. A much quieter/weaker echo would be produced, likely inaudible."
        ],
        mark_scheme: "a) 2 marks: v = 340 m/s. b) 1 mark: closer = sooner. c) 2 marks: hot day with correct physics. d) 1 mark: foam absorbs sound. 1 mark: identifying the intentional error.",
        peer_grade: true,
        exam_source: `${EXAM_SOURCES_BY_GRADE[7]} Cambridge Checkpoint 0893 Paper 2 (adapted)`
      }
    ],
    level3: [
      {
        id: "s3-01",
        type: "experimental_design",
        bloom: "evaluate",
        question: "Phenomenon: Bats can navigate and hunt in complete darkness using echolocation. They emit high-frequency sound pulses and listen for the echoes. Some bats can detect objects as thin as a human hair.\n\nCER Task:\nCLAIM: Explain how bats use echolocation to determine the distance, size, and motion of objects around them.\nEVIDENCE: Use the wave equation (v = fλ) and the relationship between wavelength and object detection to support your claim.\nREASONING: Why do bats use high-frequency ultrasound (typically 20–100 kHz) rather than audible sound? Evaluate why humans cannot echolocate as effectively as bats, even with training.",
        phenomenon: "Bats navigate and hunt in darkness using echoes of their own sound pulses.",
        mark_scheme: "CLAIM (2 marks): Bats emit ultrasonic pulses and analyse returning echoes — time delay gives distance, frequency shift gives relative motion. EVIDENCE (3 marks): v = d/t → d = v × t / 2 (two-way travel). Shorter wavelengths detect smaller objects (resolution ≈ λ). Doppler shift indicates motion toward/away. REASONING (3 marks): High frequency = short wavelength = ability to detect small objects (insects, thin wires). Human hearing limited to ~20 kHz → larger wavelength → poorer resolution. Evaluation (2 marks): Some blind humans develop echolocation (click-based) but limited by lower frequency → poorer resolution.",
        model_answer: "CLAIM: Bats emit high-frequency sound pulses (typically 20–100 kHz) and analyse the returning echoes. The TIME DELAY between emission and reception gives the DISTANCE to the object (d = v × t / 2). The FREQUENCY SHIFT (Doppler effect) indicates the object's motion (approaching or receding). The INTENSITY and TIMING DIFFERENCES between the two ears provide directional information.\n\nEVIDENCE: The wave equation v = fλ applies: for ultrasound at 50 kHz, λ = v/f = 340 / 50,000 = 0.0068 m = 6.8 mm. Objects smaller than the wavelength are difficult to detect (they don't reflect enough energy). This allows bats to detect insects as small as mosquitoes. The bat's brain processes echo information at remarkable speed, constructing a 3D 'acoustic image' of its environment.\n\nREASONING: High-frequency ultrasound is essential because: (1) shorter wavelengths detect smaller objects, (2) higher frequencies are more directional (narrower beam for better localisation), (3) ultrasound is less audible to predators/prey. Humans cannot naturally echolocate because: (1) human hearing range is 20 Hz–20 kHz, limiting resolution to λ ≈ 17 mm at best, (2) the human brain is not wired for acoustic imaging. However, some blind individuals develop click-based echolocation, which provides basic spatial awareness but not the resolution of bat echolocation.",
        derivation_method: "Distance: d = v × t / 2. Wavelength: λ = v/f. Doppler shift: f' = f × (v ± v₀) / (v ∓ v_s)."
      }
    ]
  },
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
