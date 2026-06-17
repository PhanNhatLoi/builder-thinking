/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || process.env.VITE_APP_NAME || 'Builder Thinking',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VITE_API_BASE_URL || '',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
    NEXT_PUBLIC_GPT_API_KEY: process.env.NEXT_PUBLIC_GPT_API_KEY || process.env.VITE_GPT_API_KEY || '',
  },
}

export default nextConfig
