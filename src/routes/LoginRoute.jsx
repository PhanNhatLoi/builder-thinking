'use client'

import dynamic from 'next/dynamic'

const LoginPage = dynamic(() => import('../features/auth/LoginPage').then((module) => module.LoginPage), { ssr: false })

export function LoginRoute() {
  return <LoginPage />
}
