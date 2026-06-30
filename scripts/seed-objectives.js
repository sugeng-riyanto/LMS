const { Client } = require("pg")
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") })

const client = new Client({ connectionString: process.env.SUPABASE_DB_CONNECTION })

// Learning objectives per grade based on Cambridge syllabuses
const DATA = {
  7: { ref: "0893 Stage 7", curriculum: "Cambridge Checkpoint", units: [
    { id: "7.1", topic: "Plants and Humans as Organisms", objectives: ["Describe the structure and function of major organ systems", "Explain the principles of nutrition and respiration"] },
    { id: "7.2", topic: "Cells and Organisation", objectives: ["Identify cell structures using microscopes", "Differentiate between plant and animal cells"] },
    { id: "7.3", topic: "Forces and Motion", objectives: ["Describe forces as pushes or pulls", "Measure and calculate speed"] },
    { id: "7.4", topic: "Energy", objectives: ["Identify different forms of energy", "Understand energy transfer and conservation"] },
    { id: "7.5", topic: "Materials and Properties", objectives: ["Classify materials based on properties", "Understand density and buoyancy"] },
    { id: "7.6", topic: "Earth and Space", objectives: ["Describe the solar system", "Explain day, night, and seasons"] },
  ]},
  8: { ref: "0893 Stage 8", curriculum: "Cambridge Checkpoint", units: [
    { id: "8.1", topic: "Kinematics", objectives: ["Define distance, displacement, speed, and velocity", "Interpret distance-time and speed-time graphs"] },
    { id: "8.2", topic: "Forces and Motion", objectives: ["Apply Newton's laws of motion", "Calculate resultant forces"] },
    { id: "8.3", topic: "Energy Transfers", objectives: ["Analyse energy transfer in systems", "Calculate work done and power"] },
    { id: "8.4", topic: "Waves and Sound", objectives: ["Describe wave properties", "Explain reflection, refraction, and diffraction"] },
    { id: "8.5", topic: "Electricity", objectives: ["Build and analyse series and parallel circuits", "Calculate current, voltage, and resistance"] },
    { id: "8.6", topic: "Magnetism", objectives: ["Describe magnetic fields", "Understand electromagnets and their applications"] },
  ]},
  9: { ref: "0625 IGCSE (Half)", curriculum: "Cambridge IGCSE", units: [
    { id: "9.1", topic: "Kinematics", objectives: ["Derive and apply equations of motion", "Analyse velocity-time and acceleration-time graphs"] },
    { id: "9.2", topic: "Dynamics", objectives: ["Apply Newton's laws to solve problems", "Understand momentum and impulse"] },
    { id: "9.3", topic: "Forces", objectives: ["Calculate resultant forces and torque", "Analyse equilibrium conditions"] },
    { id: "9.4", topic: "Energy", objectives: ["Apply conservation of energy principle", "Calculate efficiency of energy transfers"] },
    { id: "9.5", topic: "Thermal Physics", objectives: ["Understand kinetic model of matter", "Explain thermal expansion and heat transfer"] },
    { id: "9.6", topic: "Waves", objectives: ["Describe wave motion and properties", "Apply wave equation v = fλ"] },
  ]},
  10: { ref: "0625 IGCSE (Full)", curriculum: "Cambridge IGCSE", units: [
    { id: "10.1", topic: "Light and Optics", objectives: ["Apply laws of reflection and refraction", "Construct ray diagrams for lenses"] },
    { id: "10.2", topic: "Sound", objectives: ["Describe sound wave properties", "Explain pitch, loudness, and quality"] },
    { id: "10.3", topic: "Electricity", objectives: ["Analyse series and parallel circuits", "Calculate electrical power and energy"] },
    { id: "10.4", topic: "Magnetism and Electromagnetism", objectives: ["Describe magnetic field patterns", "Understand electromagnetic induction"] },
    { id: "10.5", topic: "Atomic Physics", objectives: ["Describe atomic structure", "Explain radioactivity and half-life"] },
    { id: "10.6", topic: "Space Physics", objectives: ["Describe the solar system and universe", "Understand gravitational fields and orbits"] },
  ]},
  11: { ref: "9702 AS Level", curriculum: "Cambridge AS Level", units: [
    { id: "11.1", topic: "Kinematics", objectives: ["Derive and apply SUVAT equations", "Analyse projectile motion"] },
    { id: "11.2", topic: "Dynamics", objectives: ["Apply Newton's laws to complex systems", "Analyse momentum conservation"] },
    { id: "11.3", topic: "Work and Energy", objectives: ["Apply work-energy theorem", "Analyse power in mechanical systems"] },
    { id: "11.4", topic: "Waves", objectives: ["Describe progressive and stationary waves", "Apply Doppler effect"] },
    { id: "11.5", topic: "Electricity", objectives: ["Analyse DC circuits", "Understand Kirchhoff's laws"] },
    { id: "11.6", topic: "Magnetism", objectives: ["Describe magnetic flux and flux density", "Apply Faraday's law of induction"] },
  ]},
  12: { ref: "9702 A Level + TKA", curriculum: "Cambridge A Level", units: [
    { id: "12.1", topic: "Thermal Physics", objectives: ["Apply ideal gas laws", "Analyse thermodynamics processes"] },
    { id: "12.2", topic: "Oscillations", objectives: ["Describe simple harmonic motion", "Analyse energy in oscillating systems"] },
    { id: "12.3", topic: "Gravitational Fields", objectives: ["Apply Newton's law of gravitation", "Analyse orbital motion"] },
    { id: "12.4", topic: "Electric and Magnetic Fields", objectives: ["Analyse electric field patterns", "Apply electromagnetic induction"] },
    { id: "12.5", topic: "Quantum Physics", objectives: ["Describe wave-particle duality", "Apply photoelectric effect equation"] },
    { id: "12.6", topic: "Nuclear and Particle Physics", objectives: ["Describe nuclear structure and decay", "Analyse particle interactions and conservation laws"] },
  ]},
}

async function seed() {
  await client.connect()
  console.log("Seeding syllabus objectives...\n")

  let total = 0
  for (const [gradeStr, data] of Object.entries(DATA)) {
    const grade = parseInt(gradeStr)
    for (const unit of data.units) {
      await client.query(`
        INSERT INTO public.syllabus_objectives (grade, unit_id, topic, objectives, syllabus_ref, curriculum, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (grade, unit_id) DO UPDATE SET objectives = $4, topic = $3
      `, [grade, unit.id, unit.topic, unit.objectives, data.ref, data.curriculum, parseInt(unit.id.split(".")[1])])
      total++
      process.stdout.write(".")
    }
  }

  console.log(`\n\n${total} objectives seeded across Grades 7-12.`)
  await client.end()
}
seed()
