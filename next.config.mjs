import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
}

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Disable PWA during development to avoid multiple GenerateSW warnings
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    // Always hit the network for API routes (never cache) and explicitly
    // handle them so workbox stops logging "No route found for: /api/...".
    // Two entries are required because workbox matches GET by default only.
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkOnly',
      method: 'GET',
      options: {
        cacheName: 'api-routes',
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkOnly',
      method: 'POST',
      options: {
        cacheName: 'api-routes',
      },
    },
  ],
})

export default withPWAConfig(nextConfig)
