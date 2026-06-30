import { Inter } from "next/font/google"
import { FlaskConical } from "lucide-react"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} flex min-h-screen items-center justify-center bg-muted p-4`}>
      <div className="w-full max-w-sm space-y-6">
        <Link href="/login" className="flex flex-col items-center gap-2">
          <FlaskConical className="h-10 w-10 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Physics Command Center</h1>
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </div>
  )
}
