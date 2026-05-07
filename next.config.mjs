/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium', 'cheerio', 'groq-sdk'],
};

export default nextConfig;
