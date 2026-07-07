import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPECHECK === "1",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "phet.colorado.edu" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizePackageImports: ["lucide-react", "date-fns", "@radix-ui/react-checkbox"],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
}

export default nextConfig
