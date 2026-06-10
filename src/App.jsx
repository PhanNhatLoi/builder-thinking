import { useEffect, useState } from 'react'
import { AppProviders } from './app/providers'
import { GetListPage, LoginPage, ProjectDetailPage } from './features/auth'
import { Editor } from './features/editor'
import { LandingPage } from './features/landing'
import { env } from './shared/config/env'

function getInitialScreen() {
  const hash = window.location.hash.replace('#', '')

  if (hash.startsWith('project/') || hash.startsWith('detail/')) {
    return `project:${hash.split('/').slice(1).join('/')}`
  }

  if (hash === 'editor' || hash === 'login' || hash === 'getlist') {
    return hash
  }

  return 'landing'
}

export default function App() {
  const [screen, setScreen] = useState(getInitialScreen)

  useEffect(() => {
    document.title = env.appName
  }, [])

  useEffect(() => {
    const handleHashChange = () => setScreen(getInitialScreen())

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const openEditor = () => {
    window.location.hash = 'editor'
    setScreen('editor')
  }

  return (
    <AppProviders>
      {screen === 'editor' ? <Editor /> : null}
      {screen === 'login' ? <LoginPage /> : null}
      {screen === 'getlist' ? <GetListPage /> : null}
      {screen.startsWith('project:') ? <ProjectDetailPage publicId={screen.slice('project:'.length)} /> : null}
      {screen === 'landing' ? <LandingPage onStart={openEditor} /> : null}
    </AppProviders>
  )
}
