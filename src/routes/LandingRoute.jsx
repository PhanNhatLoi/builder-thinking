'use client'

import dynamic from 'next/dynamic'
import { hasAccessToken } from '../shared/utils/authCookies'

const LandingPage = dynamic(
  () => import('../features/landing/components/LandingPage').then((module) => module.LandingPage),
  { ssr: false },
)

export function LandingRoute() {
  const handleStart = () => {
    window.location.href = hasAccessToken() ? '/getlist' : '/login'
  }

  return <LandingPage onStart={handleStart} />
}
