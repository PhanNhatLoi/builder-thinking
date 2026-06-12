export const endpoints = {
  auth: {
    googleLogin: '/auth/google',
    login: '/auth/login',
    refreshToken: '/auth/refresh-token',
  },
  projects: {
    list: '/projects',
    detail: (publicId) => `/projects/${encodeURIComponent(publicId)}`,
    init: (publicId) => `/projects/${encodeURIComponent(publicId)}/init`,
    nodes: (publicId) => `/projects/${encodeURIComponent(publicId)}/nodes`,
  },
  uploads: {
    images: '/uploads/images',
  },
}
