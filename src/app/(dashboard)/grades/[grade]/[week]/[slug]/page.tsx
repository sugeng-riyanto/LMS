"use client"

import { useParams } from "next/navigation"
import dynamic from "next/dynamic"

const PackageDetailPage = dynamic(() => import("@/app/(dashboard)/grades/[grade]/[week]/page"), { ssr: false })

export default function SlugPage() {
  const params = useParams()
  // Slug is cosmetic — render the same package detail page
  return <PackageDetailPage />
}
