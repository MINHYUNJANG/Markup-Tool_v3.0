/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', '@sparticuz/chromium', 'cheerio', 'groq-sdk'],
  },
};

export default nextConfig;
