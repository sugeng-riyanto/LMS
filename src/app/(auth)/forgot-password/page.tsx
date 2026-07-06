"use client"

import { useState } from "react"
export const dynamic = "force-dynamic"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import { Loader2, CheckCircle } from "lucide-react"

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
      toast.success("Tautan reset telah dikirim ke email.")
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="text-lg font-semibold">Email Terkirim</h2>
        <p className="text-sm text-muted-foreground">
          Jika akun dengan <strong>{email}</strong> terdaftar, Anda akan menerima tautan reset password dalam beberapa saat.
          Periksa kotak masuk atau folder spam Anda.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-primary hover:underline"
        >
          Kembali ke Login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Lupa Password</h2>
        <p className="text-sm text-muted-foreground">
          Masukkan email Anda dan kami akan mengirimkan tautan reset password.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="reset-email">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          placeholder="nama@shb.sch.id"
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
        Kirim Tautan Reset
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Ingat password?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  )
}
