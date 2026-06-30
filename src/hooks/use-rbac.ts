'use client'

import { useAuth } from '@/providers/auth-provider'
import { useMemo } from 'react'

export function useRBAC() {
  const { profile } = useAuth()

  return useMemo(() => {
    const role = profile?.role ?? null
    return {
      isSuperAdmin: role === 'super_admin',
      isTeacher: role === 'teacher',
      isLabAssistant: role === 'lab_assistant',
      isStudent: role === 'student',
      role,
      canManagePackages: role === 'super_admin' || role === 'teacher' || role === 'lab_assistant',
      canViewAllData: role === 'super_admin' || role === 'teacher',
      canManageInventory: role === 'super_admin' || role === 'lab_assistant',
      canAccessPortal: role !== null,
    }
  }, [profile])
}
