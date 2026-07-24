/** @type {import('next').NextConfig} */
const nextConfig = {
  output: undefined,
  transpilePackages: ["@aqui/database", "@aqui/shared"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS: enforce HTTPS for 2 years including subdomains
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // CSP: baseline policy.
          // unsafe-inline/unsafe-eval required by Next.js + Tailwind today.
          // TODO: migrate to nonce-based CSP when upgrading to Next.js 15+.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.snapshot = {
      ...config.snapshot,
      managedPaths: [
        ...(config.snapshot?.managedPaths || []),
        /@next\/swc-[a-z0-9-]+/,
      ],
    };
    return config;
  },
};

module.exports = nextConfig;
