/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true, // For Cloudflare Pages static export
  },
  output: 'export', // Static export for Cloudflare Pages
}

module.exports = nextConfig
