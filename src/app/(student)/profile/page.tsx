"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Save, User } from "lucide-react"
import toast from "react-hot-toast"

export default function StudentProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      })
      if (res.ok) {
        toast.success("Profile updated")
        refreshProfile?.()
      } else {
        toast.error("Failed to update profile")
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your account details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </div>
          <div className="space-y-1">
            <Label>Grade</Label>
            <Input value={`Grade ${profile?.grade ?? "-"}`} disabled className="bg-muted" />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Input value="Student" disabled className="bg-muted" />
          </div>
          <Separator />
          <Button onClick={handleSave} disabled={saving || !fullName.trim()}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
