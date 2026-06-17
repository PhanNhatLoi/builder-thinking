'use client'

import dynamic from 'next/dynamic'

const LandingPage = dynamic(
  () => import('../features/landing/components/LandingPage').then((module) => module.LandingPage),
  { ssr: false },
)

export function LandingRoute() {
  return <LandingPage onStart={() => { window.location.href = '/editor' }} />
}
