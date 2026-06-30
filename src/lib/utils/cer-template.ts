export function generateCERTemplate(
  level: "basic" | "intermediate" | "advanced",
  phenomenon?: string
): string {
  switch (level) {
    case "basic":
      return `## CER Framework — Basic Level

**Instructions:** Write your Claim, Evidence, and Reasoning in the spaces provided.

### CLAIM
State your claim in one sentence:
"In my view, [phenomenon] occurs because...

*Guidance: Your claim is your answer to the phenomenon question. It must be specific and testable.*

### EVIDENCE
Gather evidence to support your claim:
1. From observation: ____
2. From calculations: ____
3. From readings/sources: ____

*Guidance: Evidence must be concrete data — numerical values, facts, or observational results!*

### REASONING
Write your reasoning:
"The evidence above supports my claim because...

*Guidance: Reasoning connects the evidence to the claim using physics principles. Explain the CAUSE-AND-EFFECT relationship!*
`
    case "intermediate":
      return `## CER Framework — Intermediate Level

**Phenomenon:** "${phenomenon}"

### CLAIM (1-2 sentences)
Based on the phenomenon, write a statement that answers the main question. Your claim must:
- Be specific (not a generalisation)
- Be testable
- Be grounded in physics concepts

### EVIDENCE (minimum 3 points)
Collect evidence to support your claim:
- Experimental data/graphs: ____
- Calculations/formulae: ____
- Relevant physics principles: ____

Include a sketch or diagram where necessary!

### REASONING (3-5 sentences)
Explain HOW your evidence supports the claim. Connect to:
1. The underlying physics law or principle
2. The cause-and-effect mechanism
3. Why alternative explanations are not valid
`
    case "advanced":
      return `## CER Framework — Advanced Level

### CLAIM
Formulate a statement that distinguishes between the observed phenomenon and the theoretical prediction. Include the limitations of your claim.

### EVIDENCE
Provide both quantitative and qualitative evidence. Include:
- Numerical data with uncertainty estimates
- Graph analysis (gradient, intercept)
- Comparison with theoretical values
- Percentage difference or error

### REASONING
Evaluate how the evidence supports the claim by considering:
1. Strengths and weaknesses of the evidence
2. Assumptions made during the investigation
3. Factors influencing the results
4. Connections to broader physics concepts
5. Suggestions for further investigation
`
    default:
      return ""
  }
}

export const CER_ANSWER_BASIC = `## Sample Answer — Basic Level

**CLAIM:** The heavier object does not necessarily fall faster than a lighter one. In the absence of air resistance, all objects accelerate toward Earth at the same rate regardless of their mass.

**EVIDENCE:**
1. From the simulation, both objects reached the ground simultaneously when dropped from the same height.
2. Using the formula h = ½gt², the time of fall depends only on height and gravitational acceleration, not on mass.
3. Historical experiment: Apollo 15 astronaut dropped a feather and a hammer on the Moon, and both landed at the same time.

**REASONING:** This supports the claim because gravitational acceleration near Earth's surface (g = 9.8 m/s²) is constant for all objects irrespective of mass. Although air resistance can affect the motion of lighter objects with large surface areas, in a vacuum or for dense objects where air resistance is negligible, mass does not influence the rate of free fall. This is a direct consequence of the equivalence principle in physics.`

export const CER_ANSWER_INTERMEDIATE = `## Sample Answer — Intermediate Level

**CLAIM:** The total mechanical energy of the ball is not lost — it is converted into other forms of energy, primarily thermal energy and sound, during the collision with the ground.

**EVIDENCE:**
1. Initial gravitational potential energy: EP_initial = m × 9.8 × 2 = 19.6m J; Final EP after bounce: EP_final = m × 9.8 × 1.2 = 11.76m J
2. Energy difference: ΔE = 19.6m - 11.76m = 7.84m J — this energy did not disappear; it was transformed
3. Observable evidence: the impact produces an audible sound (sound energy) and a slight increase in temperature at the point of contact (thermal energy)

**REASONING:** The law of conservation of energy states that energy cannot be created or destroyed, only converted from one form to another. During the collision with the ground, some of the ball's kinetic energy is transferred to the ground as thermal energy and sound energy, while some is used to deform the ball momentarily. Therefore, the ball does not rebound to its original height, but the total energy of the system (ball + ground + surrounding air) remains constant.`

export function formatCERPrompt(level: string, phenomenon?: string): string {
  return generateCERTemplate(level as "basic" | "intermediate" | "advanced", phenomenon)
}
