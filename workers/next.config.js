/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Cloudflare Pages uses /out or custom output directory
  distDir: 'out',
}

module.exports = nextConfig
