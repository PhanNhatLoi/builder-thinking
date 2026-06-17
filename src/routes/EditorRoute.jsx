'use client'

import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('../features/editor/components/Editor'), { ssr: false })

export function EditorRoute() {
  return <Editor onBack={() => window.history.back()} />
}
