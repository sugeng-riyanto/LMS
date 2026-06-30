"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, User, Lock, Eye, EyeOff, Shield } from "lucide-react"
import { ROLE_LABELS } from "@/lib/utils/constants"
import toast from "react-hot-toast"

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const { role } = useRBAC()

  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [saving, setSaving] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name)
  }, [profile])

  async function handleSaveProfile() {
    if (!profile) return
    if (!fullName.trim()) { toast.error("Name cannot be empty"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim() }),
      })
      if (res.ok) { toast.success("Profile updated"); refreshProfile?.() }
      else { const err = await res.json().catch(() => ({ error: "Unknown" })); toast.error(err.error || "Update failed") }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Update failed") }
    finally { setSaving(false) }
  }

  async function handleChangePassword() {
    if (!newPassword) { toast.error("New password is required"); return }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return }

    setChangingPw(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { toast.error(error.message); return }
      toast.success("Password changed successfully!")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch { toast.error("Failed to change password") }
    finally { setChangingPw(false) }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account and security</p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account"><User className="mr-1 h-4 w-4" />Account</TabsTrigger>
          <TabsTrigger value="security"><Lock className="mr-1 h-4 w-4" />Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={profile?.email ?? ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Grade</Label>
                  <Input value={profile?.grade ? `Grade ${profile.grade}` : "-"} disabled className="bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Input value={ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role ?? "-"} disabled className="bg-muted" />
                </div>
              </div>
              <Separator />
              <Button onClick={handleSaveProfile} disabled={saving || !fullName.trim()}>
                <Save className="mr-1 h-4 w-4" />{saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>New Password</Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
              </div>
              <Separator />
              <Button onClick={handleChangePassword} disabled={changingPw || !newPassword || !confirmPassword}>
                <Lock className="mr-1 h-4 w-4" />{changingPw ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
