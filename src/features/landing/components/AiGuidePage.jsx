import { ArrowLeft, Blocks } from 'lucide-react'
import { useEffect } from 'react'
import aiDesignGuide from '../../editor/ai/AI_DESIGN_GUIDE.md?raw'
import { env } from '../../../shared/config/env'

export function AiGuidePage() {
  useEffect(() => {
    document.title = `AI Design Guide - ${env.appName}`
  }, [])

  return (
    <main className="ai-guide-page">
      <nav className="ai-guide-nav" aria-label="AI guide navigation">
        <a className="landing-brand" href="/">
          <span className="landing-brand-mark">
            <Blocks size={18} />
          </span>
          <span>Builder Thinking</span>
        </a>
        <a className="ai-guide-back" href="/">
          <ArrowLeft size={16} />
          Back to home
        </a>
      </nav>

      <article className="ai-guide-shell">
        <header className="ai-guide-header">
          <p>Public AI reference</p>
          <h1>Builder Thinking AI Design Guide</h1>
          <span>/ai-design-guide</span>
        </header>
        <pre className="ai-guide-content">{aiDesignGuide}</pre>
      </article>
    </main>
  )
}
