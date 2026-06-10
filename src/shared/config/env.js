export const env = {
  appName: import.meta.env.VITE_APP_NAME || "Builder Thinking",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api",
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  openApiKey: import.meta.env.VITE_GPT_API_KEY || "",
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
