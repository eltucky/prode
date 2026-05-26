import type { NextConfig } from "next"
import withSerwist from "@serwist/next"

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

export default withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
})(nextConfig)
