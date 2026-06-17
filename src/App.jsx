import { useEffect, useState } from 'react'
import { AppProviders } from './app/providers'
import { GetListPage, LoginPage, ProjectDetailPage, TemplateListPage } from './features/auth'
import { Editor } from './features/editor'
import { AiGuidePage, LandingPage } from './features/landing'
import { env } from './shared/config/env'

function getInitialScreen() {
  if (window.location.pathname === '/ai-design-guide') {
    return 'ai-guide'
  }

  const hash = window.location.hash.replace('#', '')

  if (hash.startsWith('project/') || hash.startsWith('detail/')) {
    return `project:${hash.split('/').slice(1).join('/')}`
  }

  if (hash.startsWith('template/')) {
    return `template:${hash.split('/').slice(1).join('/')}`
  }

  if (hash === 'ai-design-guide' || hash === 'editor' || hash === 'login' || hash === 'getlist' || hash === 'templates') {
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
      {screen === 'templates' ? <TemplateListPage /> : null}
      {screen === 'ai-guide' || screen === 'ai-design-guide' ? <AiGuidePage /> : null}
      {screen.startsWith('project:') ? <ProjectDetailPage publicId={screen.slice('project:'.length)} /> : null}
      {screen.startsWith('template:') ? <ProjectDetailPage publicId={screen.slice('template:'.length)} templateMode /> : null}
      {screen === 'landing' ? <LandingPage onStart={openEditor} /> : null}
    </AppProviders>
  )
}
