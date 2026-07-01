const ACADEMIC_YEAR_START = new Date(2026, 6, 13)
const ACADEMIC_YEAR_END = new Date(2027, 5, 12)

export function getAcademicYear(): string {
  return "2026-2027"
}

export function getCurrentWeek(date?: Date): number {
  const target = date || new Date()
  const diff = target.getTime() - ACADEMIC_YEAR_START.getTime()
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(week, 52))
}

export function getSemester(week: number): 1 | 2 {
  return week <= 22 ? 1 : 2
}

export function getWeekDateRange(week: number): { start: Date; end: Date } {
  const start = new Date(ACADEMIC_YEAR_START)
  start.setDate(start.getDate() + (week - 1) * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 4)
  return { start, end }
}

export function getEffectiveDays(week: number): number {
  const blackoutWeeks = new Set([35, 36, 37, 38, 39, 40, 41, 42])
  const examWeeks = new Set([6, 7, 8, 20, 21, 22])
  const shortWeeks = new Set([1, 12, 13, 14])

  if (blackoutWeeks.has(week)) return 0
  if (examWeeks.has(week)) return 3
  if (shortWeeks.has(week)) return 4
  return 5
}

export function getGradeSequence(grade: number, week: number): string {
  const sequences: Record<number, Record<number, string>> = {
    7: {
      1: "Introduction to Physics & Measurement",
      2: "Physical Quantities & SI Units",
      3: "Kinematics: Distance and Displacement",
      4: "Kinematics: Speed, Velocity, and Acceleration",
      5: "Motion Graphs",
      6: "Forces: Types and Effects",
      7: "Newton's Laws of Motion",
      8: "Friction and Its Applications",
      9: "Energy: Forms and Sources",
      10: "Energy Transfers and Conservation",
      11: "Simple Machines",
      12: "Pressure: Solid, Liquid, and Gas",
      13: "Density and Buoyancy",
      14: "Thermal Physics: Heat Transfer",
      15: "Waves: Introduction and Properties",
      16: "Sound Waves",
      17: "Light: Reflection",
      18: "Light: Refraction",
      19: "Electricity: Basic Circuits",
      20: "Series and Parallel Circuits",
      21: "Magnetism",
      22: "Review and Assessment"
    },
    8: {
      1: "Speed: Distance and Time",
      2: "Speed: Distance-Time Graphs",
      3: "Forces: Balanced and Unbalanced",
      4: "Forces: Friction and Air Resistance",
      5: "Forces: Moments and Levers",
      6: "Forces: Turning Forces",
      7: "Light: Reflection and Plane Mirrors",
      8: "Light: Refraction",
      9: "Light: Dispersion and Colour",
      10: "Light: Lenses and Optical Instruments",
      11: "Earth Science: Magnetic Field",
      12: "Earth Science: Solar System and Asteroids",
      13: "Earth Science: Climate and Atmosphere",
      14: "Renewable Energy Resources",
      15: "Applications: Electromagnets",
      16: "Pressure: Solids, Liquids, and Gases",
      17: "Magnetism: Magnetic Fields",
      18: "Magnetism: Electromagnets and Motors",
      19: "Forces and Motion Review",
      20: "Light and Colour Review",
      21: "Earth Science and Applications Review",
      22: "End of Year Assessment"
    },
    9: {
      1: "Kinematics: Speed, Velocity, and Acceleration",
      2: "Kinematics: Motion Graphs",
      3: "Kinematics: SUVAT Equations",
      4: "Forces: Types and Effects",
      5: "Forces: Newton's Laws of Motion",
      6: "Forces: Momentum",
      7: "Energy: Kinetic and Potential",
      8: "Energy: Work and Power",
      9: "Energy: Conservation and Efficiency",
      10: "Energy: Resources and Sustainability",
      11: "Waves: Properties and Behaviour",
      12: "Waves: Light and Reflection",
      13: "Waves: Refraction and Lenses",
      14: "Waves: Sound and Ultrasound",
      15: "Waves: Electromagnetic Spectrum",
      16: "Electricity: Current and Voltage",
      17: "Electricity: Resistance and Ohm's Law",
      18: "Electricity: Series and Parallel Circuits",
      19: "Magnetism: Magnetic Fields",
      20: "Electromagnetism: Motors and Generators",
      21: "IGCSE Past Paper Practice",
      22: "Review and Assessment"
    },
    10: {
      1: "Kinematics: Equations of Motion",
      2: "Kinematics: Graphical Analysis",
      3: "Dynamics: Newton's Laws",
      4: "Dynamics: Momentum",
      5: "Forces: Friction, Drag, and Circular Motion",
      6: "Energy: Work and Power",
      7: "Energy: Conservation and Efficiency",
      8: "Energy: Resources",
      9: "Thermal Physics: Specific Heat Capacity",
      10: "Thermal Physics: Latent Heat and Gas Laws",
      11: "Waves: Properties and Behaviour",
      12: "Waves: Electromagnetic Spectrum",
      13: "Light: Reflection and Refraction",
      14: "Light: Lenses and Optical Instruments",
      15: "Sound and Ultrasound",
      16: "Electricity: Current, Voltage, and Resistance",
      17: "Electricity: Circuits and Components",
      18: "Magnetism and Electromagnetism",
      19: "Electromagnetic Induction",
      20: "Nuclear Physics: Radioactivity and Fission/Fusion",
      21: "Space Physics: Solar System and Universe",
      22: "IGCSE Past Paper Drill and Review"
    },
    11: {
      1: "Physical Quantities and Units",
      2: "Kinematics: SUVAT and Graphs",
      3: "Dynamics: Newton's Laws and Momentum",
      4: "Forces: Density, Pressure, and Equilibrium",
      5: "Work, Energy, and Power",
      6: "Deformation of Solids: Hooke's Law and Young Modulus",
      7: "Waves: Progressive Waves and Doppler Effect",
      8: "Waves: Polarisation and Intensity",
      9: "Superposition: Stationary Waves",
      10: "Superposition: Diffraction and Interference",
      11: "Electricity: Current, p.d., and Resistance",
      12: "Electricity: Resistivity and EMF",
      13: "DC Circuits: Kirchhoff's Laws",
      14: "DC Circuits: Potential Dividers",
      15: "Particle Physics: Atoms and Nuclei",
      16: "Particle Physics: Fundamental Particles",
      17: "Practical Skills: Paper 3 Techniques",
      18: "Practical Skills: Paper 5 Planning and Analysis",
      19: "AS Level Past Paper Practice",
      20: "AS Level Past Paper Practice",
      21: "AS Level Review",
      22: "AS Level Mock Examination"
    },
    12: {
      1: "Motion in a Circle + TKA Kinematika",
      2: "Gravitational Fields + TKA Dinamika",
      3: "Temperature and Ideal Gases + TKA Fluida",
      4: "Thermodynamics + TKA Kalor",
      5: "Oscillations: Simple Harmonic Motion",
      6: "Oscillations: Damping and Resonance",
      7: "Electric Fields: Coulomb's Law and Field Strength",
      8: "Electric Fields: Point Charges and Uniform Fields",
      9: "Capacitance: Energy Storage and RC Circuits",
      10: "Magnetic Fields: Force on Charges and Currents",
      11: "Magnetic Fields: Motors and Generators",
      12: "Alternating Currents: RMS and Transformers",
      13: "Quantum Physics: Photoelectric Effect",
      14: "Quantum Physics: Wave-Particle Duality and Energy Levels",
      15: "Nuclear Physics: Radioactive Decay",
      16: "Nuclear Physics: Binding Energy and Fission/Fusion",
      17: "Medical Physics: X-rays and Imaging",
      18: "Astronomy and Cosmology",
      19: "TKA Fisika: Fluida Statis/Dinamis dan Gelombang",
      20: "TKA Fisika: Listrik dan Termodinamika",
      21: "A Level Past Paper Practice",
      22: "A Level Review and Mock Examination"
    }
  }

  const gradeSeq = sequences[grade]
  if (!gradeSeq) {
    return `Grade ${grade} — Week ${week}: Physics`
  }

  return gradeSeq[week] || `Grade ${grade} — Week ${week}: Physics`
}
