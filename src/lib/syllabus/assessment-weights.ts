const DEFAULT_WEIGHTS: Record<string, number> = {
  classwork: 0.4, unit_test: 0.2, project: 0.1, homework: 0.1, mid_semester: 0.1, final_semester: 0.1,
}

export async function getAssessmentWeights(supabase: any, grade: number): Promise<Record<string, number>> {
  try {
    const { data } = await (supabase.from("assessment_weights") as any)
      .select("category,weight")
      .eq("grade", grade)
    if (data && data.length > 0) {
      const map: Record<string, number> = {}
      for (const item of data) {
        map[item.category] = item.weight
      }
      return map
    }
  } catch {}
  return { ...DEFAULT_WEIGHTS }
}

export const CATEGORIES = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"]
export const DEFAULT_CATEGORY_WEIGHTS = { ...DEFAULT_WEIGHTS }
export const CATEGORY_LABELS: Record<string, string> = {
  classwork: "Classwork", unit_test: "Unit Test", project: "Project", homework: "Homework",
  mid_semester: "Mid Semester", final_semester: "Final Semester",
}
