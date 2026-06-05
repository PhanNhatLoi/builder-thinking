export const env = {
  appName: import.meta.env.VITE_APP_NAME || "Builder Thinking",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "",
  openApiKey: import.meta.env.VITE_GPT_API_KEY || "",
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
