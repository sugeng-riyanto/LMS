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
import { Settings, Plus, UserPlus, Shield, Mail, Key, Eye, EyeOff, Power, PowerOff, Trash2, Play, Info, Upload, Download, Building2, Save } from "lucide-react"
import { GRADES, ROLES, ROLE_LABELS } from "@/lib/utils/constants"
import { PROVIDER_DEFAULTS, PROVIDER_LABELS, PROVIDER_LOGOS, PROVIDER_INSTRUCTIONS } from "@/types/ai-provider"
import type { UserProfile } from "@/types/user"
import type { AIProvider } from "@/types/ai-provider"
import toast from "react-hot-toast"

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  teacher: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  lab_assistant: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  student: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
}

const PROVIDER_TYPES = ["openai", "groq", "gemini", "opencodeai"] as const

export default function SettingsPage() {
  const { isSuperAdmin } = useRBAC()
  const [tab, setTab] = useState("users")

  // Users
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "student" as UserProfile["role"], grade: 7 })
  const [editForm, setEditForm] = useState({ role: "student" as UserProfile["role"], grade: 7 })

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
      if (tab === "ai-providers") fetchProviders()
    }
  }, [isSuperAdmin, tab])

  // === USERS ===
  async function fetchUsers() {
    setLoadingUsers(true)
    try {
      const res = await fetch("/api/users")
      if (res.ok) setUsers(await res.json())
    } catch {
      toast.error("Failed to load users.")
    } finally {
      setLoadingUsers(false)
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">User management and system configuration</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="users">
            <UserPlus className="mr-1 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="ai-providers">
            <Key className="mr-1 h-4 w-4" />
            AI Providers
          </TabsTrigger>
          <TabsTrigger value="school">
            <Building2 className="mr-1 h-4 w-4" />
            School
          </TabsTrigger>
        </TabsList>

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

          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Users (XLSX)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Upload an XLSX file with columns: email, full_name, role, grade_assigned.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    const res = await fetch("/api/users/template")
                    if (!res.ok) throw new Error("Failed")
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url; a.download = "user-template.xlsx"; a.click()
                    URL.revokeObjectURL(url)
                    toast.success("Template downloaded")
                  } catch {
                    toast.error("Failed to download template")
                  }
                }}>
                  <Download className="mr-1 h-3 w-3" />
                  Download Template
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
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <div className="flex items-center gap-1 font-semibold mb-1">
                      <Info className="h-3 w-3" />
                      {PROVIDER_INSTRUCTIONS[providerForm.provider_type].key_source}
                    </div>
                    <p>Dapatkan API key di: <a href={PROVIDER_INSTRUCTIONS[providerForm.provider_type].key_url} target="_blank" rel="noopener noreferrer" className="underline">{PROVIDER_INSTRUCTIONS[providerForm.provider_type].key_url}</a></p>
                    <p className="mt-1">{PROVIDER_INSTRUCTIONS[providerForm.provider_type].notes}</p>
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

        <TabsContent value="school" className="space-y-6">
          <SchoolSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SchoolSettings() {
  const [form, setForm] = useState({
    school_name: "Sekolah Harapan Bangsa - Modernhill",
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

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
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
