"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Settings, Plus, UserPlus, Shield, Mail } from "lucide-react"
import { GRADES, ROLES, ROLE_LABELS } from "@/lib/utils/constants"
import type { UserProfile } from "@/types/user"
import toast from "react-hot-toast"

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  teacher: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  lab_assistant: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  student: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
}

export default function SettingsPage() {
  const { isSuperAdmin } = useRBAC()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "student" as UserProfile["role"], grade: 7 })
  const [editForm, setEditForm] = useState({ role: "student" as UserProfile["role"], grade: 7 })

  useEffect(() => {
    if (isSuperAdmin) fetchUsers()
  }, [isSuperAdmin])

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users")
      if (res.ok) setUsers(await res.json())
    } catch {
      toast.error("Failed to load users.")
    } finally {
      setLoading(false)
    }
  }

  function openEditDialog(user: UserProfile) {
    setEditingUser(user)
    setEditForm({ role: user.role, grade: user.grade ?? 7 })
    setEditOpen(true)
  }

  async function handleEditRole() {
    if (!editingUser) return
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        toast.success("User updated!")
        setEditOpen(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        toast.error("Failed to update user.")
      }
    } catch {
      toast.error("Failed to update user.")
    }
  }

  async function handleInvite() {
    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      })
      if (res.ok) {
        toast.success("Invitation sent!")
        setInviteOpen(false)
        setInviteForm({ email: "", full_name: "", role: "student", grade: 7 })
        fetchUsers()
      } else {
        toast.error("Failed to invite user.")
      }
    } catch {
      toast.error("Failed to invite user.")
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Your account settings</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Contact your super admin for role or permission changes.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">User management and system configuration</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-1 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>Send an invitation to join the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as UserProfile["role"] }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Grade Assignment</Label>
                <select
                  value={inviteForm.grade}
                  onChange={(e) => setInviteForm((p) => ({ ...p, grade: Number(e.target.value) }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite}>
                <Mail className="mr-1 h-4 w-4" />
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role] ?? ""}>{ROLE_LABELS[user.role]}</Badge>
                    </TableCell>
                    <TableCell>{user.grade ? `Grade ${user.grade}` : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                        <Settings className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              {editingUser ? `Update role and grade for ${editingUser.full_name}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Role</Label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as UserProfile["role"] }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Grade Assignment</Label>
              <select
                value={editForm.grade}
                onChange={(e) => setEditForm((p) => ({ ...p, grade: Number(e.target.value) }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditRole}>
              <Shield className="mr-1 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
