"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRBAC } from "@/hooks/use-rbac"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Settings, Plus, UserPlus, Shield, Mail, Key, Eye, EyeOff, Power, PowerOff, Trash2, Play, Info, Upload, Download, Building2, Save, BookOpen, GraduationCap, User, CheckCircle } from "lucide-react"
import { GRADES, ROLES, ROLE_LABELS } from "@/lib/utils/constants"
import { PROVIDER_DEFAULTS, PROVIDER_LABELS, PROVIDER_LOGOS, PROVIDER_INSTRUCTIONS } from "@/types/ai-provider"
import type { UserProfile } from "@/types/user"
import type { AIProvider } from "@/types/ai-provider"
import toast from "react-hot-toast"

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  teacher: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-primary",
  lab_assistant: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  student: "bg-primary/10 text-primary font-medium dark:bg-primary/20",
  principal: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
}

const PROVIDER_TYPES = ["openai", "groq", "gemini", "opencodeai"] as const

export default function SettingsPage() {
  const { profile: authProfile } = useAuth()
  const { isSuperAdmin, role } = useRBAC()
  const [tab, setTab] = useState(() => isSuperAdmin ? "users" : "profile")
  const [nameForm, setNameForm] = useState("")
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" })
  const [savingName, setSavingName] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => { if (authProfile?.full_name) setNameForm(authProfile.full_name) }, [authProfile])

  // Users
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "student" as UserProfile["role"], grade: 7 })
  const [editForm, setEditForm] = useState({ email: "", role: "student" as UserProfile["role"], grade: 7 })
  const [resettingPw, setResettingPw] = useState<string | null>(null)

  // AI Providers
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [providerForm, setProviderForm] = useState({
    provider_name: "",
    display_name: "",
    provider_type: "openai" as AIProvider["provider_type"],
    api_key: "",
    base_url: "",
    default_model: "",
    available_models: "",
    is_active: true,
    priority: 0,
    temperature: 0.7,
    max_tokens: 4096,
  })

  useEffect(() => {
    if (isSuperAdmin) {
      if (tab === "users") fetchUsers()
    }
    if (isSuperAdmin || role === "teacher" || role === "principal") {
      if (tab === "ai-providers") fetchProviders()
    }
  }, [isSuperAdmin, role, tab])

  // === USERS ===
  async function fetchUsers() {
    setLoadingUsers(true)
    try {
      const res = await fetch("/api/profiles")
      if (res.ok) setUsers(await res.json())
    } catch {
      toast.error("Failed to load users.")
    } finally {
      setLoadingUsers(false)
    }
  }

  function openEditDialog(user: UserProfile) {
    setEditingUser(user)
    setEditForm({ email: user.email ?? "", role: user.role, grade: user.grade_assigned ?? 7 })
    setEditOpen(true)
  }

  async function handleEditRole() {
    if (!editingUser) return
    try {
      const body: Record<string, any> = { role: editForm.role, grade_assigned: editForm.grade }
      if (editForm.email !== editingUser.email) body.email = editForm.email
      const res = await fetch(`/api/profiles/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success("User updated!")
        setEditOpen(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        const err = await res.json().catch(() => ({ error: "Failed" }))
        toast.error(err.error ?? "Failed to update user.")
      }
    } catch {
      toast.error("Failed to update user.")
    }
  }

  async function handleResetPassword(userId: string, userName: string) {
    if (!confirm(`Reset password for ${userName}?`)) return
    setResettingPw(userId)
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Temporary password: ${data.temp_password}`, { duration: 10000 })
      } else {
        toast.error(data.error ?? "Failed to reset password")
      }
    } catch {
      toast.error("Failed to reset password")
    } finally {
      setResettingPw(null)
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

  // === AI PROVIDERS ===
  async function fetchProviders() {
    setLoadingProviders(true)
    try {
      const res = await fetch("/api/settings/ai-providers")
      if (res.ok) setProviders(await res.json())
    } catch {
      toast.error("Failed to load AI providers.")
    } finally {
      setLoadingProviders(false)
    }
  }

  function openAddProvider() {
    setEditingProvider(null)
    const type = "openai"
    const defaults = PROVIDER_DEFAULTS[type]
    setProviderForm({
      provider_name: type,
      display_name: PROVIDER_LABELS[type],
      provider_type: type,
      api_key: "",
      base_url: defaults.base_url,
      default_model: defaults.models[0],
      available_models: defaults.models.join(", "),
      is_active: true,
      priority: providers.length,
      temperature: 0.7,
      max_tokens: 4096,
    })
    setProviderDialogOpen(true)
  }

  function openEditProvider(provider: AIProvider) {
    setEditingProvider(provider)
    setProviderForm({
      provider_name: provider.provider_name,
      display_name: provider.display_name,
      provider_type: provider.provider_type,
      api_key: provider.api_key,
      base_url: provider.base_url ?? PROVIDER_DEFAULTS[provider.provider_type]?.base_url ?? "",
      default_model: provider.default_model,
      available_models: (provider.available_models ?? []).join(", "),
      is_active: provider.is_active,
      priority: provider.priority,
      temperature: provider.config?.temperature ?? 0.7,
      max_tokens: provider.config?.max_tokens ?? 4096,
    })
    setProviderDialogOpen(true)
  }

  function handleProviderTypeChange(type: AIProvider["provider_type"]) {
    const defaults = PROVIDER_DEFAULTS[type]
    setProviderForm({
      ...providerForm,
      provider_name: type,
      display_name: PROVIDER_LABELS[type],
      provider_type: type,
      base_url: defaults?.base_url ?? "",
      default_model: defaults?.models[0] ?? "",
      available_models: defaults?.models.join(", ") ?? "",
    })
  }

  async function handleSaveProvider() {
    try {
      const modelList = providerForm.available_models
        .split(",")
        .map((m: string) => m.trim())
        .filter(Boolean)

      const payload = {
        provider_name: providerForm.provider_name,
        display_name: providerForm.display_name,
        provider_type: providerForm.provider_type,
        api_key: providerForm.api_key,
        base_url: providerForm.base_url || null,
        default_model: providerForm.default_model,
        available_models: modelList,
        is_active: providerForm.is_active,
        priority: providerForm.priority,
        config: { temperature: providerForm.temperature, max_tokens: providerForm.max_tokens },
      }

      let res: Response
      if (editingProvider) {
        res = await fetch(`/api/settings/ai-providers/${editingProvider.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/settings/ai-providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        toast.success(editingProvider ? "Provider updated!" : "Provider added!")
        setProviderDialogOpen(false)
        fetchProviders()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to save provider.")
      }
    } catch {
      toast.error("Failed to save provider.")
    }
  }

  async function handleToggleProvider(provider: AIProvider) {
    try {
      const res = await fetch(`/api/settings/ai-providers/${provider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !provider.is_active }),
      })
      if (res.ok) {
        toast.success(`${provider.display_name} ${provider.is_active ? "disabled" : "enabled"}`)
        fetchProviders()
      }
    } catch {
      toast.error("Failed to toggle provider.")
    }
  }

  async function handleDeleteProvider(provider: AIProvider) {
    if (!confirm(`Delete ${provider.display_name}? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/settings/ai-providers/${provider.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Provider deleted.")
        fetchProviders()
      }
    } catch {
      toast.error("Failed to delete provider.")
    }
  }

  async function handleTestProvider(provider: AIProvider) {
    toast.loading("Testing...")
    try {
      const res = await fetch("/api/settings/ai-providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: provider.id }),
      })
      const result = await res.json()
      toast.dismiss()
      if (res.ok && result.success) {
        toast.success(`${provider.display_name}: Connected!`)
      } else {
        toast.error(`${provider.display_name}: ${result.error ?? "Failed"}`)
      }
      fetchProviders()
    } catch {
      toast.dismiss()
      toast.error("Test request failed.")
    }
  }

  if (role !== "super_admin" && role !== "teacher" && role !== "principal") {
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">{isSuperAdmin ? "User management and system configuration" : "Your AI provider configuration"}</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {isSuperAdmin && (
            <TabsTrigger value="users">
              <UserPlus className="mr-1 h-4 w-4" />
              Users
            </TabsTrigger>
          )}
          {(role === "teacher" || role === "principal") && (
            <TabsTrigger value="profile">
              <User className="mr-1 h-4 w-4" />
              Profile
            </TabsTrigger>
          )}
          <TabsTrigger value="ai-providers">
            <Key className="mr-1 h-4 w-4" />
            AI Providers
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="subjects">
              <BookOpen className="mr-1 h-4 w-4" />
              Subjects
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="classes">
              <GraduationCap className="mr-1 h-4 w-4" />
              Classes
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="teacher-assignments">
              <UserPlus className="mr-1 h-4 w-4" />
              Teachers
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="school">
              <Building2 className="mr-1 h-4 w-4" />
              School
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="rbac">
              <Shield className="mr-1 h-4 w-4" />
              RBAC
            </TabsTrigger>
          )}
        </TabsList>

        {isSuperAdmin && (
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-end">
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
                {loadingUsers ? (
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
                          <TableCell>{user.grade_assigned ? `Grade ${user.grade_assigned}` : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                              <Settings className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user.id, user.full_name)} disabled={resettingPw === user.id}>
                              <Key className="mr-1 h-3 w-3" />
                              {resettingPw === user.id ? "..." : "Reset PW"}
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
                    <Label>Email</Label>
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="user@shb.sch.id"
                    />
                  </div>
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

            <Card>
              <CardHeader>
                <CardTitle>Bulk Import Users (XLSX)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  Upload an XLSX file (<strong>Data</strong> sheet). Columns: <code>email</code>, <code>full_name</code>, <code>role</code>, <code>grade_assigned</code>. Role: super_admin / teacher / lab_assistant / student. Password auto-generated.
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={async () => {
                    try {
                      const res = await fetch("/api/export/distribution-xlsx")
                      if (!res.ok) throw new Error("Failed")
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url; a.download = "teacher-student-distribution.xlsx"; a.click()
                      URL.revokeObjectURL(url)
                      toast.success("Distribution downloaded")
                    } catch {
                      toast.error("Failed to download distribution")
                    }
                  }}>
                    <Download className="mr-1 h-3 w-3" />
                    Download Distribution
                  </Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    try {
                      const res = await fetch("/api/export/master-template")
                      if (!res.ok) throw new Error("Failed")
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url; a.download = "master-template.xlsx"; a.click()
                      URL.revokeObjectURL(url)
                      toast.success("Master template downloaded")
                    } catch {
                      toast.error("Failed to download master template")
                    }
                  }}>
                    <Download className="mr-1 h-3 w-3" />
                    Download Master Template
                  </Button>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
                    <Upload className="h-3 w-3" />
                    Upload XLSX
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const fd = new FormData()
                        fd.append("file", file)
                        try {
                          const res = await fetch("/api/users/upload", { method: "POST", body: fd })
                          const result = await res.json()
                          if (res.ok) {
                            toast.success(result.message ?? "Upload berhasil")
                            fetchUsers()
                          } else {
                            toast.error(result.error ?? "Upload gagal")
                          }
                        } catch {
                          toast.error("Upload gagal")
                        }
                        e.target.value = ""
                      }}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={authProfile?.email ?? ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-1">
                <Label>Full Name</Label>
                <div className="flex gap-2">
                  <Input value={nameForm} onChange={(e) => setNameForm(e.target.value)} placeholder="Your full name" />
                  <Button onClick={async () => {
                    if (!nameForm.trim()) { toast.error("Name cannot be empty"); return }
                    setSavingName(true)
                    try {
                      const r = await fetch("/api/profiles/me", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ full_name: nameForm.trim() }),
                      })
                      if (r.ok) { toast.success("Name updated!"); window.location.reload() }
                      else toast.error("Failed to update name")
                    } catch { toast.error("Failed to update name") }
                    finally { setSavingName(false) }
                  }} disabled={savingName}><Save className="mr-1 h-4 w-4" />{savingName ? "..." : "Save"}</Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <Label>Change Password</Label>
                <Input type="password" placeholder="Current password" value={pwForm.current} onChange={(e) => setPwForm(p => ({ ...p, current: e.target.value }))} />
                <Input type="password" placeholder="New password" value={pwForm.newPw} onChange={(e) => setPwForm(p => ({ ...p, newPw: e.target.value }))} className="mt-2" />
                <Input type="password" placeholder="Confirm new password" value={pwForm.confirm} onChange={(e) => setPwForm(p => ({ ...p, confirm: e.target.value }))} className="mt-2" />
                <Button className="mt-2" onClick={async () => {
                  if (!pwForm.current || !pwForm.newPw) { toast.error("Fill all fields"); return }
                  if (pwForm.newPw !== pwForm.confirm) { toast.error("Passwords don't match"); return }
                  if (pwForm.newPw.length < 6) { toast.error("Min 6 characters"); return }
                  setSavingPw(true)
                  try {
                    const r = await fetch("/api/auth/password", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
                    })
                    if (r.ok) { toast.success("Password updated!"); setPwForm({ current: "", newPw: "", confirm: "" }) }
                    else { const e = await r.json(); toast.error(e.error ?? "Failed") }
                  } catch { toast.error("Failed to update password") }
                  finally { setSavingPw(false) }
                }} disabled={savingPw}><Key className="mr-1 h-4 w-4" />{savingPw ? "..." : "Change Password"}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-providers" className="space-y-6">
          <div className="flex items-center justify-end">
            <Button onClick={openAddProvider}>
              <Plus className="mr-1 h-4 w-4" />
              Add Provider
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Provider Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProviders ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : providers.length === 0 ? (
                <div className="py-12 text-center">
                  <Key className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No AI providers configured yet.</p>
                  <p className="text-xs text-muted-foreground">Add Groq, Gemini, OpenAI, or OpenCode AI keys to enable AI generation.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${PROVIDER_LOGOS[provider.provider_type] ?? ""}`}>
                        {provider.display_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{provider.display_name}</span>
                          <Badge variant={provider.is_active ? "default" : "secondary"} className="text-xs">
                            {provider.is_active ? "Active" : "Disabled"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {provider.default_model}
                          </Badge>
                          {provider.test_status === "working" && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Connected</Badge>
                          )}
                          {provider.test_status === "failed" && (
                            <Badge variant="destructive" className="text-xs">Failed</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Priority: {provider.priority}</span>
                          <span>Temperature: {provider.config?.temperature ?? 0.7}</span>
                          <span>Max tokens: {provider.config?.max_tokens ?? 4096}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleTestProvider(provider)} title="Test connection">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleProvider(provider)} title={provider.is_active ? "Disable" : "Enable"}>
                          {provider.is_active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditProvider(provider)} title="Edit">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProvider(provider)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingProvider ? "Edit" : "Add"} AI Provider</DialogTitle>
                <DialogDescription>Configure API key, model, and endpoint for content generation.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-1">
                  <Label>Provider Type</Label>
                  <select
                    value={providerForm.provider_type}
                    onChange={(e) => handleProviderTypeChange(e.target.value as AIProvider["provider_type"])}
                    disabled={!!editingProvider}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    {PROVIDER_TYPES.map((t) => (
                      <option key={t} value={t}>{PROVIDER_LABELS[t]}</option>
                    ))}
                  </select>
                </div>

                {PROVIDER_INSTRUCTIONS[providerForm.provider_type] && (
                  <div className="rounded-lg border border-border bg-accent p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <div className="flex items-center gap-1 font-semibold mb-2">
                      <Info className="h-3 w-3" />
                      {PROVIDER_INSTRUCTIONS[providerForm.provider_type].key_source}
                    </div>
                    <p className="mb-2">
                      <a href={PROVIDER_INSTRUCTIONS[providerForm.provider_type].key_url} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                        Open {PROVIDER_INSTRUCTIONS[providerForm.provider_type].key_source} →
                      </a>
                    </p>
                    <ol className="space-y-1.5 list-decimal list-inside">
                      {PROVIDER_INSTRUCTIONS[providerForm.provider_type].steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Display Name</Label>
                  <Input
                    value={providerForm.display_name}
                    onChange={(e) => setProviderForm((p) => ({ ...p, display_name: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label>
                    <div className="flex items-center gap-2">
                      <Key className="h-3 w-3" />
                      API Key
                    </div>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showKey[providerForm.provider_type] ? "text" : "password"}
                      value={providerForm.api_key}
                      onChange={(e) => setProviderForm((p) => ({ ...p, api_key: e.target.value }))}
                      placeholder={editingProvider ? "Leave blank to keep existing" : "sk-..."}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => setShowKey((p) => ({ ...p, [providerForm.provider_type]: !p[providerForm.provider_type] }))}
                    >
                      {showKey[providerForm.provider_type] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Base URL</Label>
                  <Input
                    value={providerForm.base_url}
                    onChange={(e) => setProviderForm((p) => ({ ...p, base_url: e.target.value }))}
                    placeholder={PROVIDER_DEFAULTS[providerForm.provider_type]?.base_url ?? ""}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Default Model</Label>
                  <Input
                    value={providerForm.default_model}
                    onChange={(e) => setProviderForm((p) => ({ ...p, default_model: e.target.value }))}
                    placeholder="gpt-4o"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Available Models (comma separated)</Label>
                  <Input
                    value={providerForm.available_models}
                    onChange={(e) => setProviderForm((p) => ({ ...p, available_models: e.target.value }))}
                    placeholder="model1, model2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      value={providerForm.priority}
                      onChange={(e) => setProviderForm((p) => ({ ...p, priority: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Temperature</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={providerForm.temperature}
                      onChange={(e) => setProviderForm((p) => ({ ...p, temperature: parseFloat(e.target.value) || 0.7 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={providerForm.max_tokens}
                      onChange={(e) => setProviderForm((p) => ({ ...p, max_tokens: parseInt(e.target.value) || 4096 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={providerForm.is_active}
                    onChange={(e) => setProviderForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">Active (use for generation)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProviderDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveProvider}>
                  <Key className="mr-1 h-4 w-4" />
                  {editingProvider ? "Update" : "Add"} Provider
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="subjects" className="space-y-6">
            <SubjectsTab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="classes" className="space-y-6">
            <ClassesTab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="teacher-assignments" className="space-y-6">
            <TeacherAssignmentsTab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="school" className="space-y-6">
            <SchoolSettings />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="rbac" className="space-y-6">
            <RbacTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function RbacTab() {
  const [dbRoutes, setDbRoutes] = useState<Record<string, string[]>>({})
  const [defaults, setDefaults] = useState<Record<string, string[]>>({})
  const [allRoles] = useState(["super_admin", "teacher", "lab_assistant", "student", "principal"])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(false)
  const [initSql, setInitSql] = useState<string | null>(null)
  const [principals, setPrincipals] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [editAssign, setEditAssign] = useState<{ principal_id: string; level: string; id?: string } | null>(null)
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([])
  const [principalMappings, setPrincipalMappings] = useState<any[]>([])
  const [allTeachers, setAllTeachers] = useState<any[]>([])
  const [editTab, setEditTab] = useState<"view" | "edit">("view")

  // All routes from defaults merged with dbRoutes for display
  const allRouteKeys = [...new Set([...Object.keys(defaults), ...Object.keys(dbRoutes)])].sort()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [r, p, a, ta, pm] = await Promise.all([
        fetch("/api/settings/rbac").then(r => r.ok ? r.json() : { dbRoutes: {}, defaults: {} }),
        fetch("/api/profiles?role=principal").then(r => r.ok ? r.json() : []),
        fetch("/api/principal/assignments").then(r => r.ok ? r.json() : []),
        fetch("/api/teacher-assignments").then(r => r.ok ? r.json() : []),
        fetch("/api/principal/mappings").then(r => r.ok ? r.json() : []),
      ])
      setDbRoutes(r.dbRoutes ?? {})
      setDefaults(r.defaults ?? {})
      setPrincipals(p)
      setAssignments(a)
      setTeacherAssignments(ta ?? [])
      setPrincipalMappings(pm ?? [])
      // Build teacher list from teacher_assignments + profiles API fallback
      const seen = new Set<string>()
      const teachersFromTA: any[] = []
      for (const item of ta ?? []) {
        if (item.profiles && !seen.has(item.profiles.id)) {
          seen.add(item.profiles.id)
          teachersFromTA.push({ ...item.profiles, _grade: item.grade, _subject: item.subject })
        }
      }
      // Also try profiles API directly
      try {
        const tRes = await fetch("/api/profiles?role=teacher")
        if (tRes.ok) {
          const tData = await tRes.json()
          // Merge - prefer TA data, fill gaps with profiles API
          for (const prof of tData) {
            if (!seen.has(prof.id)) {
              seen.add(prof.id)
              teachersFromTA.push(prof)
            }
          }
        }
      } catch {}
      setAllTeachers(teachersFromTA)
    } catch {}
    finally { setLoading(false) }
  }

  function hasRole(route: string, role: string): boolean {
    // If route has DB entries, use those; otherwise use defaults
    if (route in dbRoutes) return dbRoutes[route].includes(role)
    return defaults[route]?.includes(role) ?? false
  }

  async function toggleRoute(route: string, role: string, add: boolean) {
    const current = dbRoutes[route] ?? defaults[route] ?? []
    const updated = add ? [...current, role] : current.filter(r => r !== role)
    setSaving(route)
    try {
      const res = await fetch("/api/settings/rbac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route, roles: updated }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.saved === false) {
          toast.success("Click 'Setup Database' to enable saving")
        } else {
          if (updated.length > 0) setDbRoutes(p => ({ ...p, [route]: updated }))
          else {
            const { [route]: _, ...rest } = dbRoutes
            setDbRoutes(rest)
          }
        }
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        toast.error(err.error || "Failed to update")
      }
    } catch (e) { toast.error("Failed to update: " + String(e)) }
    finally { setSaving(null) }
  }

  async function saveAssignment() {
    if (!editAssign?.principal_id || !editAssign?.level) return
    try {
      const res = await fetch("/api/principal/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editAssign),
      })
      if (res.ok) { toast.success("Saved!"); setEditAssign(null); fetchData() }
      else { const e = await res.json(); toast.error(e.error ?? "Failed") }
    } catch { toast.error("Failed") }
  }

  async function deleteAssignment(id: string) {
    if (!confirm("Delete this assignment?")) return
    try {
      const res = await fetch(`/api/principal/assignments/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Deleted!"); fetchData() }
      else toast.error("Failed")
    } catch { toast.error("Failed") }
  }

  if (loading) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>

  return (
    <div className="space-y-8">
      {/* === ROLE PERMISSIONS CHECKLIST === */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions <span className="text-xs font-normal text-muted-foreground">— toggle which roles can access each page</span></CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background">Route</TableHead>
                {allRoles.map(r => <TableHead key={r} className="text-center text-[10px] uppercase">{r.replace(/_/g, "\n")}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRouteKeys.map(route => (
                <TableRow key={route}>
                  <TableCell className="sticky left-0 bg-background font-mono text-xs">{route}</TableCell>
                  {allRoles.map(role => {
                    const checked = hasRole(route, role)
                    return (
                      <TableCell key={role} className="text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={saving === route}
                          onChange={() => toggleRoute(route, role, !checked)}
                          className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                        />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === CALENDAR CRUD (read-only) === */}
      <Card>
        <CardHeader><CardTitle>Calendar CRUD <span className="text-xs font-normal text-muted-foreground">— read-only view</span></CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                {allRoles.map(r => <TableHead key={r} className="text-center text-[10px] uppercase">{r.replace(/_/g, "\n")}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {["calendar:create", "calendar:edit", "calendar:delete"].map(perm => {
                const label = perm.split(":")[1]
                const defaultValue = perm === "calendar:create" ? ["super_admin", "teacher", "lab_assistant", "principal"] : ["super_admin"]
                return (
                  <TableRow key={perm}>
                    <TableCell className="font-medium text-xs capitalize">{label}</TableCell>
                    {allRoles.map(role => {
                      const isChecked = defaultValue.includes(role)
                      return (
                        <TableCell key={role} className="text-center">
                          <div className={`w-4 h-4 mx-auto rounded-sm ${isChecked ? 'bg-primary' : 'bg-muted border border-border'}`} />
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === PRINCIPAL ASSIGNMENTS === */}
      <Card>
        <CardHeader>
          <CardTitle>Principal Level Assignments <span className="text-xs font-normal text-muted-foreground">— map each principal to JHS (Gr 7-9) or SHS (Gr 10-12)</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <Label>Principal</Label>
              <select value={editAssign?.principal_id ?? ""} onChange={e => setEditAssign(p => p ? { ...p, principal_id: e.target.value } : { principal_id: e.target.value, level: "" })} className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm min-w-[200px]">
                <option value="">Select...</option>
                {principals.map((p: any) => <option key={p.id} value={p.id} disabled={assignments.some((a: any) => a.principal_id === p.id && a.id !== editAssign?.id)}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Level</Label>
              <select value={editAssign?.level ?? ""} onChange={e => setEditAssign(p => p ? { ...p, level: e.target.value } : { principal_id: "", level: e.target.value })} className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="">Select...</option>
                <option value="JHS">JHS (Grades 7-9)</option>
                <option value="SHS">SHS (Grades 10-12)</option>
              </select>
            </div>
            <Button size="sm" onClick={saveAssignment} disabled={!editAssign?.principal_id || !editAssign?.level}>
              <Shield className="mr-1 h-4 w-4" />{editAssign?.id ? "Update" : "Add"}
            </Button>
            {editAssign?.id && <Button variant="ghost" size="sm" onClick={() => setEditAssign(null)}>Cancel</Button>}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Principal</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Grades</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No principal assignments configured.</TableCell></TableRow>
              )}
              {assignments.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.principal?.full_name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.principal?.email ?? "—"}</TableCell>
                  <TableCell><Badge variant={a.level === "JHS" ? "default" : "secondary"}>{a.level}</Badge></TableCell>
                  <TableCell>{a.level === "JHS" ? "7, 8, 9" : "10, 11, 12"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditAssign({ principal_id: a.principal_id, level: a.level, id: a.id })}><Settings className="mr-1 h-3 w-3" />Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteAssignment(a.id)}><Trash2 className="mr-1 h-3 w-3 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === SUPERVISION MAPPING === */}
      {/* === SETUP DATABASE === */}
      <Card>
        <CardHeader><CardTitle>Setup Database <span className="text-xs font-normal text-muted-foreground">— create missing tables for RBAC & mapping</span></CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">One-click setup. Creates <code>role_permissions</code> and <code>principal_teacher_mappings</code> tables.</p>
          <Button onClick={async () => {
            setInitializing(true)
            try {
              const r = await fetch("/api/setup-db", { method: "POST" })
              const d = await r.json()
              if (r.ok) { toast.success(d.message); fetchData() }
              else { toast.error(d.error + (d.hint ? " — " + d.hint : "")) }
            } catch { toast.error("Failed") }
            finally { setInitializing(false) }
          }} disabled={initializing}>
            <Settings className="mr-1 h-4 w-4" />{initializing ? "Working..." : "Setup Database"}
          </Button>
        </CardContent>
      </Card>

      <SupervisionMappingCard assignments={assignments} teacherAssignments={teacherAssignments} />
    </div>
  )
}

function SupervisionMappingCard({ assignments, teacherAssignments }: {
  assignments: any[]; teacherAssignments: any[]
}) {
  const jhsTeachers = new Map<string, any[]>()
  const shsTeachers = new Map<string, any[]>()
  for (const ta of teacherAssignments) {
    const tMap = ta.grade >= 7 && ta.grade <= 9 ? jhsTeachers : shsTeachers
    if (!tMap.has(ta.teacher_id)) tMap.set(ta.teacher_id, [])
    tMap.get(ta.teacher_id)!.push(ta)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supervision & TPA Mapping <span className="text-xs font-normal text-muted-foreground">— teachers by grade level (read-only)</span></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Assign principals to JHS/SHS first.</p>
          ) : (
            assignments.map((a: any) => {
              const levelTeachers = a.level === "JHS" ? jhsTeachers : shsTeachers
              const gradeRange = a.level === "JHS" ? "Grades 7-9" : "Grades 10-12"
              return (
                <div key={a.id} className="rounded-lg border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-semibold text-sm">{a.principal?.full_name}</span>
                    <Badge variant={a.level === "JHS" ? "default" : "secondary"}>{a.level}</Badge>
                    <span className="text-xs text-muted-foreground">{gradeRange}</span>
                  </div>
                  {levelTeachers.size === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No teachers assigned to {gradeRange}.</p>
                  ) : (
                    <div className="grid gap-1.5">
                      {Array.from(levelTeachers.entries()).map(([teacherId, tas]) => {
                        const teacher = tas[0]?.profiles
                        return (
                          <div key={teacherId} className="flex items-center gap-2 rounded bg-muted/50 px-3 py-1.5 text-xs">
                            <span className="font-medium min-w-[160px]">{teacher?.full_name || "Unknown"}</span>
                            <span className="text-muted-foreground">{[...new Set(tas.map((t: any) => `G${t.grade}`))].join(", ")}</span>
                            <span className="text-muted-foreground">{[...new Set(tas.map((t: any) => t.subject))].join(", ")}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SchoolSettings() {
  const [form, setForm] = useState({
    school_name: "Sekolah Harapan Bangsa - Modernhill",
    brand_name: "SHB Learning Hub",
    vp_name: "Christina Sri Waryanti, S.Pd.",
    principal_name: "Sisilia Juni Arianti, S.Pd., M.Pd.",
    shs_vp_name: "Aji Wahyu Budiyanto, M.Si",
    shs_principal_name: "Dr Agustinus Joko Purwanto, S.Pd., M.M.",
    unit: "Academic",
    logo_url: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState("")

  useEffect(() => {
    fetch("/api/settings/school").then((r) => r.json()).then((d) => {
      setForm({
        school_name: d.school_name ?? "",
        brand_name: d.brand_name ?? "SHB Learning Hub",
        vp_name: d.vp_name ?? "", principal_name: d.principal_name ?? "",
        shs_vp_name: d.shs_vp_name ?? "", shs_principal_name: d.shs_principal_name ?? "",
        unit: d.unit ?? "", logo_url: d.logo_url ?? "",
      })
      setLogoPreview(d.logo_url ?? "")
      setLoading(false)
    }).catch(() => { setLoading(false) })
  }, [])

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setLogoPreview(dataUrl)
      setForm((p) => ({ ...p, logo_url: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/school", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) toast.success("School settings saved!")
      else toast.error("Failed to save.")
    } catch { toast.error("Failed to save.") }
    finally { setSaving(false) }
  }

  if (loading) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>

  return (
    <Card>
      <CardHeader><CardTitle>School Configuration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Set VP and Principal names per level. These auto-fill in the Lesson Plan Generator based on grade.
        </p>
        {/* Logo Upload */}
        <div className="space-y-3">
          <Label>School Logo</Label>
          <div className="flex items-center gap-4">
            {logoPreview && (
              <img src={logoPreview} alt="School logo" className="h-16 w-16 rounded-lg border object-contain" />
            )}
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </span>
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
            </label>
            {logoPreview && (
              <Button variant="ghost" size="sm" onClick={() => { setLogoPreview(""); setForm((p) => ({ ...p, logo_url: "" })) }}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, or SVG. Max 2MB.</p>
        </div>

        <div className="space-y-1">
          <Label>School Name</Label>
          <Input value={form.school_name} onChange={(e) => setForm((p) => ({ ...p, school_name: e.target.value }))} />
        </div>

        <div className="space-y-1">
          <Label>Brand Name (app title shown to users)</Label>
          <Input value={form.brand_name} onChange={(e) => setForm((p) => ({ ...p, brand_name: e.target.value }))} />
        </div>

        <div className="rounded-lg border border-border bg-accent p-4 dark:border-blue-800 dark:bg-blue-950">
          <h3 className="text-sm font-semibold mb-3">JHS (Grades 7-9)</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>VP Name (Checked by)</Label>
              <Input value={form.vp_name} onChange={(e) => setForm((p) => ({ ...p, vp_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Principal Name (Approved by)</Label>
              <Input value={form.principal_name} onChange={(e) => setForm((p) => ({ ...p, principal_name: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <h3 className="text-sm font-semibold mb-3">SHS (Grades 10-12)</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>VP Name (Checked by)</Label>
              <Input value={form.shs_vp_name} onChange={(e) => setForm((p) => ({ ...p, shs_vp_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Principal Name (Approved by)</Label>
              <Input value={form.shs_principal_name} onChange={(e) => setForm((p) => ({ ...p, shs_principal_name: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Unit</Label>
          <Input value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
        </div>
        <Button onClick={handleSave} disabled={saving}><Save className="mr-1 h-4 w-4" />Save School Settings</Button>
      </CardContent>
    </Card>
  )
}

function SubjectsTab() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ code: "", name: "", icon: "📚", sort_order: 0 })

  useEffect(() => { fetchSubjects() }, [])

  async function fetchSubjects() {
    setLoading(true)
    try {
      const res = await fetch("/api/subjects")
      if (res.ok) setSubjects(await res.json())
    } catch { toast.error("Failed to load subjects.") }
    finally { setLoading(false) }
  }

  function openAdd() {
    setEditing(null)
    setForm({ code: "", name: "", icon: "📚", sort_order: subjects.length })
    setDialogOpen(true)
  }

  function openEdit(subject: any) {
    setEditing(subject)
    setForm({ code: subject.code, name: subject.name, icon: subject.icon ?? "📚", sort_order: subject.sort_order ?? 0 })
    setDialogOpen(true)
  }

  async function handleSave() {
    try {
      const url = editing ? `/api/subjects/${editing.id}` : "/api/subjects"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) {
        toast.success(editing ? "Subject updated!" : "Subject added!")
        setDialogOpen(false)
        fetchSubjects()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to save.")
      }
    } catch { toast.error("Failed to save.") }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this subject?")) return
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Subject deleted."); fetchSubjects() }
      else toast.error("Failed to delete.")
    } catch { toast.error("Failed to delete.") }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Subject</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Subjects</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : subjects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No subjects configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs font-bold">{s.code}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.icon}</TableCell>
                    <TableCell>{s.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Settings className="mr-1 h-3 w-3" />Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="mr-1 h-3 w-3 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Subject</DialogTitle><DialogDescription>Configure subject code, name, and icon.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1"><Label>Code (e.g. PHY, MAT)</Label><Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="PHY" /></div>
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Physics" /></div>
            <div className="space-y-1"><Label>Icon (emoji)</Label><Input value={form.icon} onChange={(e) => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="⚛️" /></div>
            <div className="space-y-1"><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add"} Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClassesTab() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ grade: 7, class_name: "" })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchClasses() }, [])

  async function fetchClasses() {
    setLoading(true)
    try {
      const res = await fetch("/api/classes")
      if (res.ok) setClasses(await res.json())
    } catch { toast.error("Failed to load classes.") }
    finally { setLoading(false) }
  }

  function openAdd() { setEditing(null); setForm({ grade: 7, class_name: "" }); setDialogOpen(true) }
  function openEdit(c: any) { setEditing(c); setForm({ grade: c.grade, class_name: c.class_name }); setDialogOpen(true) }

  async function handleSave() {
    try {
      const url = editing ? `/api/classes/${editing.id}` : "/api/classes"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (res.ok) {
        toast.success(editing ? "Class updated!" : "Class added!")
        setDialogOpen(false)
        fetchClasses()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to save.")
      }
    } catch { toast.error("Failed to save.") }
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  function selectAll() { setSelected(new Set(classes.map(c => c.id))) }
  function deselectAll() { setSelected(new Set()) }

  async function handleDelete(id: string) {
    if (!confirm("Delete this class?")) return
    try {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Class deleted."); fetchClasses() }
      else toast.error("Failed to delete.")
    } catch { toast.error("Failed to delete.") }
  }

  async function deleteByIds(ids: string[]) {
    setDeleting(true)
    try {
      const r = await fetch("/api/classes/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      if (r.ok) { toast.success(`${ids.length} class(es) deleted!`); setSelected(new Set()); fetchClasses() }
      else { const e = await r.json(); toast.error(e.error || "Failed") }
    } catch { toast.error("Failed") }
    finally { setDeleting(false) }
  }

  async function handleBatchDelete() {
    if (selected.size === 0) { toast.error("Select classes to delete"); return }
    if (!confirm(`Delete ${selected.size} class(es)?`)) return
    deleteByIds(Array.from(selected))
  }

  async function handleDeleteAll() {
    if (!confirm("Delete ALL classes? This cannot be undone.")) return
    deleteByIds(classes.map(c => c.id))
  }

  const grouped = classes.reduce((acc: Record<number, any[]>, c: any) => {
    if (!acc[c.grade]) acc[c.grade] = []
    acc[c.grade].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {selected.size > 0 && <span className="text-xs text-muted-foreground">{selected.size} selected</span>}
          {selected.size > 0 && (
            <>
              <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleBatchDelete} disabled={deleting}><Trash2 className="mr-1 h-3 w-3" />Delete Selected</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={deselectAll}>Deselect</Button>
            </>
          )}
          {classes.length > 0 && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={selectAll}>
              <CheckCircle className="mr-1 h-3 w-3" />Select All
            </Button>
          )}
          {classes.length > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive" onClick={handleDeleteAll} disabled={deleting}>
              <Trash2 className="mr-1 h-3 w-3" />Delete All
            </Button>
          )}
        </div>
        <Button onClick={openAdd} size="sm" className="h-8"><Plus className="mr-1 h-4 w-4" />Add Class</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Parallel Classes</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : classes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No classes configured.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([grade, cls]: [string, any[]]) => (
                <Card key={grade}>
                  <CardHeader className="py-3"><CardTitle className="text-sm">Grade {grade}</CardTitle></CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-1">
                      {cls.sort((a: any, b: any) => a.class_name.localeCompare(b.class_name)).map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="h-4 w-4 rounded border-gray-300" />
                            <span className="font-medium">Class {c.class_name}</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(c)}><Settings className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Class</DialogTitle><DialogDescription>Configure grade and class name.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Grade</Label>
              <select value={form.grade} onChange={(e) => setForm(p => ({ ...p, grade: Number(e.target.value) }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label>Class Name (e.g. A, B, C)</Label><Input value={form.class_name} onChange={(e) => setForm(p => ({ ...p, class_name: e.target.value }))} placeholder="A" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add"} Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TeacherAssignmentsTab() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ teacher_id: "", grade: 7, subject: "", class_id: "" })
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAssignments()
    fetchTeachers()
    fetchClasses()
    fetchSubjects()
  }, [])

  async function fetchAssignments() {
    try {
      const res = await fetch("/api/teacher-assignments")
      if (res.ok) setAssignments(await res.json())
    } catch { toast.error("Failed to load assignments.") }
    finally { setLoading(false) }
  }

  async function fetchTeachers() {
    try {
      const res = await fetch("/api/profiles?role=teacher")
      if (res.ok) setTeachers(await res.json())
    } catch {}
  }

  async function fetchClasses() {
    try {
      const res = await fetch("/api/classes")
      if (res.ok) setClasses(await res.json())
    } catch {}
  }

  async function fetchSubjects() {
    try {
      const res = await fetch("/api/subjects")
      if (res.ok) setSubjects(await res.json())
    } catch {}
  }

  function openAdd() { setEditing(null); setForm({ teacher_id: "", grade: 7, subject: "", class_id: "" }); setDialogOpen(true) }
  function openEdit(a: any) {
    setEditing(a)
    setForm({ teacher_id: a.teacher_id, grade: a.grade, subject: a.subject, class_id: a.class_id ?? "" })
    setDialogOpen(true)
  }

  async function handleSave() {
    try {
      const url = editing ? `/api/teacher-assignments/${editing.id}` : "/api/teacher-assignments"
      const method = editing ? "PUT" : "POST"
      const body: any = { teacher_id: form.teacher_id, grade: form.grade, subject: form.subject }
      if (form.class_id) body.class_id = form.class_id

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.ok) { toast.success(editing ? "Assignment updated!" : "Assignment added!"); setDialogOpen(false); fetchAssignments() }
      else { const err = await res.json(); toast.error(err.error ?? "Failed to save.") }
    } catch { toast.error("Failed to save.") }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this assignment?")) return
    try {
      const res = await fetch(`/api/teacher-assignments/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Assignment deleted."); fetchAssignments() }
      else toast.error("Failed to delete.")
    } catch { toast.error("Failed to delete.") }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setUploadResult(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/teacher-assignments/upload", { method: "POST", body: formData })
      const data = await res.json()
      setUploadResult(data.message ?? "Upload complete.")
      if (res.ok) { fetchAssignments(); toast.success(data.message) }
      else toast.error(data.message)
    } catch { toast.error("Upload failed.") }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = "" }
  }

  const grouped = assignments.reduce((acc: Record<string, any[]>, a: any) => {
    const key = a.profiles?.full_name || a.teacher_id
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="mr-1 h-4 w-4" />{uploading ? "Uploading..." : "Upload XLSX"}
        </Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
        <Button onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Assignment</Button>
      </div>
      {uploadResult && <p className="text-sm text-muted-foreground">{uploadResult}</p>}
      <Card>
        <CardHeader><CardTitle>Teacher Assignments</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>
          ) : assignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No assignments configured. Assign teachers to grades, subjects, and classes.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).sort(([, a], [, b]) => a[0]?.profiles?.full_name?.localeCompare(b[0]?.profiles?.full_name) || 0).map(([teacherName, items]) => (
                <div key={teacherName}>
                  <h3 className="mb-2 text-sm font-semibold">{teacherName}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.sort((a: any, b: any) => a.grade - b.grade || a.subject.localeCompare(b.subject)).map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell>Grade {a.grade}</TableCell>
                          <TableCell>{a.subject}</TableCell>
                          <TableCell>{a.classes ? `Grade ${a.classes.grade}${a.classes.class_name}` : "All classes"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(a)}><Settings className="mr-1 h-3 w-3" />Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}><Trash2 className="mr-1 h-3 w-3 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Assignment</DialogTitle><DialogDescription>Map a teacher to a grade, subject, and optional class section.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Teacher</Label>
              <select value={form.teacher_id} onChange={(e) => setForm(p => ({ ...p, teacher_id: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="">Select teacher...</option>
                {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Grade</Label>
              <select value={form.grade} onChange={(e) => setForm(p => ({ ...p, grade: Number(e.target.value) }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              <select value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="">Select subject...</option>
                {subjects.map((s: any) => <option key={s.id} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Class (optional — leave empty for all classes in this grade)</Label>
              <select value={form.class_id} onChange={(e) => setForm(p => ({ ...p, class_id: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="">All classes</option>
                {classes.filter((c: any) => c.grade === form.grade).map((c: any) => (
                  <option key={c.id} value={c.id}>Grade {c.grade}{c.class_name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.teacher_id || !form.subject}>{editing ? "Update" : "Add"} Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
