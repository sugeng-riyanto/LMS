import type { AgentInput, AnswerKey } from "./agent-types"

const LEVEL1_TOPICS: Record<string, AnswerKey[]> = {
  kinematics: [
    { question: "What is the SI unit for velocity?", answer: "m/s", explanation: "Velocity in SI is measured in metres per second (m/s)." },
    { question: "A runner covers 100 m in 10 s. What is their average speed?", answer: "10 m/s", explanation: "v = s/t = 100/10 = 10 m/s" },
    { question: "What is the difference between distance and displacement?", answer: "Distance is scalar (magnitude only), displacement is vector (magnitude and direction).", explanation: "Distance = total path length, displacement = final position − initial position." },
  ],
  forces: [
    { question: "Newton's First Law is also known as the law of...", answer: "Inertia", explanation: "Objects maintain their state of rest or uniform motion unless acted upon by a net force." },
    { question: "A 2 kg book on a table. What is the normal force? (g = 9.8)", answer: "19.6 N", explanation: "Normal force = weight = mg = 2 × 9.8 = 19.6 N upward." },
    { question: "State three types of frictional force.", answer: "Static friction (stationary objects), kinetic friction (moving objects), rolling friction (objects that roll).", explanation: "Friction opposes relative motion between surfaces." },
  ],
  energy: [
    { question: "What does the Law of Conservation of Energy state?", answer: "Energy cannot be created or destroyed, only converted from one form to another.", explanation: "Total energy in an isolated system remains constant." },
    { question: "A 0.5 kg ball dropped from 10 m. What is its GPE at the top? (g = 10)", answer: "50 J", explanation: "GPE = mgh = 0.5 × 10 × 10 = 50 J" },
    { question: "Give 3 examples of energy transformations.", answer: "Lamp: electrical → light + heat. Fan: electrical → kinetic. Food: chemical → heat + motion.", explanation: "Energy transforms between forms but total is conserved." },
  ],
  waves: [
    { question: "What is the relationship between wave speed, frequency, and wavelength?", answer: "v = fλ", explanation: "Wave speed equals frequency multiplied by wavelength." },
    { question: "What is the difference between transverse and longitudinal waves?", answer: "Transverse: particles vibrate perpendicular to wave direction. Longitudinal: particles vibrate parallel.", explanation: "Light is transverse, sound is longitudinal." },
    { question: "What is the frequency of a wave with period 0.02 s?", answer: "50 Hz", explanation: "f = 1/T = 1/0.02 = 50 Hz" },
  ],
  electricity: [
    { question: "What is the unit of electric current?", answer: "Ampere (A)", explanation: "Current is the rate of flow of charge. 1 A = 1 C/s." },
    { question: "A 6 V battery connected to a 3 Ω resistor. What is the current?", answer: "2 A", explanation: "I = V/R = 6/3 = 2 A" },
    { question: "What is the difference between series and parallel circuits?", answer: "Series: same current through all components. Parallel: same voltage across all branches.", explanation: "In series, total R = R₁ + R₂. In parallel, 1/R = 1/R₁ + 1/R₂." },
  ],
  magnetism: [
    { question: "What are the poles of a magnet called?", answer: "North and south poles", explanation: "Like poles repel, opposite poles attract." },
    { question: "What is a magnetic field?", answer: "A region where a magnetic force is experienced.", explanation: "Field lines go from north to south outside the magnet." },
    { question: "How can an electromagnet be made stronger?", answer: "Increase current, increase number of coils, or use a soft iron core.", explanation: "These increase the magnetic field strength." },
  ],
  density: [
    { question: "What is the formula for density?", answer: "ρ = m/V", explanation: "Density = mass / volume. SI unit: kg/m³." },
    { question: "Why does ice float on water?", answer: "Ice is less dense than water.", explanation: "Water expands when frozen → lower density." },
    { question: "A block of mass 200 g and volume 100 cm³. What is its density?", answer: "2 g/cm³", explanation: "ρ = 200/100 = 2 g/cm³" },
  ],
  pressure: [
    { question: "What is the formula for pressure?", answer: "P = F/A", explanation: "Pressure = force / area. SI unit: pascal (Pa) or N/m²." },
    { question: "A force of 100 N applied over 2 m². What is the pressure?", answer: "50 Pa", explanation: "P = 100/2 = 50 Pa" },
    { question: "Why does a sharp knife cut better than a blunt one?", answer: "Smaller area → greater pressure for the same force.", explanation: "P = F/A. Reducing area increases pressure." },
  ],
  thermal: [
    { question: "What is the SI unit of temperature?", answer: "Kelvin (K)", explanation: "0°C = 273.15 K." },
    { question: "Which heat transfer method does NOT require a medium?", answer: "Radiation", explanation: "Radiation travels via electromagnetic waves, can pass through a vacuum." },
    { question: "Why does metal feel colder than wood at room temperature?", answer: "Metal conducts heat away from your hand faster.", explanation: "Thermal conductivity of metal is much higher than wood." },
  ],
  light: [
    { question: "What does the Law of Reflection state?", answer: "Angle of incidence equals angle of reflection.", explanation: "Both angles are measured from the normal." },
    { question: "What happens when light passes from air to water?", answer: "It slows down and bends towards the normal.", explanation: "Refraction occurs due to change in speed between media." },
    { question: "Why does a straw appear bent in water?", answer: "Refraction of light at the air-water boundary.", explanation: "Light bends when changing medium, creating a virtual image at a different position." },
  ],
  sound: [
    { question: "What type of wave is sound?", answer: "Longitudinal wave", explanation: "Particles vibrate parallel to the direction of wave propagation." },
    { question: "How does pitch relate to frequency?", answer: "Higher frequency = higher pitch.", explanation: "Pitch is the human perception of frequency." },
    { question: "Why can sound not travel through a vacuum?", answer: "No particles to vibrate and transmit energy.", explanation: "Sound requires a medium (solid, liquid, or gas)." },
  ],
}

function getAnswerKeys(topic: string, grade: number): AnswerKey[] {
  const key = topic.toLowerCase()
  for (const [k, answers] of Object.entries(LEVEL1_TOPICS)) {
    if (key.includes(k)) return answers.map((a) => ({ ...a }))
  }
  return [
    { question: `Define the key concepts of ${topic}.`, answer: "Refer to the lesson materials for a complete definition.", explanation: "Ensure students can state definitions using correct scientific terminology." },
    { question: `Give a real-world example of ${topic}.`, answer: "Answers may vary. Accept any reasonable real-world application.", explanation: "Students should connect abstract concepts to everyday phenomena." },
    { question: `Solve a basic problem involving ${topic}.`, answer: "Solution depends on the specific problem. Apply the relevant formula step by step.", explanation: "Check that students use correct units and show working." },
  ]
}

const LEVEL2_SOLUTIONS: Record<string, AnswerKey[]> = {
  kinematics: [
    { question: "A car travels at 20 m/s for 5 s, then accelerates at 2 m/s² for 3 s. Calculate total distance and final velocity.", answer: "Total distance = 169 m. Final velocity = 26 m/s.", explanation: "Step 1: s₁ = vt = 20 × 5 = 100 m. Step 2: s₂ = v₀t + ½at² = 20(3) + ½(2)(9) = 69 m. Step 3: s_total = 169 m. Step 4: v = v₀ + at = 20 + 6 = 26 m/s." },
    { question: "Two cars approach each other at 15 m/s and 10 m/s from 500 m apart. When and where do they meet?", answer: "t = 20 s. Position = 300 m from car A's start.", explanation: "Relative velocity = 15 + 10 = 25 m/s. t = 500/25 = 20 s. s_A = 15 × 20 = 300 m." },
  ],
  forces: [
    { question: "A 5 kg block is pulled with 30 N across a rough surface (μ = 0.2, g = 10). Find acceleration.", answer: "a = 4 m/s²", explanation: "N = mg = 50 N. Friction = μN = 0.2 × 50 = 10 N. ΣF = 30 − 10 = 20 N. a = 20/5 = 4 m/s²." },
  ],
  energy: [
    { question: "A 500 kg roller coaster from 40 m height through a 10 m radius loop. Find velocities.", answer: "v_B = 28.28 m/s, v_C = 20 m/s. Yes, it reaches point C (v_min = 10 m/s).", explanation: "PE_A = 200,000 J → KE_B = 200,000 J → v_B = 28.28 m/s. At C (20 m high): PE_C = 100,000 J, KE_C = 100,000 J → v_C = 20 m/s. Condition: v > √(gR) = 10 m/s ✓" },
  ],
  waves: [
    { question: "A slinky with 3 complete waves along 6 m, 12 oscillations in 6 s. Find f, λ, v.", answer: "f = 2 Hz, λ = 2 m, v = 4 m/s.", explanation: "f = 12/6 = 2 Hz. λ = 6/3 = 2 m. v = fλ = 2 × 2 = 4 m/s. Doubling frequency halves wavelength (speed constant in same medium)." },
  ],
  electric: [
    { question: "Three resistors 4 Ω, 6 Ω, 12 Ω in parallel across 24 V. Find R_total, I_total, I₆.", answer: "R_total = 2 Ω, I_total = 12 A, I₆ = 4 A.", explanation: "1/R = 1/4 + 1/6 + 1/12 = 1/2 → R = 2 Ω. I = 24/2 = 12 A. I₆ = 24/6 = 4 A." },
  ],
  magnetism: [
    { question: "An electromagnet with 50 turns on an iron nail picks up 8 paper clips. Suggest two improvements.", answer: "(1) Increase coil turns. (2) Increase current/voltage.", explanation: "More turns → stronger magnetic field. Higher current → stronger magnetic field. Reversing battery swaps poles, does NOT change strength. Iron core concentrates field." },
  ],
  density: [
    { question: "A 50 g stone raised water from 30 cm³ to 48 cm³. Find density. Will it sink in oil (0.92 g/cm³)?", answer: "ρ = 2.78 g/cm³. Yes, it sinks.", explanation: "V = 48 − 30 = 18 cm³. ρ = 50/18 = 2.78 g/cm³. Oil density 0.92 < 2.78 → sinks." },
  ],
  pressure: [
    { question: "A 60 kg woman standing. Find pressure on two feet (0.03 m²) and one heel (0.00005 m²).", answer: "Two feet: 20 kPa. One heel: 12 MPa.", explanation: "F = 60 × 10 = 600 N. Two feet: P = 600/0.03 = 20,000 Pa. Heel: P = 600/0.00005 = 12,000,000 Pa. High pressure under heel damages floors." },
  ],
  light: [
    { question: "Light ray strikes plane mirror at 30° to surface. Find angles. If mirror rotated 10°, how much does reflected ray shift?", answer: "θᵢ = θᵣ = 60°. Reflected ray shifts 20°.", explanation: "Angle from normal = 90° − 30° = 60°. When mirror rotates by θ, reflected ray rotates by 2θ = 20°." },
  ],
  sound: [
    { question: "Student 340 m from cliff hears echo in 2.0 s. Find speed of sound.", answer: "v = 340 m/s", explanation: "Total distance = 2 × 340 = 680 m. v = 680/2 = 340 m/s. Sound travels faster on hot days." },
  ],
}

function getLevel2AnswerKeys(topic: string): AnswerKey[] {
  const key = topic.toLowerCase()
  for (const [k, answers] of Object.entries(LEVEL2_SOLUTIONS)) {
    if (key.includes(k)) return answers.map((a) => ({ ...a }))
  }
  return [
    { question: "Solve the Level 2 mistake-hunter problem for this topic.", answer: "Apply the relevant physics principles step by step. Identify the intentional error.", explanation: "Check that students correctly identified the error and applied the correct formula." },
  ]
}

const LEVEL3_SOLUTIONS: Record<string, AnswerKey[]> = {
  kinematics: [
    { question: "CER: A tennis ball and bowling ball are dropped simultaneously. Which hits first?", answer: "In a vacuum: both hit simultaneously (g is constant). In air: the bowling ball hits first.", explanation: "CLAIM: In a vacuum both fall together. EVIDENCE: h = ½gt², mass is not a factor. REASONING: Air resistance affects the tennis ball more due to larger surface area-to-mass ratio. The ideal model ignores air resistance — useful for fundamentals but imperfect for real-world prediction." },
  ],
  forces: [
    { question: "CER: A car at 72 km/h brakes to a stop in 40 m. Will braking distance increase with a 500 kg load?", answer: "Yes, braking distance increases with load.", explanation: "CLAIM: Braking distance increases. EVIDENCE: F = ma → a = F/m. With constant braking force, more mass → less deceleration. v² = u² + 2as → s = −u²/(2a). Smaller a → larger s. REASONING: In reality, more mass → more normal force → more friction (f = μN), so the relationship is complex. Tyre condition, road surface, and weather also affect braking." },
  ],
  energy: [
    { question: "CER: A ball dropped from 2 m bounces to 1.2 m. Is energy lost?", answer: "Energy is NOT lost — it transforms into heat and sound.", explanation: "CLAIM: Mechanical energy transforms into heat and sound. EVIDENCE: Initial PE = 19.6m J, final PE = 11.76m J. 40% of mechanical energy 'lost'. REASONING: Energy conserves — transforms to heat (molecule vibration) and sound. Coefficient of restitution e = √(1.2/2) = 0.775." },
  ],
  waves: [
    { question: "CER: A leaf on a pond bobs up and down as ripples pass but does not move outward. Explain.", answer: "Waves transfer energy, not matter.", explanation: "CLAIM: Waves transfer energy through a medium without net displacement of particles. EVIDENCE: Leaf oscillates but stays in place. v = fλ describes energy propagation. REASONING: Water particles oscillate about equilibrium — energy passes between neighbouring particles. Real water waves have circular orbital motion but zero net displacement per cycle." },
  ],
  electric: [
    { question: "CER: Why does a circuit breaker trip when too many appliances are connected?", answer: "Total current exceeds the breaker's rated limit.", explanation: "CLAIM: Current drawn = sum of individual appliance currents (parallel circuit). EVIDENCE: I = P/V. More appliances → more total power → more current. I_total > rating → breaker trips. REASONING: Breakers prevent wire overheating (I²R). Series connections would divide voltage — appliances would not work correctly." },
  ],
  magnetism: [
    { question: "CER: How do maglev trains levitate and propel without touching the track?", answer: "Magnetic repulsion for levitation, alternating polarity for propulsion.", explanation: "CLAIM: Like poles repel (levitation). Alternating electromagnets pull the train forward. EVIDENCE: Lorentz force F = qvB. Electromagnets allow controlled polarity/strength switching. REASONING: Permanent magnets alone cannot provide both levitation and controlled propulsion. High infrastructure cost limits adoption." },
  ],
  density: [
    { question: "CER: A steel ship floats but a steel nail sinks. Explain using density.", answer: "The ship's average density (including air) is less than water's.", explanation: "CLAIM: Average density of ship (steel + air) < water density → floats. Nail is solid steel → density > water → sinks. EVIDENCE: Archimedes' principle: buoyant force = weight of displaced water. Ship's hull encloses air → large volume → low average density. Nail = 7.8 g/cm³ > 1.0 g/cm³. REASONING: Submarines control buoyancy via ballast tanks. Engineering must consider hull strength, stability, and displacement." },
  ],
  pressure: [
    { question: "CER: How does a drinking straw work? Can you use a straw on the Moon?", answer: "Atmospheric pressure pushes liquid up. No atmosphere on Moon → cannot drink through straw.", explanation: "CLAIM: Reducing pressure in mouth creates pressure difference — atmospheric pressure pushes liquid up the straw. EVIDENCE: P_atm ≈ 101 kPa. ΔP = P_atm − P_mouth → net upward force. h_max = P/(ρg) ≈ 10.3 m for water. REASONING: On the Moon, P_atm ≈ 0 → no pressure difference → cannot drink. Practical max height is less because human mouth cannot create perfect vacuum." },
  ],
  light: [
    { question: "CER: A fish in water appears shallower than its actual position. Explain.", answer: "Refraction at water-air boundary creates a virtual image at shallower depth.", explanation: "CLAIM: Light from fish refracts away from normal at water-air boundary → brain traces ray straight → apparent position is shallower. EVIDENCE: Snell's Law: n₁ sinθ₁ = n₂ sinθ₂. n_water = 1.33, n_air = 1.00. Apparent depth = real depth / 1.33. REASONING: From directly above, minimal refraction. At angle, lateral shift also occurs. Spear-fishers aim below apparent position." },
  ],
  sound: [
    { question: "CER: Bats navigate in darkness using echolocation. How do they detect small insects?", answer: "Bats emit ultrasonic pulses and analyse echoes to determine distance, size, and motion.", explanation: "CLAIM: Time delay → distance (d = vt/2). Doppler shift → motion. Wavelength limits resolution. EVIDENCE: λ = v/f. At 50 kHz, λ = 340/50,000 = 6.8 mm — small enough to detect insects. REASONING: High frequency → short wavelength → detect small objects. Human hearing limited to ~20 kHz → λ ≈ 17 mm → poorer resolution. Blind humans develop click-based echolocation but with lower resolution." },
  ],
}

function getLevel3AnswerKeys(topic: string): AnswerKey[] {
  const key = topic.toLowerCase()
  for (const [k, answers] of Object.entries(LEVEL3_SOLUTIONS)) {
    if (key.includes(k)) return answers.map((a) => ({ ...a }))
  }
  return [
    { question: `CER: Construct a Claim-Evidence-Reasoning argument for a phenomenon involving ${topic}.`, answer: "A strong CER includes a clear claim, quantitative evidence from physics principles, and reasoning that connects them.", explanation: "Evaluate whether the claim is testable, evidence is quantitative, and reasoning references relevant physics laws." },
  ]
}

export async function generateAnswerKeys(input: AgentInput): Promise<AnswerKey[]> {
  const keys: AnswerKey[] = []
  keys.push(...getAnswerKeys(input.topic, input.grade))
  keys.push(...getLevel2AnswerKeys(input.topic))
  keys.push(...getLevel3AnswerKeys(input.topic))
  return keys
}
