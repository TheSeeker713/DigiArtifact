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
  trailingSlash: true, // Required for Cloudflare Pages to resolve paths correctly
}

module.exports = nextConfig
