const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const match = envContent.match(/^SUPABASE_DB_CONNECTION=(.+)$/m);
const conn = match ? match[1].trim() : null;

const topics = [
  // Grade 7: Cambridge Lower Secondary Stage 7
  { grade: 7, unit_id: '7.3', topic: 'Forces in Space', subtopics: ['Gravity', 'Solar System', 'Orbits', 'Eclipses'], syllabus_ref: '0893_Stage7', curriculum: 'cambridge', suggested_weeks: [1,2,3,4,5] },
  { grade: 7, unit_id: '7.6', topic: 'Energy and Sound', subtopics: ['Energy transfers', 'Dissipation', 'Sound waves', 'Vacuum'], syllabus_ref: '0893_Stage7', curriculum: 'cambridge', suggested_weeks: [6,7,8,9,10] },
  { grade: 7, unit_id: '7.7', topic: 'Environment and Ecosystems', subtopics: ['Plate tectonics', 'Water cycle', 'Atmosphere'], syllabus_ref: '0893_Stage7', curriculum: 'cambridge', suggested_weeks: [11,12,13,14] },
  { grade: 7, unit_id: '7.9', topic: 'Electricity', subtopics: ['Electron flow', 'Conductors/insulators', 'Series circuits'], syllabus_ref: '0893_Stage7', curriculum: 'cambridge', suggested_weeks: [15,16,17,18,19] },

  // Grade 8: Cambridge Lower Secondary Stage 8
  { grade: 8, unit_id: '8.4', topic: 'Light and Colour', subtopics: ['Reflection', 'Refraction', 'Dispersion', 'Colour addition'], syllabus_ref: '0893_Stage8', curriculum: 'cambridge', suggested_weeks: [1,2,3,4] },
  { grade: 8, unit_id: '8.7', topic: 'Speed, Motion and Forces', subtopics: ['Speed = d/t', 'd-t graphs', 'Balanced forces', 'Moments'], syllabus_ref: '0893_Stage8', curriculum: 'cambridge', suggested_weeks: [5,6,7,8,9] },
  { grade: 8, unit_id: '8.8', topic: 'Earth and Solar System', subtopics: ['Magnetic field', 'Ecosystems', 'Climate', 'Asteroids'], syllabus_ref: '0893_Stage8', curriculum: 'cambridge', suggested_weeks: [10,11,12,13] },
  { grade: 8, unit_id: '8.9', topic: 'Applications of Science', subtopics: ['Renewable energy', 'Electromagnets', 'Endo/exothermic'], syllabus_ref: '0893_Stage8', curriculum: 'cambridge', suggested_weeks: [14,15,16,17] },

  // Grade 9: Half IGCSE 0625
  { grade: 9, unit_id: 'T1', topic: 'Motion, Forces and Energy', subtopics: ['1.1-1.8 Motion', 'Forces', 'Energy'], syllabus_ref: '0625_y26-28', curriculum: 'igcse', suggested_weeks: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { grade: 9, unit_id: 'T3', topic: 'Waves', subtopics: ['3.1-3.4 Wave properties', 'Light', 'Sound'], syllabus_ref: '0625_y26-28', curriculum: 'igcse', suggested_weeks: [13,14,15,16,17,18] },
  { grade: 9, unit_id: 'T4p', topic: 'Electricity and Magnetism (partial)', subtopics: ['4.1-4.3 Electric circuits', 'Magnetism'], syllabus_ref: '0625_y26-28', curriculum: 'igcse', suggested_weeks: [19,20,21,22,23,24] },

  // Grade 10: Full IGCSE 0625
  { grade: 10, unit_id: 'T2', topic: 'Thermal Physics', subtopics: ['Kinetic model', 'Thermal properties', 'Gas laws'], syllabus_ref: '0625_y26-28', curriculum: 'igcse', suggested_weeks: [1,2,3,4,5,6] },
  { grade: 10, unit_id: 'T4', topic: 'Electricity and Magnetism', subtopics: ['Circuits', 'Electromagnetism', 'Practical skills'], syllabus_ref: '0625_y26-28', curriculum: 'igcse', suggested_weeks: [7,8,9,10,11,12] },
  { grade: 10, unit_id: 'T5', topic: 'Nuclear Physics', subtopics: ['Atomic model', 'Radioactivity', 'Half-life'], syllabus_ref: '0625_y26-28', curriculum: 'igcse', suggested_weeks: [13,14,15,16] },
  { grade: 10, unit_id: 'T6', topic: 'Space Physics', subtopics: ['Solar system', 'Stars', 'Universe'], syllabus_ref: '0625_y26-28', curriculum: 'igcse', suggested_weeks: [17,18,19,20] },
  { grade: 10, unit_id: 'PP', topic: 'Past Paper Drill', subtopics: ['Paper 1', 'Paper 2', 'Paper 4', 'Paper 5/6'], syllabus_ref: '0625_y26-28', curriculum: 'igcse', suggested_weeks: [21,22,23,24,25,26] },

  // Grade 11: AS Level 9702
  { grade: 11, unit_id: 'AS1', topic: 'Physical quantities and units', subtopics: ['SI units', 'Errors', 'Scalars/vectors'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [1,2] },
  { grade: 11, unit_id: 'AS2', topic: 'Kinematics', subtopics: ['SUVAT derivation', 'Graphs'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [3,4] },
  { grade: 11, unit_id: 'AS3', topic: 'Dynamics', subtopics: ["Newton's laws", 'Momentum'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [5,6] },
  { grade: 11, unit_id: 'AS4', topic: 'Forces, density and pressure', subtopics: ['Moments', 'Equilibrium', 'Hydrostatic'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [7,8] },
  { grade: 11, unit_id: 'AS5', topic: 'Work, energy and power', subtopics: ['Kinetic energy', 'Potential energy', 'Conservation'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [9,10] },
  { grade: 11, unit_id: 'AS6', topic: 'Deformation of solids', subtopics: ["Hooke's law", 'Young modulus'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [11,12] },
  { grade: 11, unit_id: 'AS7', topic: 'Waves', subtopics: ['Progressive', 'Doppler', 'Polarization'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [13,14] },
  { grade: 11, unit_id: 'AS8', topic: 'Superposition', subtopics: ['Stationary waves', 'Diffraction', 'Interference', 'Gratings'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [15,16] },
  { grade: 11, unit_id: 'AS9', topic: 'Electricity', subtopics: ['Current', 'p.d.', 'Resistance', 'Resistivity'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [17,18] },
  { grade: 11, unit_id: 'AS10', topic: 'D.C. circuits', subtopics: ['Kirchhoff', 'Potential dividers'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [19,20] },
  { grade: 11, unit_id: 'AS11', topic: 'Particle physics', subtopics: ['Atoms', 'Nuclei', 'Fundamental particles'], syllabus_ref: '9702_y25-27', curriculum: 'as_level', suggested_weeks: [21,22] },

  // Grade 12: A Level 9702 + TKA
  { grade: 12, unit_id: 'A12', topic: 'Motion in a circle', subtopics: ['Angular velocity', 'Centripetal force'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [1,2] },
  { grade: 12, unit_id: 'A13', topic: 'Gravitational fields', subtopics: ['Newton law', 'Field strength', 'Potential'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [3,4] },
  { grade: 12, unit_id: 'A14', topic: 'Temperature', subtopics: ['Thermal equilibrium', 'Temperature scales'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [5] },
  { grade: 12, unit_id: 'A15', topic: 'Ideal gases', subtopics: ['Gas laws', 'Kinetic theory'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [6,7] },
  { grade: 12, unit_id: 'A16', topic: 'Thermodynamics', subtopics: ['First law', 'Carnot cycle', 'Entropy'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [8,9,10] },
  { grade: 12, unit_id: 'A17', topic: 'Oscillations', subtopics: ['SHM', 'Energy', 'Damping'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [11,12] },
  { grade: 12, unit_id: 'A18', topic: 'Electric fields', subtopics: ['Field strength', 'Potential', 'Capacitors'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [13,14] },
  { grade: 12, unit_id: 'A19', topic: 'Capacitance', subtopics: ['Energy storage', 'RC circuits'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [15,16] },
  { grade: 12, unit_id: 'A20', topic: 'Magnetic fields', subtopics: ['Force on charge', 'DC motor'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [17,18] },
  { grade: 12, unit_id: 'A21', topic: 'Alternating currents', subtopics: ['RMS', 'Transformers', 'Rectification'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [19,20] },
  { grade: 12, unit_id: 'A22', topic: 'Quantum physics', subtopics: ['Photon', 'Photoelectric', 'Wave-particle'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [21,22] },
  { grade: 12, unit_id: 'A23', topic: 'Nuclear physics', subtopics: ['Binding energy', 'Decay', 'Fission/fusion'], syllabus_ref: '9702_y25-27', curriculum: 'a_level', suggested_weeks: [23,24] },
  { grade: 12, unit_id: 'TKA1', topic: 'Kinematika (TKA)', subtopics: ['GLB', 'GLBB', 'Parabola', 'Melingkar'], syllabus_ref: 'TKA_2025', curriculum: 'tka', suggested_weeks: [1,2,3] },
  { grade: 12, unit_id: 'TKA2', topic: 'Dinamika (TKA)', subtopics: ['Newton', 'Momentum', 'Impuls', 'Rotasi'], syllabus_ref: 'TKA_2025', curriculum: 'tka', suggested_weeks: [4,5,6] },
  { grade: 12, unit_id: 'TKA3', topic: 'Fluida (TKA)', subtopics: ['Statis', 'Dinamis', 'Pascal', 'Archimedes', 'Bernoulli'], syllabus_ref: 'TKA_2025', curriculum: 'tka', suggested_weeks: [7,8,9] },
  { grade: 12, unit_id: 'TKA4', topic: 'Gelombang (TKA)', subtopics: ['Bunyi', 'Cahaya', 'Optik'], syllabus_ref: 'TKA_2025', curriculum: 'tka', suggested_weeks: [10,11,12] },
  { grade: 12, unit_id: 'TKA5', topic: 'Kalor & Termodinamika (TKA)', subtopics: ['Gas Ideal', 'Hukum Termo', 'Mesin Kalor'], syllabus_ref: 'TKA_2025', curriculum: 'tka', suggested_weeks: [13,14,15] },
  { grade: 12, unit_id: 'TKA6', topic: 'Kelistrikan (TKA)', subtopics: ['Listrik Statis', 'Rangkaian DC', 'Kirchhoff'], syllabus_ref: 'TKA_2025', curriculum: 'tka', suggested_weeks: [16,17,18] },
];

async function run() {
  const client = new Client({ connectionString: conn });
  await client.connect();
  let ok = 0, fail = 0;
  for (const t of topics) {
    try {
      await client.query(
        `INSERT INTO public.syllabus_topics (grade, unit_id, topic, subtopics, syllabus_ref, curriculum, suggested_weeks)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::int[])
         ON CONFLICT (grade, unit_id) DO UPDATE SET topic = $3, subtopics = $4::jsonb`,
        [t.grade, t.unit_id, t.topic, JSON.stringify(t.subtopics), t.syllabus_ref, t.curriculum, t.suggested_weeks]
      );
      ok++;
    } catch (e) {
      console.error(`FAIL [${t.grade} ${t.unit_id}]:`, e.message.slice(0, 100));
      fail++;
    }
  }
  console.log(`${ok} seeded, ${fail} failed`);
  await client.end();
}

run().catch(console.error);
