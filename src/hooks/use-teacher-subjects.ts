import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRBAC } from "@/hooks/use-rbac"
import { SUBJECTS } from "@/lib/utils/constants"

export function useTeacherSubjects() {
  const { profile } = useAuth()
  const { isSuperAdmin, isTeacher } = useRBAC()
  const [subjects, setSubjects] = useState<string[]>([])

  useEffect(() => {
    if (!profile?.id) return
    if (isSuperAdmin) {
      setSubjects(SUBJECTS.map(s => s.code))
      return
    }
    if (!isTeacher) return
    fetch(`/api/teacher/grading/assignments?teacher_id=${profile.id}`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length) {
          const codes = [...new Set(data.map((a: any) => a.subject).filter(Boolean))]
          setSubjects(codes)
        }
      })
      .catch(() => {})
  }, [profile?.id, isSuperAdmin, isTeacher])

  return subjects
}
