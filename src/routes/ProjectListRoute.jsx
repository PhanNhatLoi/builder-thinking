'use client'

import dynamic from 'next/dynamic'

const GetListPage = dynamic(() => import('../features/auth/GetListPage').then((module) => module.GetListPage), {
  ssr: false,
})

export function ProjectListRoute() {
  return <GetListPage />
}
