export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || process.env.VITE_APP_NAME || "Builder Thinking",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:4001/api",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "",
  openApiKey: process.env.NEXT_PUBLIC_GPT_API_KEY || process.env.VITE_GPT_API_KEY || "",
  mode: process.env.NODE_ENV,
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
};
