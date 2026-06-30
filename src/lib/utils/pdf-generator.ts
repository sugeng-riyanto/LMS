import type { WeeklyPackage } from "../agents/agent-types"

interface PdfDocument {
  type: "buffer"
  data: number[]
  info: {
    title: string
    subject: string
    author: string
    pages: number
  }
}

export async function generatePackagePDF(weeklyPackage: WeeklyPackage): Promise<Buffer> {
  const header = Buffer.from(
    `PHYSICS COMMAND CENTER - Weekly Package\n` +
    `========================================\n` +
    `Academic Year: ${weeklyPackage.academic_year}\n` +
    `Grade: ${weeklyPackage.grade}\n` +
    `Week: ${weeklyPackage.week_number}\n` +
    `Topic: ${weeklyPackage.topic}\n` +
    `Calendar Status: ${weeklyPackage.calendar_status}\n` +
    `Generated: ${weeklyPackage.generated_at}\n` +
    `========================================\n\n`
  )

  const lessonPlan = Buffer.from(
    `LESSON PLAN: ${weeklyPackage.lesson_plan.title}\n` +
    `Duration: ${weeklyPackage.lesson_plan.duration_minutes} minutes\n` +
    weeklyPackage.lesson_plan.phases.map(p =>
      `\n--- ${p.phase} (${p.minutes} min) ---\n` +
      (p.hook_question ? `Hook: ${p.hook_question}\n` : "") +
      (p.activity ? `Activity: ${p.activity}\n` : "") +
      (p.reflection_prompt ? `Reflection: ${p.reflection_prompt}\n` : "")
    ).join("") +
    `\n\n`
  )

  const worksheet = Buffer.from(
    `WORKSHEET: ${weeklyPackage.worksheet.title}\n` +
    weeklyPackage.worksheet.levels.map(l =>
      `\nLevel ${l.level}: ${l.name} (${l.minutes} min)\n` +
      l.questions.map(q =>
        `  Q${q.id}: ${q.question}\n` +
        (q.options ? `  Options: ${q.options.join(", ")}\n` : "") +
        (q.mark_scheme ? `  Marks: ${q.mark_scheme}\n` : "")
      ).join("")
    ).join("") +
    `\n\n`
  )

  const preClass = Buffer.from(
    `PRE-CLASS MATERIALS\n` +
    `Video: ${weeklyPackage.pre_class.video_resource.title} (${weeklyPackage.pre_class.video_resource.duration_minutes} min)\n` +
    `  URL: ${weeklyPackage.pre_class.video_resource.url}\n` +
    `Simulation: ${weeklyPackage.pre_class.interactive_simulation.title}\n` +
    `  URL: ${weeklyPackage.pre_class.interactive_simulation.url}\n` +
    `Entry Ticket Quiz: ${weeklyPackage.pre_class.entry_ticket_quiz.questions.length} questions\n` +
    `  Passing Score: ${weeklyPackage.pre_class.entry_ticket_quiz.passing_score}\n\n`
  )

  const logistics = Buffer.from(
    `LAB LOGISTICS\n` +
    `Lab Required: ${weeklyPackage.lab_logistics.lab_required}\n` +
    `Equipment:\n` +
    weeklyPackage.lab_logistics.equipment_list.map(e =>
      `  - ${e.item} x${e.quantity} [${e.status}]\n`
    ).join("") +
    `\nLab Message: ${weeklyPackage.lab_logistics.lab_technician_message}\n\n`
  )

  const broadcast = Buffer.from(
    `BROADCAST MESSAGES\n` +
    `LMS Post: ${weeklyPackage.broadcast.lms_post.title}\n` +
    `Deadline: ${weeklyPackage.broadcast.lms_post.deadline || "N/A"}\n\n`
  )

  const content = Buffer.concat([
    header, lessonPlan, worksheet, preClass, logistics, broadcast
  ])

  const pdfBuffer: Buffer = content

  return pdfBuffer
}
