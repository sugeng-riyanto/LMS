import type { AgentInput, PreClassMaterial } from "./agent-types"

const VIDEO_LIBRARY: Record<string, { title: string; url: string; source: string; duration: number; concepts: string[] }> = {
  kinematics: {
    title: "Position, Velocity, and Acceleration | FuseSchool",
    url: "https://www.youtube.com/watch?v=QJDMQjK6jB0",
    source: "FuseSchool - Global Education",
    duration: 6,
    concepts: ["Displacement vs distance", "Velocity vs speed", "Acceleration", "Graphs of motion"]
  },
  forces: {
    title: "Forces and Newton's Laws of Motion | FuseSchool",
    url: "https://www.youtube.com/watch?v=5Z2q6MOhSPk",
    source: "FuseSchool - Global Education",
    duration: 8,
    concepts: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Free body diagrams"]
  },
  energy: {
    title: "Energy | FuseSchool",
    url: "https://www.youtube.com/watch?v=5L2kWMVFpOs",
    source: "FuseSchool - Global Education",
    duration: 7,
    concepts: ["Conservation of energy", "Kinetic energy", "Potential energy", "Energy transfers"]
  },
  waves: {
    title: "Wave Properties | FuseSchool",
    url: "https://www.youtube.com/watch?v=WCVU5RXX7zY",
    source: "FuseSchool - Global Education",
    duration: 6,
    concepts: ["Transverse waves", "Longitudinal waves", "Wavelength", "Frequency", "Amplitude"]
  },
  electricity: {
    title: "What is Electricity? | FuseSchool",
    url: "https://www.youtube.com/watch?v=zplsalylQpc",
    source: "FuseSchool - Global Education",
    duration: 7,
    concepts: ["Electric current", "Voltage", "Resistance", "Ohm's Law", "Series and parallel circuits"]
  },
  magnetism: {
    title: "Electromagnetism | FuseSchool",
    url: "https://www.youtube.com/watch?v=3Hj7mDbyTgs",
    source: "FuseSchool - Global Education",
    duration: 8,
    concepts: ["Magnetic fields", "Electromagnets", "Motor effect", "Generator effect"]
  },
  thermal: {
    title: "Thermal Energy | FuseSchool",
    url: "https://www.youtube.com/watch?v=9vjvzkS_2Tc",
    source: "FuseSchool - Global Education",
    duration: 6,
    concepts: ["Conduction", "Convection", "Radiation", "Specific heat capacity"]
  },
  pressure: {
    title: "Pressure in Fluids | FuseSchool",
    url: "https://www.youtube.com/watch?v=1zDMDk1Rc5M",
    source: "FuseSchool - Global Education",
    duration: 7,
    concepts: ["Pressure formula", "Atmospheric pressure", "Hydrostatic pressure", "Pascal's principle"]
  },
  density: {
    title: "Density | FuseSchool",
    url: "https://www.youtube.com/watch?v=1zDMDk1Rc5M",
    source: "FuseSchool - Global Education",
    duration: 5,
    concepts: ["Mass", "Volume", "Density formula", "Floating and sinking", "Archimedes' principle"]
  }
}

const SIMULATION_LIBRARY: Record<string, { title: string; url: string; instructions: string; questions: string[] }> = {
  kinematics: {
    title: "Moving Man Simulation",
    url: "https://phet.colorado.edu/sims/cheerpj/moving-man/latest/moving-man.html?simulation=moving-man",
    instructions: "Open the Moving Man simulation. Set initial position to 0 m and initial velocity to 0 m/s. Use the 'play' button to move the character. Experiment with constant velocity first, then constant acceleration. Observe the position, velocity, and acceleration graphs generated in real time.",
    questions: [
      "What shape does the position-time graph exhibit for constant velocity motion?",
      "What happens to the velocity graph when the character accelerates?",
      "Can you produce a parabolic position-time graph? Describe how."
    ]
  },
  forces: {
    title: "Forces and Motion: Basics",
    url: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html",
    instructions: "Select the 'Net Force' tab. Place individuals on both the left and right sides and observe the resultant force. Then select the 'Motion' tab — apply a force to the crate and examine the relationship between force, mass, and acceleration.",
    questions: [
      "Given the same applied force, which crate accelerates faster: a light one or a heavy one?",
      "What occurs when the net force acting on an object is zero?",
      "How does the velocity graph change when a constant force is applied?"
    ]
  },
  energy: {
    title: "Energy Skate Park: Basics",
    url: "https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_all.html",
    instructions: "Select the 'Playground' tab. Place the skateboarder at a high starting point. Enable 'Bar Graph' and 'Speed' to visualise energy distribution and velocity. Experiment with various tracks and observe the transformations between potential and kinetic energy.",
    questions: [
      "What happens to gravitational potential energy as the skater descends the track?",
      "At which point is kinetic energy maximised?",
      "Does the total mechanical energy change? Why or why not?"
    ]
  },
  waves: {
    title: "Wave on a String",
    url: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html",
    instructions: "Set 'Oscillate' to on, 'Amplitude' to 0.5 cm, and 'Frequency' to 1 Hz. Observe the wave propagation along the string. Experiment by varying frequency, amplitude, and damping. Compare transverse and longitudinal wave behaviour.",
    questions: [
      "What effect does changing frequency have on wavelength?",
      "What happens when the damping coefficient is increased?",
      "Can you produce a standing wave? Describe the conditions required."
    ]
  },
  electricity: {
    title: "Circuit Construction Kit: DC",
    url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html",
    instructions: "Construct a simple series circuit comprising a battery, a bulb, and a switch. Connect an ammeter and a voltmeter to measure current and voltage. Then reconfigure the circuit into a parallel arrangement and compare the measurements.",
    questions: [
      "How does the current compare between series and parallel circuits?",
      "What happens when one bulb is removed from a series circuit? From a parallel circuit?",
      "How does adding additional resistors affect the total current?"
    ]
  },
  magnetism: {
    title: "Magnets and Electromagnets",
    url: "https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets_all.html",
    instructions: "Explore the magnetic field surrounding a bar magnet using a compass. Observe the direction of field lines. Then construct an electromagnet by wrapping wire around an iron nail and connecting it to a battery.",
    questions: [
      "What happens to the compass needle when brought near a magnet?",
      "What methods can be employed to strengthen an electromagnet?",
      "How does the magnetic field around a bar magnet differ from that of an electromagnet?"
    ]
  },
  thermal: {
    title: "Energy Forms and Changes",
    url: "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_all.html",
    instructions: "Select the 'Systems' tab. Position a heat source beneath a container of water and observe the energy transfer. Experiment with different materials such as iron, brick, and aluminium, monitoring temperature changes with the thermometer.",
    questions: [
      "Which material heats up most rapidly? Provide a scientific explanation.",
      "What happens to water molecules as they are heated?",
      "How do the specific heat capacities of various materials compare?"
    ]
  },
  pressure: {
    title: "Under Pressure",
    url: "https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_all.html",
    instructions: "Position the pressure gauge at various depths within the fluid and observe how pressure changes with depth. Experiment with different fluids including water, oil, and honey. Adjust the gravitational field strength and note the effects.",
    questions: [
      "How does pressure vary with increasing depth in a fluid?",
      "Which fluid exerts the greatest pressure at the same depth? Why?",
      "What is the relationship between fluid density and hydrostatic pressure?"
    ]
  },
  density: {
    title: "Density",
    url: "https://phet.colorado.edu/sims/html/density/latest/density_all.html",
    instructions: "Select the 'Intro' tab. Submerge various objects in water and observe whether they float or sink. Calculate the density of each object. Use the density reference table to identify unknown materials.",
    questions: [
      "What range of density values determines whether an object will float in water?",
      "Why might the same object float in saltwater yet sink in freshwater?",
      "Describe a method for measuring the density of an irregularly shaped object."
    ]
  }
}

export async function generatePreClass(input: AgentInput): Promise<PreClassMaterial> {
  const key = input.topic.toLowerCase()
  let video: typeof VIDEO_LIBRARY[string] | undefined
  let sim: typeof SIMULATION_LIBRARY[string] | undefined

  for (const [k, v] of Object.entries(VIDEO_LIBRARY)) {
    if (key.includes(k)) { video = v; break }
  }
  for (const [k, v] of Object.entries(SIMULATION_LIBRARY)) {
    if (key.includes(k)) { sim = v; break }
  }

  if (!video) {
    video = {
      title: `${input.topic} - Introduction | FuseSchool`,
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${input.topic} physics fuse school`),
      source: "FuseSchool - Global Education",
      duration: 7,
      concepts: [input.topic]
    }
  }

  if (!sim) {
    sim = {
      title: `${input.topic} - Interactive Simulation`,
      url: "https://phet.colorado.edu/en/search?q=" + encodeURIComponent(input.topic),
      instructions: `Find a PhET simulation related to ${input.topic}. Follow the instructions within the simulation and document your observations systematically.`,
      questions: [
        `What core concept of ${input.topic} did you learn from working with the simulation?`,
        "Formulate a prediction before running the simulation, then compare it with the observed outcomes.",
        "How does this simulation enhance your understanding of the underlying physics concepts?"
      ]
    }
  }

  const fillBlank1 = input.topic.toLowerCase()
  const blanks = [
    {
      prompt: `${input.topic} is a branch of physics that examines ____. Its principal concepts include ____ and ____.`,
      answer: `motion and physical change; relevant measurable quantities; the relationships between these quantities`
    },
    {
      prompt: `In ${input.topic}, the most commonly applied formula is ____. The SI unit for this quantity is ____.`,
      answer: `context-specific physics formulas; the corresponding SI unit`
    },
    {
      prompt: `An important law or concept in ${input.topic}: ____. A real-world application of this principle is ____.`,
      answer: `a law or concept relevant to the topic; a practical, real-world example`
    },
    {
      prompt: `A common misconception about ${input.topic} is ____, when in reality ____.`,
      answer: `a widespread misunderstanding; the accurate scientific explanation`
    }
  ]

  return {
    video_resource: {
      title: video.title,
      url: video.url,
      source: video.source,
      duration_minutes: video.duration,
      key_concepts: video.concepts,
      watch_guide: `Watch the video from the beginning to the end. Take notes on: (1) three key concepts presented, (2) one idea you already understood, and (3) one insight you have newly gained. Prepare one question to discuss in class.`
    },
    interactive_simulation: {
      title: sim.title,
      url: sim.url,
      platform: "PhET Interactive Simulations, University of Colorado Boulder",
      instructions: sim.instructions,
      inquiry_questions: sim.questions
    },
    guided_notes: {
      title: `Guided Notes: ${input.topic} | Grade ${input.grade}`,
      fill_in_blanks: blanks,
      completed_example: `After watching the video and completing the simulation, fill in these guided notes. Compare your answers with a classmate at the beginning of the lesson.`
    },
    entry_ticket_quiz: {
      questions: [
        {
          question: `Which of the following statements is TRUE about ${input.topic}?`,
          options: [
            `Statement A (correct answer)`,
            `Statement B (plausible distractor)`,
            `Statement C (common misconception)`,
            `Statement D (less relevant distractor)`
          ],
          correct: 0,
          explanation: `An explanation of why answer A is correct and the other options are incorrect.`
        },
        {
          question: `In ${input.topic}, the quantity ____ is measured in the unit ____.`,
          options: [
            `Option 1`,
            `Option 2`,
            `Option 3`,
            `Option 4`
          ],
          correct: 0,
          explanation: `An explanation of the appropriate unit of measurement.`
        },
        {
          question: `Based on the simulation you performed, what happens if ____?`,
          options: [
            `Prediction A (correct)`,
            `Prediction B (distractor)`,
            `Prediction C (distractor)`,
            `Prediction D (distractor)`
          ],
          correct: 0,
          explanation: `An explanation informed by the simulation results.`
        }
      ],
      passing_score: 2
    }
  }
}
