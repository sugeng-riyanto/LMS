"use client"

import { useState } from "react"
export const dynamic = "force-dynamic"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
      toast.success("Check your email for the reset link.")
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Check your inbox</h2>
        <p className="text-sm text-muted-foreground">
          If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Reset password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="reset-email">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send reset link
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
