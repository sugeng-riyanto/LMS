const SYLLABUS_MAP: Record<number, Record<number, { topic: string; subtopics: string[]; prerequisites: string[]; aoFocus: string[] }>> = {
  7: {
    1: {
      topic: "Kinematics",
      subtopics: ["Distance and displacement", "Speed and velocity", "Acceleration", "Motion graphs"],
      prerequisites: ["Basic measurement skills", "SI units", "Graph reading"],
      aoFocus: ["AO1: Knowledge with understanding", "AO2: Handling information and problem solving"]
    },
    6: {
      topic: "Forces",
      subtopics: ["Types of forces", "Newton's laws", "Friction", "Balanced and unbalanced forces"],
      prerequisites: ["Kinematics basics", "Vector concepts"],
      aoFocus: ["AO1: Knowledge with understanding", "AO3: Experimental skills and investigations"]
    },
    11: {
      topic: "Energy",
      subtopics: ["Forms of energy", "Energy transfers", "Conservation of energy", "Power"],
      prerequisites: ["Forces", "Work concept"],
      aoFocus: ["AO1: Knowledge with understanding", "AO2: Handling information"]
    },
    16: {
      topic: "Electricity",
      subtopics: ["Circuit components", "Series and parallel circuits", "Current and voltage", "Resistance"],
      prerequisites: ["Atomic structure basics", "Energy"],
      aoFocus: ["AO1: Knowledge with understanding", "AO3: Experimental skills"]
    }
  },
  8: {
    1: {
      topic: "Kinematics",
      subtopics: ["Speed-time graphs", "Acceleration calculations", "Free fall", "Projectile basics"],
      prerequisites: ["Grade 7 Kinematics", "Basic algebra"],
      aoFocus: ["AO1: Knowledge with understanding", "AO2: Problem solving"]
    },
    5: {
      topic: "Energy Transfers",
      subtopics: ["Energy efficiency", "Thermal energy transfers", "Renewable and non-renewable resources"],
      prerequisites: ["Grade 7 Energy", "Forms of energy"],
      aoFocus: ["AO1", "AO3"]
    }
  },
  9: {
    1: {
      topic: "Kinematics",
      subtopics: ["Equations of motion", "Velocity-time graphs area", "Free fall with air resistance"],
      prerequisites: ["Grade 8 Kinematics", "Algebraic manipulation"],
      aoFocus: ["AO1: Knowledge with understanding", "AO2: Handling information and problem solving"]
    },
    5: {
      topic: "Forces",
      subtopics: ["Newton's second law F=ma", "Momentum p=mv", "Impulse", "Conservation of momentum"],
      prerequisites: ["Grade 8 Forces", "Basic algebra"],
      aoFocus: ["AO1", "AO2", "AO3"]
    },
    9: {
      topic: "Energy",
      subtopics: ["Kinetic and potential energy calculations", "Energy conservation in systems", "Work done"],
      prerequisites: ["Grade 8 Energy", "Forces"],
      aoFocus: ["AO1", "AO2"]
    }
  },
  10: {
    1: {
      topic: "Kinematics",
      subtopics: ["Equations of uniformly accelerated motion", "Motion under gravity", "Graphical analysis"],
      prerequisites: ["Grade 9 Kinematics", "Quadratic equations"],
      aoFocus: ["AO1: Knowledge with understanding", "AO2: Handling information and problem solving"]
    },
    5: {
      topic: "Forces",
      subtopics: ["Newton's laws in depth", "Friction and drag", "Circular motion basics"],
      prerequisites: ["Grade 9 Dynamics", "Vector addition"],
      aoFocus: ["AO1", "AO2", "AO3"]
    },
    11: {
      topic: "Waves",
      subtopics: ["Wave properties", "Electromagnetic spectrum", "Light and sound waves"],
      prerequisites: ["Basic wave concepts"],
      aoFocus: ["AO1", "AO2"]
    }
  },
  11: {
    1: {
      topic: "Kinematics",
      subtopics: ["SUVAT equations", "Multi-stage motion", "Graphical analysis", "Derivation of equations"],
      prerequisites: ["IGCSE Physics", "Algebra", "Trigonometry basics"],
      aoFocus: ["AO1: Knowledge with understanding", "AO2: Analysis and evaluation"]
    },
    5: {
      topic: "Forces",
      subtopics: ["Newton's laws", "Free body diagrams", "Friction", "Moments and equilibrium"],
      prerequisites: ["IGCSE Forces", "Vector resolution"],
      aoFocus: ["AO1", "AO2", "AO3: Experimental skills"]
    },
    11: {
      topic: "Waves",
      subtopics: ["Progressive waves", "Transverse and longitudinal", "Intensity and amplitude"],
      prerequisites: ["IGCSE Waves", "Basic trigonometry"],
      aoFocus: ["AO1", "AO2"]
    }
  },
  12: {
    1: {
      topic: "Thermal Physics",
      subtopics: ["Internal energy", "Specific heat capacity", "Specific latent heat", "First law of thermodynamics"],
      prerequisites: ["AS Physics", "Energy concepts"],
      aoFocus: ["AO1: Knowledge with understanding", "AO2: Analysis and evaluation"]
    },
    5: {
      topic: "Oscillations",
      subtopics: ["Simple harmonic motion", "Energy in SHM", "Damping", "Forced oscillations and resonance"],
      prerequisites: ["AS Kinematics", "Trigonometry"],
      aoFocus: ["AO1", "AO2", "AO3"]
    },
    9: {
      topic: "Electric Fields",
      subtopics: ["Electric field strength", "Coulomb's law", "Electric potential", "Field patterns"],
      prerequisites: ["AS Electricity", "Vector addition"],
      aoFocus: ["AO1", "AO2"]
    }
  }
}

const DEFAULT_TOPIC = {
  topic: "Physics",
  subtopics: ["Core concepts"],
  prerequisites: ["Previous grade physics"],
  aoFocus: ["AO1: Knowledge with understanding"]
}

export async function getSyllabusSequence(
  grade: number,
  weekNumber: number
): Promise<{ topic: string; subtopics: string[]; prerequisites: string[]; cambridge_ao_focus: string[] }> {
  const gradeSyllabus = SYLLABUS_MAP[grade]
  if (!gradeSyllabus) {
    return {
      topic: `Grade ${grade} Physics`,
      subtopics: ["General physics topics"],
      prerequisites: [`Grade ${grade - 1} Physics`],
      cambridge_ao_focus: ["AO1", "AO2"]
    }
  }

  const entry = gradeSyllabus[weekNumber] || DEFAULT_TOPIC
  const bestMatch = Object.entries(gradeSyllabus)
    .map(([week, data]) => ({ week: parseInt(week), data }))
    .sort((a, b) => Math.abs(a.week - weekNumber) - Math.abs(b.week - weekNumber))[0]

  const result = bestMatch ? bestMatch.data : DEFAULT_TOPIC

  return {
    topic: result.topic,
    subtopics: result.subtopics,
    prerequisites: result.prerequisites,
    cambridge_ao_focus: result.aoFocus
  }
}
