// TPA Rubric Constants — Teachers' Performance Assessment Instrument
// Based on SHB Modernhill official rubric format

export interface RubricItem {
  id: number
  text: string
}

export interface RubricCategory {
  key: string
  label: string
  weight: number // percentage weight
  items: RubricItem[]
}

export const TPA_CATEGORIES: RubricCategory[] = [
  {
    key: "planning",
    label: "Planning & Preparation",
    weight: 20,
    items: [
      { id: 1, text: "Prepares and submits schemes of work related to the scope and sequence of the curriculum" },
      { id: 2, text: "Prepares lesson plans" },
      { id: 3, text: "Prepares lesson plans that are well laid out and sequenced" },
      { id: 4, text: "Writes objectives that are clear" },
      { id: 5, text: "Writes objectives that are level appropriate" },
      { id: 6, text: "Selects objectives that are achievable" },
      { id: 7, text: "Prepares content that is a good match for the objectives" },
      { id: 8, text: "Demonstrates sound judgment in decision making" },
      { id: 9, text: "Plans activities that are well differentiated" },
      { id: 10, text: "Prepares instruction with opportunities for individual work" },
      { id: 11, text: "Prepares instruction with opportunities for group work" },
      { id: 12, text: "Prepares materials that are usable in the setting" },
      { id: 13, text: "Prepares instructional materials that are adequate" },
      { id: 14, text: "Includes timing as an integral part of the planning" },
      { id: 15, text: "Is well organised for lesson presentation" },
      { id: 16, text: "Prepares assessment exercise to monitor students' learning" },
    ],
  },
  {
    key: "instructional",
    label: "Instructional Process",
    weight: 25,
    items: [
      { id: 1, text: "Welcomes/settles the class appropriately" },
      { id: 2, text: "Makes objectives explicit to students at the start of the lessons" },
      { id: 3, text: "Engages students in activities that are appropriate" },
      { id: 4, text: "Engages students in activities that are meaningful" },
      { id: 5, text: "Engages students in activities that encourage them to think" },
      { id: 6, text: "Demonstrates an awareness of students' levels of performance" },
      { id: 7, text: "Teaches in harmony with objectives" },
      { id: 8, text: "Uses a variety of teaching strategies to enhance learning" },
      { id: 9, text: "Demonstrates a good grasp of the subject matter" },
      { id: 10, text: "Presents correct information" },
      { id: 11, text: "Arouses and maintains students' interest" },
      { id: 12, text: "Uses appropriate instructional materials in the teaching/learning environment" },
      { id: 13, text: "Uses appropriate questioning techniques" },
      { id: 14, text: "Gives students opportunities to respond to questions" },
      { id: 15, text: "Ensures that all students participate in instructional activities" },
      { id: 16, text: "Makes effective use of a variety of organizational structures (whole class, small groups, pairs, one-on-one)" },
      { id: 17, text: "Guides students to develop concepts/master skills" },
      { id: 18, text: "Presents instruction in a logical and coherent manner" },
      { id: 19, text: "Ends lessons appropriately" },
      { id: 20, text: "Achieves instructional objectives" },
    ],
  },
  {
    key: "assessment",
    label: "Assessment",
    weight: 20,
    items: [
      { id: 1, text: "Communicates clear criteria/standards for assessment to students" },
      { id: 2, text: "Uses appropriate assessment activities to monitor student performance" },
      { id: 3, text: "Designs assessment exercises at the appropriate level(s) of difficulty" },
      { id: 4, text: "Regularly assesses during lesson to ascertain students' understanding" },
      { id: 5, text: "Provides corrective feedback during the course of the lesson" },
      { id: 6, text: "Maintains accurate records of students performance" },
      { id: 7, text: "Frequently monitors each student's progress" },
      { id: 8, text: "Provides timely feedback to students of their performance" },
      { id: 9, text: "Provides timely feedback to parents on students performance" },
      { id: 10, text: "Takes appropriate action based on results of assessments" },
    ],
  },
  {
    key: "professionalism",
    label: "Professionalism",
    weight: 10,
    items: [
      { id: 1, text: "Expresses himself/herself clearly and is easily understood" },
      { id: 2, text: "Excellent attendance" },
      { id: 3, text: "Arrives for work on time, arrives for lessons on time" },
      { id: 4, text: "Reports for work regularly" },
      { id: 5, text: "Ensures the safety of all students" },
      { id: 6, text: "Demonstrates maturity in dealing with students" },
      { id: 7, text: "Demonstrates sound judgment in decision-making" },
      { id: 8, text: "Years of service (4: >15 yrs, 3: 10-14, 2: 6-9, 1: 3-5, 0: <2)" },
      { id: 9, text: "Participates in professional development and seeks opportunities for his/her professional development" },
      { id: 10, text: "Demonstrates leadership skills in the performance of duties" },
      { id: 11, text: "Contributes to the life of the school including co-curricular activities" },
      { id: 12, text: "Submits required information (reports, data, etc.) on time" },
      { id: 13, text: "Adheres to the code of ethics" },
    ],
  },
  {
    key: "interpersonal",
    label: "Interpersonal Relationships",
    weight: 10,
    items: [
      { id: 1, text: "Encourages students to respect the worth and dignity of others" },
      { id: 2, text: "Offers advice to others (principal, colleagues, students, parents)" },
      { id: 3, text: "Accepts advice from others (principals, colleagues, students, parents)" },
      { id: 4, text: "Is co-operative and works well with staff members" },
      { id: 5, text: "Demonstrates sensitivity to opinions, attitudes and feelings of others" },
      { id: 6, text: "Communicates effectively with students" },
      { id: 7, text: "Communicates effectively with colleagues" },
      { id: 8, text: "Communicates effectively with principals" },
      { id: 9, text: "Communicates effectively with support/ancillary staff" },
      { id: 10, text: "Communicates effectively with parents" },
      { id: 11, text: "Maintains a good rapport with students" },
      { id: 12, text: "Maintains a good rapport with colleagues" },
      { id: 13, text: "Maintains a good rapport with principals" },
      { id: 14, text: "Maintains a good rapport with support/ancillary staff" },
      { id: 15, text: "Maintains a good rapport with parents" },
    ],
  },
  {
    key: "classroom",
    label: "Classroom Management",
    weight: 15,
    items: [
      { id: 1, text: "Demonstrates an awareness of what is happening in the classroom" },
      { id: 2, text: "Creates an atmosphere conducive to learning" },
      { id: 3, text: "Deals effectively with students' behavior" },
      { id: 4, text: "Is fair in dealing with students" },
      { id: 5, text: "Manages time effectively" },
      { id: 6, text: "Manages and utilizes learning resources effectively" },
      { id: 7, text: "Manages effectively classroom-related activities, assignments, projects, field trips etc." },
      { id: 8, text: "Ensures that students observe the rules for classroom activities and students' behavior" },
      { id: 9, text: "Demonstrates effective transition from one activity to another during instruction" },
      { id: 10, text: "Takes a class register" },
      { id: 11, text: "Keeps accurate and relevant students records" },
    ],
  },
]

export const SCORE_LABELS: Record<number, string> = {
  4: "A — All of the time",
  3: "M — Most of the time",
  2: "O — Occasionally",
  1: "R — Rarely",
  0: "N — Never",
}

export const SCORE_COLORS: Record<number, string> = {
  4: "bg-green-100 text-green-700",
  3: "bg-blue-100 text-blue-700",
  2: "bg-amber-100 text-amber-700",
  1: "bg-orange-100 text-orange-700",
  0: "bg-red-100 text-red-700",
}

export const GRADE_INTERPRETATION: { min: number; max: number; label: string }[] = [
  { min: 90, max: 100, label: "EXCELLENT" },
  { min: 80, max: 89, label: "VERY GOOD" },
  { min: 70, max: 79, label: "GOOD" },
  { min: 60, max: 69, label: "SATISFACTORY" },
  { min: 0, max: 59, label: "UNSATISFACTORY" },
]

export function getMaxScore(category: RubricCategory): number {
  return category.items.length * 4
}

export function calculateCategoryScore(items: RubricItem[], scores: Record<string, number>): { raw: number; max: number; pct: number } {
  const max = items.length * 4
  const raw = items.reduce((sum, item) => sum + (scores[item.id] ?? 0), 0)
  return { raw, max, pct: max > 0 ? Math.round((raw / max) * 1000) / 10 : 0 }
}

export function calculateTotal(categoryScores: Record<string, { raw: number; max: number }>): number {
  let total = 0
  for (const cat of TPA_CATEGORIES) {
    const cs = categoryScores[cat.key]
    if (cs && cs.max > 0) {
      total += (cs.raw / cs.max) * cat.weight
    }
  }
  return Math.round(total * 10) / 10
}

export function getGradeLabel(score: number): string {
  for (const g of GRADE_INTERPRETATION) {
    if (score >= g.min && score <= g.max) return g.label
  }
  return "UNSATISFACTORY"
}
