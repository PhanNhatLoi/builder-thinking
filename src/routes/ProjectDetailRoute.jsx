'use client'

import dynamic from 'next/dynamic'

const ProjectDetailPage = dynamic(
  () => import('../features/auth/ProjectDetailPage').then((module) => module.ProjectDetailPage),
  { ssr: false },
)

export function ProjectDetailRoute({ publicId, templateMode = false }) {
  return <ProjectDetailPage publicId={publicId} templateMode={templateMode} />
}
