/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright', 'cheerio', 'groq-sdk'],
  },
};

export default nextConfig;
