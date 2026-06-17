'use client'

import dynamic from 'next/dynamic'

const TemplateListPage = dynamic(
  () => import('../features/auth/TemplateListPage').then((module) => module.TemplateListPage),
  { ssr: false },
)

export function TemplateListRoute() {
  return <TemplateListPage />
}
