import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    // Send Railway-hostname traffic to the clean custom domain when configured
    const canonicalHost = process.env.NEXT_PUBLIC_CANONICAL_HOST;
    if (!canonicalHost) return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "(?<railway>.*\\.up\\.railway\\.app)" }],
        destination: `https://${canonicalHost}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
