interface PastPaperResult {
  question: string
  markScheme: string
  paperRef: string
  year: number
}

const PAST_PAPERS: PastPaperResult[] = [
  {
    question: "A car accelerates uniformly from rest to a speed of 25 m/s in 15 seconds. Calculate:\na) The acceleration of the car\nb) The distance travelled during this time\nc) If the car then decelerates at 2 m/s², how long does it take to stop?",
    markScheme: "a) a = (v - u)/t = (25 - 0)/15 = 1.67 m/s² (1 mark for formula, 1 mark for correct answer)\nb) s = ut + ½at² = 0 + ½ × 1.67 × 225 = 188 m OR s = ½(u+v)t = ½ × 25 × 15 = 188 m (1 mark for either formula, 1 mark for answer)\nc) t = (v - u)/a = (0 - 25)/(-2) = 12.5 s (1 mark)",
    paperRef: "Cambridge IGCSE 0625/21/M/J/23",
    year: 2023
  },
  {
    question: "A block of mass 4 kg is placed on a horizontal surface. A force of 20 N is applied horizontally. The coefficient of friction between the block and the surface is 0.3.\na) Calculate the frictional force acting on the block\nb) Calculate the acceleration of the block\nc) If the force is applied at an angle of 30° above the horizontal, explain how this affects the acceleration",
    markScheme: "a) N = mg = 4 × 9.81 = 39.24 N, f = μN = 0.3 × 39.24 = 11.77 N ≈ 11.8 N (2 marks)\nb) F_net = 20 - 11.77 = 8.23 N, a = F_net/m = 8.23/4 = 2.06 m/s² (2 marks)\nc) Vertical component reduces normal force, reducing friction; horizontal component is less than 20 N; net effect must be discussed (2 marks)",
    paperRef: "Cambridge IGCSE 0625/22/O/N/22",
    year: 2022
  },
  {
    question: "A pendulum of length 1.2 m is displaced through a small angle and released. The bob has mass 0.05 kg.\na) Define the term 'period' of a pendulum\nb) Calculate the period of oscillation (g = 9.81 m/s²)\nc) The amplitude of oscillation gradually decreases. Explain this in terms of energy",
    markScheme: "a) Time taken for one complete oscillation (1 mark)\nb) T = 2π√(l/g) = 2π√(1.2/9.81) = 2.20 s (2 marks)\nc) Energy is dissipated due to air resistance and friction at the pivot; mechanical energy converted to thermal energy (2 marks)",
    paperRef: "Cambridge AS Level 9702/12/M/J/23",
    year: 2023
  },
  {
    question: "In an experiment to verify Ohm's law, a student obtains the following results:\nVoltage (V): 0.0, 1.5, 3.0, 4.5, 6.0, 7.5\nCurrent (A): 0.00, 0.30, 0.59, 0.91, 1.20, 1.49\na) Plot a graph of voltage against current\nb) Determine the resistance of the resistor\nc) Suggest one source of error in this experiment and how it could be reduced",
    markScheme: "a) Axes labelled with units, suitable scales, all points plotted correctly, best-fit straight line through origin (3 marks)\nb) R = V/I = gradient of graph = (7.5 - 0)/(1.49 - 0) ≈ 5.03 Ω (2 marks)\nc) Resistance heating changes resistor temperature; use small currents or allow cooling between readings (2 marks)",
    paperRef: "Cambridge IGCSE 0625/51/M/J/23",
    year: 2023
  },
  {
    question: "A stone is thrown vertically upward with an initial velocity of 15 m/s from the edge of a cliff that is 50 m above sea level. (g = 9.81 m/s²)\na) Calculate the maximum height reached above the cliff top\nb) Calculate the time taken to reach maximum height\nc) Calculate the velocity of the stone just before it hits the water",
    markScheme: "a) v² = u² + 2as → 0 = 225 + 2(-9.81)s → s = 11.46 m (2 marks)\nb) v = u + at → 0 = 15 + (-9.81)t → t = 1.53 s (1 mark)\nc) Total height from max = 50 + 11.46 = 61.46 m, v² = 0 + 2(9.81)(61.46) → v = 34.7 m/s (3 marks)",
    paperRef: "Cambridge IGCSE 0625/22/M/J/22",
    year: 2022
  },
  {
    question: "A transformer has 200 turns on the primary coil and 2400 turns on the secondary coil. The input voltage is 230 V.\na) Calculate the output voltage\nb) The output current is 0.50 A. Assuming 100% efficiency, calculate the input current\nc) Explain why in practice the input current would be larger than your calculated value",
    markScheme: "a) V_s/V_p = N_s/N_p → V_s = 230 × 2400/200 = 2760 V (2 marks)\nb) V_p × I_p = V_s × I_s → I_p = (2760 × 0.50)/230 = 6.0 A (2 marks)\nc) Energy is lost due to heating of coils (copper losses), eddy currents in core, magnetic flux leakage (2 marks)",
    paperRef: "Cambridge IGCSE 0625/22/O/N/23",
    year: 2023
  },
  {
    question: "Explain what is meant by the photoelectric effect. A metal surface has a work function of 3.2 eV. Light of wavelength 350 nm is incident on the surface.\na) Calculate the maximum kinetic energy of emitted photoelectrons in eV\nb) Determine the threshold frequency for this metal\nc) Explain why increasing the intensity of the light does not increase the kinetic energy of the photoelectrons",
    markScheme: "a) E = hc/λ = (6.63×10⁻³⁴ × 3.0×10⁸)/(350×10⁻⁹) = 5.68×10⁻¹⁹ J = 3.55 eV, KE_max = 3.55 - 3.2 = 0.35 eV (3 marks)\nb) f₀ = φ/h = 3.2 × 1.6×10⁻¹⁹ / 6.63×10⁻³⁴ = 7.72×10¹⁴ Hz (2 marks)\nc) Intensity increases number of photons, not energy per photon; each electron absorbs one photon; KE depends on photon energy = hf (1 mark)",
    paperRef: "Cambridge A Level 9702/41/O/N/22",
    year: 2022
  },
  {
    question: "A spring of natural length 0.40 m has a force constant of 50 N/m. A mass of 0.20 kg is attached to the spring and the system is set into vertical oscillations.\na) Calculate the extension of the spring when the mass is at rest\nb) Calculate the period of oscillation\nc) The mass is pulled down a further 0.05 m and released. Calculate the maximum acceleration of the mass",
    markScheme: "a) F = kx → mg = kx → x = 0.20×9.81/50 = 0.0392 m (1 mark)\nb) T = 2π√(m/k) = 2π√(0.20/50) = 0.397 s (2 marks)\nc) a_max = ω²A = (2π/T)² × 0.05 = (15.82)² × 0.05 = 12.5 m/s² (2 marks)",
    paperRef: "Cambridge AS Level 9702/11/M/J/23",
    year: 2023
  }
]

const TOPIC_KEYWORDS: Record<string, string[]> = {
  kinematics: ["acceleration", "velocity", "speed", "motion", "distance", "displacement", "SUVAT", "free fall", "projectile", "deceleration"],
  forces: ["force", "newton", "friction", "mass", "weight", "tension", "normal reaction", "equilibrium"],
  energy: ["energy", "work", "power", "kinetic", "potential", "conservation", "pendulum"],
  waves: ["wave", "frequency", "wavelength", "amplitude", "oscillation", "period", "transverse", "longitudinal"],
  electricity: ["current", "voltage", "resistance", "ohm", "circuit", "transformer", "power"],
  thermal: ["thermal", "heat", "temperature", "specific heat", "latent heat"],
  pressure: ["pressure", "pascal", "hydraulic", "density"],
  magnetism: ["magnet", "electromagnet", "magnetic field", "flux"],
  quantum: ["photoelectric", "photon", "work function", "threshold frequency", "quantum"]
}

function topicMatchesKeywords(topic: string, paper: PastPaperResult): boolean {
  const lowerTopic = topic.toLowerCase()
  const lowerQuestion = paper.question.toLowerCase()

  for (const [_key, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (lowerTopic.includes(_key)) {
      return keywords.some(kw => lowerQuestion.includes(kw))
    }
  }

  return lowerQuestion.includes(lowerTopic)
}

export async function searchPastPaper(
  syllabus: string,
  topic: string,
  paper: string,
  difficulty: string
): Promise<PastPaperResult> {
  const candidates = PAST_PAPERS.filter(p => topicMatchesKeywords(topic, p))

  if (candidates.length > 0) {
    const index = Math.floor(Math.random() * candidates.length)
    return candidates[index]
  }

  return PAST_PAPERS[Math.floor(Math.random() * PAST_PAPERS.length)]
}

export async function listPastPapers(): Promise<PastPaperResult[]> {
  return PAST_PAPERS
}
