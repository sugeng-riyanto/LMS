import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPECHECK === "1",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "phet.colorado.edu" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizePackageImports: ["lucide-react", "date-fns", "@radix-ui/react-checkbox"],
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
}

export default nextConfig
