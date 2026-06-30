'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { WeeklyPackage } from '@/types/package'

interface PackageFilters {
  grade?: number
  week?: number
  status?: string
}

async function fetchPackages(filters?: PackageFilters): Promise<WeeklyPackage[]> {
  const params = new URLSearchParams()
  if (filters?.grade) params.set('grade', String(filters.grade))
  if (filters?.week) params.set('week', String(filters.week))
  if (filters?.status) params.set('status', filters.status)
  const qs = params.toString()
  const res = await fetch(`/api/packages${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch packages')
  return res.json()
}

async function fetchPackage(id: string): Promise<WeeklyPackage> {
  const res = await fetch(`/api/packages/${id}`)
  if (!res.ok) throw new Error('Failed to fetch package')
  return res.json()
}

async function createPackage(data: Partial<WeeklyPackage>): Promise<WeeklyPackage> {
  const res = await fetch('/api/packages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create package')
  return res.json()
}

async function updatePackage({ id, ...data }: Partial<WeeklyPackage> & { id: string }): Promise<WeeklyPackage> {
  const res = await fetch(`/api/packages/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update package')
  return res.json()
}

async function deletePackage(id: string): Promise<void> {
  const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete package')
}

async function approvePackage(id: string): Promise<WeeklyPackage> {
  return updatePackage({ id, status: 'approved' })
}

async function publishPackage(id: string): Promise<WeeklyPackage> {
  return updatePackage({ id, status: 'published' })
}

export function usePackages(filters?: PackageFilters) {
  return useQuery({
    queryKey: ['packages', filters],
    queryFn: () => fetchPackages(filters),
  })
}

export function usePackage(id: string) {
  return useQuery({
    queryKey: ['package', id],
    queryFn: () => fetchPackage(id),
    enabled: !!id,
  })
}

export function useCreatePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
    },
  })
}

export function useUpdatePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePackage,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      queryClient.invalidateQueries({ queryKey: ['package', variables.id] })
    },
  })
}

export function useDeletePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
    },
  })
}

export function useApprovePackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: approvePackage,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      queryClient.invalidateQueries({ queryKey: ['package', id] })
    },
  })
}

export function usePublishPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: publishPackage,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      queryClient.invalidateQueries({ queryKey: ['package', id] })
    },
  })
}
