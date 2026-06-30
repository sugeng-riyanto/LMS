import { z } from "zod"

export const userProfileSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  role: z.enum(["super_admin", "teacher", "lab_assistant", "student"], "Role must be super_admin, teacher, lab_assistant, or student"),
  grade: z.number().int().min(7).max(12).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  phone: z.string().regex(/^\+?[\d\s-()]{8,20}$/, "Invalid phone number format").optional().or(z.literal("")),
  subject_specialization: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
})

export const userProfileUpdateSchema = userProfileSchema.partial().omit({
  id: true,
  created_at: true
})

export const userRegistrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2).max(100),
  role: z.enum(["teacher", "lab_assistant", "student"]),
  grade: z.number().int().min(7).max(12).optional()
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
})

export type UserProfile = z.infer<typeof userProfileSchema>
export type UserRegistration = z.infer<typeof userRegistrationSchema>
export type LoginCredentials = z.infer<typeof loginSchema>

export function validateUserProfile(data: unknown) {
  const result = userProfileSchema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      path: e.path.join("."),
      message: e.message
    }))
    return { success: false as const, errors }
  }
  return { success: true as const, data: result.data }
}

export function validateUserRegistration(data: unknown) {
  const result = userRegistrationSchema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      path: e.path.join("."),
      message: e.message
    }))
    return { success: false as const, errors }
  }
  return { success: true as const, data: result.data }
}
