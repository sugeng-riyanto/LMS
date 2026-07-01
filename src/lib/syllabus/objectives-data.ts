// Learning objectives extracted from Cambridge syllabus files
// "Candidates should be able to:" statements per topic per grade
// References: Cambridge 0893 Stage 7-8, IGCSE 0625, AS/A Level 9702
export const SYLLABUS_OBJECTIVES: Record<number, Array<{ topic: string; objectives: string[] }>> = {
  7: [
    { topic: "Forces", objectives: [
      "Describe forces as pushes or pulls and measure force in newtons using a spring balance",
      "Identify contact and non-contact forces (gravitational, magnetic, electrostatic)",
      "Recognise that unbalanced forces change the motion of an object",
      "Understand friction as a force that opposes motion and can be reduced or increased",
      "Describe the effect of gravity on objects near Earth's surface",
      "Use the formula speed = distance / time in simple calculations",
      "Interpret simple distance–time graphs and identify stationary and moving objects",
      "Understand the concept of weight as the gravitational force on an object"
    ]},
    { topic: "Kinematics", objectives: [
      "Define distance, displacement, speed, and velocity using appropriate SI units",
      "Measure distance and time accurately using rulers and stopwatches",
      "Calculate average speed from total distance and total time",
      "Plot and interpret distance–time graphs for stationary and moving objects",
      "Recognise the difference between speed and velocity (velocity has direction)",
      "Describe acceleration as a change in velocity per unit time"
    ]},
    { topic: "Energy", objectives: [
      "Identify different forms of energy: kinetic, potential, thermal, chemical, electrical, light, sound",
      "Understand the principle of conservation of energy",
      "Describe energy transfers and transformations in everyday situations",
      "Recognise that energy is measured in joules (J)",
      "Distinguish between renewable and non-renewable energy resources",
      "Describe simple energy chains (e.g. chemical → electrical → light + heat)"
    ]},
    { topic: "Density", objectives: [
      "Define density as mass per unit volume (ρ = m/V)",
      "Measure mass using a balance and volume using a measuring cylinder",
      "Calculate the density of regular and irregular objects",
      "Predict whether an object will float or sink based on density comparison",
      "Understand that materials of different density form layers in liquids"
    ]},
    { topic: "Pressure", objectives: [
      "Define pressure as force per unit area (P = F/A)",
      "Explain why sharp objects cut more easily using the concept of pressure",
      "Describe pressure in liquids increasing with depth",
      "Understand atmospheric pressure and its effects in everyday life",
      "Calculate pressure exerted by a solid object on a surface"
    ]},
    { topic: "Thermal", objectives: [
      "Distinguish between conduction, convection, and radiation as methods of heat transfer",
      "Identify good and bad thermal conductors and insulators",
      "Describe how convection currents form in liquids and gases",
      "Understand that radiation does not require a medium to travel",
      "Explain everyday thermal phenomena (thermos flask, sea breeze, greenhouse effect)"
    ]},
    { topic: "Waves", objectives: [
      "Describe wave motion as the transfer of energy without net transfer of matter",
      "Distinguish between transverse and longitudinal waves with examples",
      "Define wavelength, frequency, amplitude, and wave speed",
      "Use the wave equation v = fλ in simple calculations",
      "Describe reflection, refraction, and diffraction of waves"
    ]},
    { topic: "Sound", objectives: [
      "Describe sound as a longitudinal wave requiring a medium to travel",
      "Explain that sound cannot travel through a vacuum",
      "Relate loudness to amplitude and pitch to frequency",
      "Describe the range of human hearing (20 Hz – 20 kHz)",
      "Calculate the speed of sound using echo methods",
      "Describe applications of sound including ultrasound"
    ]},
    { topic: "Light", objectives: [
      "Describe the reflection of light using the law of reflection",
      "Construct ray diagrams for plane mirrors",
      "Explain refraction of light at the boundary between two media",
      "Describe dispersion of white light through a prism",
      "State that light travels in straight lines and at 3×10⁸ m/s in a vacuum"
    ]},
    { topic: "Electricity", objectives: [
      "Describe electric current as the flow of electric charge",
      "Distinguish between conductors and insulators with examples",
      "Construct simple series circuits and measure current using an ammeter",
      "Understand that voltage is measured across components using a voltmeter",
      "Describe the relationship between current, voltage, and resistance",
      "Compare series and parallel circuits in terms of current and voltage"
    ]},
    { topic: "Magnetism", objectives: [
      "Describe the properties of magnets (attraction, repulsion, poles)",
      "Identify magnetic and non-magnetic materials",
      "Plot magnetic field lines around a bar magnet using a compass",
      "Describe the Earth's magnetic field and how a compass works",
      "Understand that an electric current can produce a magnetic effect (electromagnet)"
    ]},
  ],
  8: [
    { topic: "Kinematics", objectives: [
      "Define distance, displacement, speed, and velocity with correct SI units",
      "Calculate speed using v = s/t and analyse distance–time graphs",
      "Determine velocity as speed in a given direction",
      "Describe acceleration as change in velocity per unit time",
      "Calculate acceleration using a = Δv/Δt",
      "Interpret speed–time graphs to find distance travelled (area under graph)",
      "Calculate speed from the gradient of a distance–time graph"
    ]},
    { topic: "Forces", objectives: [
      "Calculate resultant forces when multiple forces act on an object",
      "Apply Newton's First Law: objects remain at rest or uniform motion unless acted upon",
      "Apply Newton's Second Law: F = ma to solve problems",
      "Apply Newton's Third Law: action-reaction force pairs",
      "Describe the effects of friction and air resistance on motion",
      "Calculate the moment of a force (M = Fd) and apply to levers",
      "Understand the principle of moments and conditions for equilibrium",
      "Describe centre of gravity and its effect on stability"
    ]},
    { topic: "Energy", objectives: [
      "Calculate kinetic energy using Eₖ = ½mv²",
      "Calculate gravitational potential energy using Eₚ = mgh",
      "Apply the principle of conservation of energy to simple systems",
      "Calculate work done by a force (W = Fd)",
      "Define power as the rate of doing work (P = W/t)",
      "Evaluate the efficiency of energy transfers and devices",
      "Describe renewable energy resources: solar, wind, hydroelectric, geothermal"
    ]},
    { topic: "Light", objectives: [
      "Apply the law of reflection: angle of incidence equals angle of reflection",
      "Construct ray diagrams for reflection in plane mirrors",
      "Describe the properties of virtual images formed by plane mirrors",
      "Explain refraction using Snell's law qualitatively",
      "Describe dispersion of white light into a spectrum using a prism",
      "Explain colour addition and subtraction in terms of light absorption and reflection",
      "Describe how lenses form images using ray diagrams"
    ]},
    { topic: "Waves", objectives: [
      "Describe wave motion in terms of energy transfer without net matter transfer",
      "Distinguish between transverse and longitudinal waves with examples",
      "Define amplitude, wavelength, frequency, and period of a wave",
      "Apply the wave equation v = fλ to solve problems",
      "Describe reflection and refraction of water waves using ripple tank",
      "Explain diffraction of waves around obstacles and through gaps"
    ]},
    { topic: "Pressure", objectives: [
      "Apply pressure formula P = F/A to solid, liquid, and gas contexts",
      "Describe pressure variation with depth in a liquid",
      "Calculate hydrostatic pressure using P = ρgh",
      "Explain atmospheric pressure and its measurement using a barometer",
      "Understand applications of pressure in hydraulic systems (Pascal's principle)"
    ]},
    { topic: "Magnetism", objectives: [
      "Describe magnetic field patterns around bar magnets and Earth",
      "Understand that like poles repel and unlike poles attract",
      "Describe the magnetic effect of a current-carrying wire",
      "Construct a simple electromagnet and describe methods to strengthen it",
      "Describe applications of electromagnets: relays, bells, cranes"
    ]},
    { topic: "Electricity", objectives: [
      "Measure current using ammeters (in series) and voltage using voltmeters (in parallel)",
      "Apply Ohm's law: V = IR to calculate resistance",
      "Calculate total resistance in series and parallel circuits",
      "Describe factors affecting resistance: length, thickness, material, temperature",
      "Analyse series and parallel circuits to find current, voltage, and resistance"
    ]},
    { topic: "Density", objectives: [
      "Define density as ρ = m/V with SI units (kg/m³)",
      "Determine density of regular solids using V = l×w×h",
      "Find density of irregular solids using water displacement (Eureka can)",
      "Calculate density of liquids using a density bottle or measuring cylinder",
      "Apply density principles to explain floating, sinking, and hydrometers"
    ]},
    { topic: "Thermal", objectives: [
      "Distinguish between conduction, convection, and radiation with real examples",
      "Describe thermal conductivity and identify good/poor conductors",
      "Explain the mechanism of convection currents in fluids",
      "Understand that thermal radiation is electromagnetic and can travel through vacuum",
      "Apply the concept of specific heat capacity: Q = mcΔT",
      "Describe practical applications of thermal insulation in buildings"
    ]},
  ],
  9: [
    { topic: "Kinematics", objectives: [
      "Derive and apply SUVAT equations of motion for uniform acceleration",
      "Solve problems using v = u + at, s = ut + ½at², v² = u² + 2as",
      "Sketch, plot, and interpret displacement–time and velocity–time graphs",
      "Calculate acceleration from the gradient of a velocity–time graph",
      "Determine distance travelled from the area under a velocity–time graph",
      "Analyse projectile motion as two independent perpendicular motions",
      "Describe the motion of falling objects with and without air resistance",
      "Understand terminal velocity from the balance of forces"
    ]},
    { topic: "Forces", objectives: [
      "Apply Newton's three laws to solve problems involving multiple forces",
      "Calculate resultant forces using vector addition (free-body diagrams)",
      "Apply F = ma to determine acceleration, mass, or net force",
      "Understand momentum as p = mv and conservation of momentum",
      "Calculate impulse as force × time and its effect on momentum change",
      "Describe elastic and inelastic collisions in terms of momentum conservation",
      "Calculate the moment of a force and apply the principle of moments"
    ]},
    { topic: "Energy", objectives: [
      "Calculate kinetic energy (Eₖ = ½mv²) and gravitational potential energy (Eₚ = mgh)",
      "Apply the work–energy principle: work done = energy transferred",
      "Calculate work done by a constant force (W = Fd cos θ)",
      "Define power as rate of work done (P = W/t = Fv)",
      "Apply the principle of conservation of energy to complex systems",
      "Calculate efficiency of energy transfers (efficiency = useful output/total input)",
      "Evaluate energy resources: renewable vs non-renewable, environmental impact"
    ]},
    { topic: "Waves", objectives: [
      "Describe wave motion as transfer of energy without net matter movement",
      "Apply the wave equation v = fλ across all wave contexts",
      "Describe reflection, refraction, and diffraction of waves",
      "Use ripple tank investigation to observe wave behaviour experimentally",
      "Understand the electromagnetic spectrum: radio, microwave, IR, visible, UV, X-ray, gamma",
      "Describe applications and hazards of each region of the EM spectrum",
      "Explain the Doppler effect for sound waves"
    ]},
    { topic: "Light", objectives: [
      "Apply the laws of reflection and refraction with ray diagrams",
      "Describe the formation of images by plane mirrors, concave and convex mirrors",
      "Apply Snell's law: n₁ sin θ₁ = n₂ sin θ₂ for refraction calculations",
      "Calculate critical angle and total internal reflection: sin c = 1/n",
      "Describe applications of total internal reflection: optical fibres, endoscopes",
      "Construct ray diagrams for converging and diverging lenses",
      "Describe image formation by lenses and use the lens formula 1/f = 1/v + 1/u"
    ]},
    { topic: "Sound", objectives: [
      "Describe sound as a longitudinal wave requiring a medium",
      "Explain the relationship between loudness and amplitude, pitch and frequency",
      "Calculate the speed of sound using echo timing methods",
      "Describe the structure and function of the human ear",
      "Understand the range of audible frequencies for humans",
      "Describe applications of ultrasound in medicine and industry"
    ]},
    { topic: "Electricity", objectives: [
      "Define electric current as rate of flow of charge (I = Q/t)",
      "Define electromotive force (EMF) and potential difference",
      "Apply Ohm's law (V = IR) to calculate current, voltage, or resistance",
      "Calculate total resistance in series (Rₜ = R₁ + R₂ + …) and parallel (1/Rₜ = 1/R₁ + 1/R₂ + …)",
      "Describe the factors affecting resistance of a wire",
      "Analyse series and parallel circuits: current and potential difference distribution",
      "Calculate electrical power (P = VI = I²R = V²/R) and energy consumed (E = Pt)"
    ]},
    { topic: "Magnetism", objectives: [
      "Describe magnetic field patterns using field lines",
      "Understand magnetic flux and magnetic flux density (B)",
      "Describe the magnetic force on a current-carrying conductor (F = BIl sin θ)",
      "Explain the operation of a simple DC motor using Fleming's left-hand rule",
      "Describe electromagnetic induction and Faraday's law",
      "Apply Lenz's law to determine direction of induced EMF",
      "Compare AC and DC generators and describe the structure of a transformer"
    ]},
  ],
  10: [
    { topic: "Kinematics", objectives: [
      "Derive and apply SUVAT equations to solve complex motion problems",
      "Analyse projectile motion in two dimensions using independence of horizontal and vertical motion",
      "Interpret displacement–time, velocity–time, and acceleration–time graphs",
      "Calculate instantaneous velocity from curved displacement–time graphs",
      "Determine acceleration from non-linear velocity–time graphs",
      "Apply equations of motion to objects falling under gravity with/without air resistance",
      "Analyse motion graphs to determine distance, displacement, velocity, and acceleration"
    ]},
    { topic: "Forces", objectives: [
      "Apply Newton's laws to solve problems in a wide range of contexts",
      "Calculate resultant forces using vector addition (parallelogram law and Pythagoras)",
      "Apply F = ma in systems involving multiple connected objects",
      "Apply conservation of momentum to elastic and inelastic collisions",
      "Understand impulse as the product of force and time (Ft = Δp)",
      "Analyse situations involving friction, drag, and terminal velocity",
      "Describe circular motion and centripetal force qualitatively",
      "Apply the principle of moments and equilibrium conditions to solve problems"
    ]},
    { topic: "Energy", objectives: [
      "Apply conservation of energy to closed systems (Eₖ + Eₚ + Eₜₕ = constant)",
      "Calculate work done by a force with changing angle (W = Fd cos θ)",
      "Analyse power in mechanical and electrical systems (P = Fv = VI)",
      "Evaluate efficiency of complex energy transfer chains",
      "Calculate Sankey diagrams for energy flow analysis",
      "Compare renewable and non-renewable energy resources in terms of availability, cost, and environmental impact"
    ]},
    { topic: "Thermal", objectives: [
      "Calculate specific heat capacity using Q = mcΔT in experimental contexts",
      "Calculate specific latent heat using Q = mL (fusion and vaporisation)",
      "Describe changes of state in terms of latent heat and molecular behaviour",
      "Apply the kinetic particle model to explain thermal phenomena",
      "Describe Boyle's law (PV = constant) for gases at constant temperature",
      "Apply the ideal gas law (PV = nRT) conceptually",
      "Interpret heating and cooling curves including change of state plateaus"
    ]},
    { topic: "Waves", objectives: [
      "Describe wave motion in terms of phase difference, coherence, and superposition",
      "Apply v = fλ across mechanical and electromagnetic waves",
      "Describe the electromagnetic spectrum: all regions and their applications",
      "Explain reflection, refraction, diffraction, and interference of waves",
      "Describe the Young double-slit experiment as evidence for wave nature of light",
      "Calculate fringe spacing in interference patterns",
      "Apply the diffraction grating equation d sin θ = nλ"
    ]},
    { topic: "Light", objectives: [
      "Construct ray diagrams for reflection and refraction with correct angles",
      "Apply Snell's law to calculate refractive index and critical angle",
      "Describe total internal reflection and its applications (fibre optics, periscopes, endoscopy)",
      "Construct ray diagrams for converging/convex and diverging/concave lenses",
      "Apply the lens formula 1/f = 1/u + 1/v to calculate image position and magnification",
      "Describe the formation of real and virtual images by lenses",
      "Explain the correction of vision defects (myopia, hyperopia) using lenses"
    ]},
    { topic: "Sound", objectives: [
      "Describe sound as a longitudinal wave and calculate its speed using v = fλ",
      "Explain how sound waves are produced, transmitted, and detected",
      "Interpret oscilloscope traces to determine amplitude, frequency, and waveform",
      "Describe the relationship between intensity, amplitude, and distance",
      "Explain the Doppler effect for sound with examples",
      "Describe the principles and applications of ultrasound imaging (SONAR, medical scanning)"
    ]},
    { topic: "Electricity", objectives: [
      "Apply Ohm's law and the formula for electrical power in combined calculations",
      "Analyse series and parallel circuits including mixed configurations",
      "Calculate EMF and internal resistance of a cell (ε = V + Ir)",
      "Describe the potential divider principle and its applications (sensors, variable resistors)",
      "Calculate resistance in Wheatstone bridge circuits",
      "Analyse current–voltage characteristics (ohmic and non-ohmic conductors)",
      "Understand the relationship between resistivity, length, and cross-sectional area (R = ρL/A)"
    ]},
    { topic: "Magnetism", objectives: [
      "Describe magnetic flux and flux density (B) with SI units",
      "Apply Faraday's law to calculate induced EMF (ε = −N ΔΦ/Δt)",
      "Apply Lenz's law to determine the direction of induced current",
      "Describe the construction and operation of AC and DC generators",
      "Explain the operation of a transformer and apply Vₚ/Vₛ = Nₚ/Nₛ",
      "Describe the principles of electromagnetic induction in microphones, speakers, and dynamos",
      "Analyse the efficiency of transformers and calculate power (Pₚ = Pₛ for ideal transformer)"
    ]},
    { topic: "Nuclear Physics", objectives: [
      "Describe the structure of the atom: protons, neutrons, electrons",
      "Understand radioactive decay: alpha, beta, and gamma radiation",
      "Write balanced nuclear equations for radioactive decay",
      "Describe half-life and use it to determine the age of materials",
      "Explain nuclear fission and chain reactions in reactors",
      "Describe nuclear fusion and its role in energy production in stars",
      "Evaluate the benefits and risks of nuclear energy",
      "Describe the uses of radioactivity in medicine (tracers, radiotherapy, sterilisation)"
    ]},
    { topic: "Space Physics", objectives: [
      "Describe the solar system: Sun, planets, moons, asteroids, comets",
      "Explain the difference between the geocentric and heliocentric models",
      "Describe orbital motion as the balance between gravity and inertia",
      "Apply gravitational field concepts to planetary and satellite motion",
      "Explain day/night cycle, seasons, eclipses, and tides",
      "Describe the life cycle of stars: nebula, main sequence, red giant, white dwarf/supernova",
      "Understand the evidence for the expanding universe (redshift, CMB)"
    ]},
  ],
  11: [
    { topic: "Kinematics", objectives: [
      "Derive and apply SUVAT equations for uniform acceleration in one and two dimensions",
      "Analyse projectile motion independently in horizontal and vertical directions",
      "Interpret displacement–time, velocity–time, and acceleration–time graphs",
      "Determine instantaneous velocity from gradient of displacement–time graph",
      "Calculate acceleration from non-linear velocity–time graphs using tangents",
      "Solve motion problems involving relative velocity",
      "Analyse motion with non-uniform acceleration using graphical methods"
    ]},
    { topic: "Forces", objectives: [
      "Apply Newton's laws to systems with multiple forces and connected particles",
      "Calculate resultant forces using vector resolution into perpendicular components",
      "Determine tension in strings and normal reaction forces in equilibrium",
      "Analyse friction as both static and kinetic (limiting friction)",
      "Apply conservation of momentum in two dimensions",
      "Calculate impulse from force–time graphs as area under the graph",
      "Determine centre of gravity of regular and irregular objects"
    ]},
    { topic: "Energy", objectives: [
      "Apply the principle of conservation of energy to systems involving multiple energy forms",
      "Derive and apply work–energy theorem (W = ΔEₖ)",
      "Calculate power from force and velocity (P = Fv)",
      "Analyse efficiency of mechanical and electrical systems quantitatively",
      "Apply the relationship between energy and work in thermodynamic contexts",
      "Derive expressions for kinetic and potential energy from equations of motion"
    ]},
    { topic: "Waves", objectives: [
      "Describe progressive waves: transverse and longitudinal characteristics",
      "Apply v = fλ across different wave types including electromagnetic waves",
      "Describe the Doppler effect for sound and light and calculate frequency shift",
      "Explain polarisation of transverse waves (Malus's law)",
      "Describe stationary waves: nodes, antinodes, and harmonics on strings and in pipes",
      "Calculate harmonic frequencies for strings (f = n/2L √(T/μ)) and open/closed pipes",
      "Analyse the diffraction grating equation d sin θ = nλ for spectral analysis",
      "Describe superposition and coherence as conditions for interference"
    ]},
    { topic: "Pressure", objectives: [
      "Define density (ρ = m/V) and pressure (P = F/A) with vector considerations",
      "Calculate pressure in a fluid at depth: P = P₀ + ρgh",
      "Apply Archimedes' principle: upthrust = weight of displaced fluid",
      "Determine the condition for floating equilibrium",
      "Analyse forces in equilibrium using moments and torque calculations",
      "Calculate the turning effect of a couple (torque = force × perpendicular distance)"
    ]},
    { topic: "Electricity", objectives: [
      "Define current as I = Anev (drift velocity of charge carriers)",
      "Define EMF and potential difference in terms of energy per unit charge",
      "Apply Ohm's law and the concept of resistivity (R = ρL/A)",
      "Analyse DC circuits using Kirchhoff's first law (conservation of charge) and second law (conservation of energy)",
      "Calculate total resistance in complex circuit configurations",
      "Apply the potential divider equation Vₒᵤₜ = Vᵢₙ × R₂/(R₁ + R₂)",
      "Analyse the sensitivity and loading effect of potential dividers",
      "Describe the thermistor and light-dependent resistor (LDR) as sensing devices"
    ]},
    { topic: "Magnetism", objectives: [
      "Define magnetic flux (Φ = BA cos θ) and magnetic flux linkage (NΦ)",
      "Apply Faraday's law of electromagnetic induction (ε = −N ΔΦ/Δt)",
      "Apply Lenz's law to determine the direction of induced EMF and current",
      "Describe the construction and working principle of an AC generator",
      "Calculate mutual inductance and self-inductance EMF",
      "Explain the operation of a transformer: Vₚ/Vₛ = Nₚ/Nₛ and power conservation",
      "Analyse eddy currents and methods to reduce them (laminated cores)"
    ]},
    { topic: "Deformation of Solids", objectives: [
      "Apply Hooke's law: F = kx and distinguish between elastic and plastic deformation",
      "Calculate the Young modulus (E = stress/strain) with units and typical values",
      "Construct and interpret stress–strain curves (elastic limit, yield point, UTS, fracture)",
      "Calculate elastic strain energy from force–extension graphs (½Fx = ½kx²)",
      "Describe the molecular basis for elastic behaviour in crystalline and polymeric materials"
    ]},
    { topic: "Particle Physics", objectives: [
      "Describe the atom: protons, neutrons, electrons, and their properties",
      "Understand the strong nuclear force and its role in holding the nucleus together",
      "Describe radioactivity: α, β⁻, β⁺, γ decay with nuclear equations",
      "Understand the concept of quarks and leptons as fundamental particles",
      "Classify hadrons (baryons, mesons) and leptons with examples",
      "Apply conservation laws: charge, baryon number, lepton number, strangeness",
      "Describe particle interactions via exchange particles (W⁺, W⁻, Z⁰, gluons, photons)"
    ]},
  ],
  12: [
    { topic: "Forces", objectives: [
      "Describe circular motion: angular displacement, angular velocity, centripetal acceleration",
      "Apply centripetal force equation: F = mv²/r = mω²r",
      "Solve problems involving conical pendulums, banked curves, and vertical circles",
      "Apply Newton's law of universal gravitation: F = Gm₁m₂/r²",
      "Derive and apply gravitational field strength (g = GM/r²)",
      "Apply Kepler's laws of planetary motion to orbital mechanics",
      "Calculate orbital speed and period for satellites in circular orbits",
      "Understand gravitational potential (V = −GM/r) and gravitational potential energy"
    ]},
    { topic: "Thermal", objectives: [
      "Apply the ideal gas equation: pV = nRT = NkT in various contexts",
      "Describe the kinetic theory of gases: assumptions and derived equations",
      "Calculate root-mean-square (rms) speed of gas molecules",
      "Apply the first law of thermodynamics: ΔU = Q + W",
      "Describe thermodynamic processes: isothermal, adiabatic, isobaric, isochoric",
      "Calculate work done in gas expansion/compression (W = pΔV)",
      "Evaluate efficiency of thermodynamic cycles (Carnot cycle, Otto cycle)"
    ]},
    { topic: "Electricity", objectives: [
      "Apply Coulomb's law: F = kQ₁Q₂/r² for electrostatic forces between point charges",
      "Describe electric field patterns and strength: E = F/q = kQ/r²",
      "Calculate electric potential and potential differences in radial and uniform fields",
      "Analyse motion of charged particles in uniform electric fields (projectile analogy)",
      "Describe capacitance: C = Q/V and factors affecting capacitance",
      "Apply capacitor equations: Q = CV, E = ½CV² = ½QV",
      "Analyse RC circuits: charge/discharge curves, time constant (τ = RC)",
      "Solve problems with capacitors in series and parallel configurations"
    ]},
    { topic: "Magnetism", objectives: [
      "Apply F = BIl sin θ and F = Bqv sin θ for magnetic forces on currents and moving charges",
      "Describe the motion of charged particles in magnetic fields (circular paths)",
      "Calculate the radius of curvature of charged particles in magnetic fields: r = mv/Bq",
      "Describe Hall effect and calculate Hall voltage",
      "Analyse alternating current circuits: RMS values, peak values, and phase relationships",
      "Describe the operation of rectification (half-wave and full-wave)",
      "Apply the transformer equation and analyse power losses in transmission lines"
    ]},
    { topic: "Waves", objectives: [
      "Describe simple harmonic motion (SHM) as a = −ω²x",
      "Apply equations for SHM: x = A cos(ωt), v = ±ω√(A² − x²)",
      "Analyse energy transformations in oscillating systems between kinetic and potential",
      "Describe damped oscillations (light, critical, heavy damping) and forced oscillations",
      "Explain resonance and its applications (including practical consequences like Tacoma Narrows)",
      "Apply superposition to describe stationary waves and beats",
      "Analyse the uncertainty principle as a consequence of wave-particle duality"
    ]},
    { topic: "Quantum Physics", objectives: [
      "Describe the photoelectric effect and apply E = hf = Φ + Eₖ(max)",
      "Explain wave-particle duality: de Broglie wavelength λ = h/p",
      "Describe line spectra (emission and absorption) as evidence for discrete energy levels",
      "Apply atomic energy level diagrams to calculate photon energies",
      "Describe the Schrödinger model of the atom",
      "Explain the Heisenberg uncertainty principle and its implications"
    ]},
    { topic: "Nuclear Physics", objectives: [
      "Describe nuclear decay processes: α, β⁻, β⁺, γ with conservation laws",
      "Calculate binding energy and binding energy per nucleon from mass defect",
      "Interpret the binding energy per nucleon curve for stability",
      "Describe nuclear fission and chain reactions (moderators, control rods, shielding)",
      "Describe nuclear fusion conditions and energy release (stellar nucleosynthesis)",
      "Apply the radioactive decay law: N = N₀e^(−λt) and half-life calculations"
    ]},
    { topic: "Medical Physics", objectives: [
      "Describe the production and properties of X-rays for medical imaging",
      "Understand the principles of CT scanning, MRI, and ultrasound imaging",
      "Calculate X-ray attenuation using the exponential law: I = I₀e^(−μx)",
      "Describe the use of radiopharmaceuticals in PET scans and diagnosis",
      "Evaluate radiation dose and its biological effects (absorbed dose, equivalent dose)",
      "Describe radiotherapy treatment planning for cancer using external beam and brachytherapy"
    ]},
    { topic: "Astronomy and Cosmology", objectives: [
      "Describe the life cycle of stars and the Hertzsprung-Russell diagram",
      "Apply the Doppler effect to calculate recessional velocity of galaxies",
      "Describe Hubble's law: v = H₀d and its implication for the expanding universe",
      "Calculate the age of the universe using the Hubble constant",
      "Describe the evidence for the Big Bang theory (cosmic microwave background radiation)",
      "Explain the concepts of dark matter and dark energy in modern cosmology",
      "Describe the evolution of the universe from the Big Bang to the present day"
    ]},
  ],
}

export function getObjectivesForGrade(grade: number, topicFilter?: string): Array<{ topic: string; objectives: string[] }> {
  const gradeData = SYLLABUS_OBJECTIVES[grade] || SYLLABUS_OBJECTIVES[10] || []
  if (!topicFilter) return gradeData
  const lower = topicFilter.toLowerCase()
  return gradeData.filter(item => item.topic.toLowerCase().includes(lower) || lower.includes(item.topic.toLowerCase()))
}
