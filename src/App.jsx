import { useEffect, useState } from 'react'
import { AppProviders } from './app/providers'
import { Editor } from './features/editor'
import { LandingPage } from './features/landing'
import { env } from './shared/config/env'

function getInitialScreen() {
  return window.location.hash === '#editor' ? 'editor' : 'landing'
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
      {screen === 'editor' ? <Editor /> : <LandingPage onStart={openEditor} />}
    </AppProviders>
  )
}
