// Learning objectives extracted from Cambridge syllabus files
// "Candidates should be able to:" statements per topic per grade
export const SYLLABUS_OBJECTIVES: Record<number, Array<{ topic: string; objectives: string[] }>> = {
  7: [
    { topic: "Plants and Humans", objectives: ["Identify major organ systems and their functions", "Describe the principles of nutrition and respiration"] },
    { topic: "Cells", objectives: ["Use microscopes to identify cell structures", "Differentiate between plant and animal cells"] },
    { topic: "Forces", objectives: ["Describe forces as pushes or pulls", "Measure and calculate speed"] },
    { topic: "Energy", objectives: ["Identify different forms of energy", "Understand energy transfer and conservation"] },
    { topic: "Materials", objectives: ["Classify materials based on their properties", "Understand density and buoyancy"] },
    { topic: "Earth and Space", objectives: ["Describe the solar system", "Explain day, night, and seasons"] },
  ],
  8: [
    { topic: "Kinematics", objectives: ["Define distance, displacement, speed, and velocity", "Interpret distance-time and speed-time graphs"] },
    { topic: "Forces and Motion", objectives: ["Apply Newton's laws of motion", "Calculate resultant forces"] },
    { topic: "Energy Transfers", objectives: ["Analyse energy transfer in systems", "Calculate work done and power"] },
    { topic: "Waves", objectives: ["Describe wave properties", "Explain reflection, refraction, and diffraction"] },
    { topic: "Electricity", objectives: ["Build and analyse series and parallel circuits", "Calculate current, voltage, and resistance"] },
    { topic: "Magnetism", objectives: ["Describe magnetic fields", "Understand electromagnets and their applications"] },
  ],
  9: [
    { topic: "Kinematics", objectives: ["Derive and apply equations of motion", "Analyse velocity-time and acceleration-time graphs"] },
    { topic: "Dynamics", objectives: ["Apply Newton's laws to solve problems", "Understand momentum and impulse"] },
    { topic: "Forces", objectives: ["Calculate resultant forces and torque", "Analyse equilibrium conditions"] },
    { topic: "Energy", objectives: ["Apply conservation of energy principle", "Calculate efficiency of energy transfers"] },
    { topic: "Waves", objectives: ["Describe wave motion and properties", "Apply wave equation v = fλ"] },
  ],
  10: [
    { topic: "Kinematics", objectives: ["Derive and apply SUVAT equations", "Analyse projectile motion", "Interpret velocity-time and acceleration-time graphs"] },
    { topic: "Dynamics", objectives: ["Apply Newton's laws to solve problems", "Understand momentum, impulse, and conservation of momentum"] },
    { topic: "Energy", objectives: ["Apply conservation of energy principle", "Calculate work done by a force, power, and efficiency"] },
    { topic: "Waves", objectives: ["Describe wave motion and properties", "Apply wave equation v = fλ", "Explain reflection, refraction, diffraction and interference"] },
    { topic: "Electricity", objectives: ["Analyse series and parallel circuits", "Calculate current, voltage, resistance, and electrical power"] },
    { topic: "Magnetism", objectives: ["Describe magnetic field patterns", "Understand electromagnetic induction and its applications"] },
  ],
  11: [
    { topic: "Kinematics", objectives: ["Derive and apply SUVAT equations for uniform acceleration", "Analyse projectile motion in two dimensions"] },
    { topic: "Dynamics", objectives: ["Apply Newton's laws to solve problems involving multiple forces", "Analyse momentum conservation in one and two dimensions"] },
    { topic: "Waves", objectives: ["Describe progressive and stationary waves", "Apply the Doppler effect to sound and light"] },
    { topic: "Electricity", objectives: ["Analyse DC circuits using Kirchhoff's laws", "Calculate electrical power, energy, and resistance"] },
    { topic: "Magnetism", objectives: ["Describe magnetic flux and flux density", "Apply Faraday's law of electromagnetic induction"] },
  ],
  12: [
    { topic: "Thermal Physics", objectives: ["Apply ideal gas laws and the kinetic theory of gases", "Analyse thermodynamic processes including isothermal and adiabatic"] },
    { topic: "Oscillations", objectives: ["Describe simple harmonic motion and its characteristics", "Analyse energy transformations in oscillating systems"] },
    { topic: "Fields", objectives: ["Apply Newton's law of gravitation and Coulomb's law", "Analyse electric and gravitational field patterns"] },
    { topic: "Quantum Physics", objectives: ["Describe wave-particle duality and the photoelectric effect", "Apply the Schrödinger equation to simple systems"] },
    { topic: "Nuclear Physics", objectives: ["Describe nuclear structure, decay processes, and binding energy", "Analyse particle interactions and conservation laws"] },
  ],
}

export function getObjectivesForGrade(grade: number, topicFilter?: string): Array<{ topic: string; objectives: string[] }> {
  const gradeData = SYLLABUS_OBJECTIVES[grade] || SYLLABUS_OBJECTIVES[10] || []
  if (!topicFilter) return gradeData
  const lower = topicFilter.toLowerCase()
  return gradeData.filter(item => item.topic.toLowerCase().includes(lower) || lower.includes(item.topic.toLowerCase()))
}
