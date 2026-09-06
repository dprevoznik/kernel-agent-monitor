/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Report-only: never blocks, but flags anything outside our expected
          // origins. The live browser view is framed from *.onkernel.com.
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "img-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data: https://fonts.gstatic.com",
              "frame-src 'self' https://*.onkernel.com",
              "connect-src 'self' https://mcp.onkernel.com https://ai-gateway.vercel.sh https://api.vercel.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
