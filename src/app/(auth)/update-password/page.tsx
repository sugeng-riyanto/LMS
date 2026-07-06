"use client"

import { useState, useEffect } from "react"
export const dynamic = "force-dynamic"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setChecking(false)
      }
    })
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) setChecking(false)
    })
    return () => subscription?.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { toast.error(error.message); return }
      setDone(true)
      toast.success("Password updated! Redirecting to login...")
      setTimeout(() => router.push("/login"), 2000)
    } catch { toast.error("Failed to update password") }
    finally { setLoading(false) }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Password updated</h2>
        <p className="text-sm text-muted-foreground">Your password has been changed successfully.</p>
        <Link href="/login" className="inline-block text-sm text-primary hover:underline">Sign in</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Set new password</h2>
        <p className="text-sm text-muted-foreground">Enter your new password below.</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="new-pw">New Password</label>
        <div className="relative">
          <input id="new-pw" type={showPw ? "text" : "password"} placeholder="Min. 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="confirm-pw">Confirm Password</label>
        <input id="confirm-pw" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Password
      </button>
    </form>
  )
}
