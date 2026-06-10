export const endpoints = {
  auth: {
    googleLogin: '/auth/google',
    login: '/auth/login',
    refreshToken: '/auth/refresh-token',
  },
  projects: {
    list: '/projects',
    detail: (publicId) => `/projects/${encodeURIComponent(publicId)}`,
  },
}
