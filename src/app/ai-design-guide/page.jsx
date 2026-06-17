import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const metadata = {
  title: 'AI Design Guide - Builder Thinking',
  description: 'Public Builder Thinking guide for AI agents generating importable design JSON.',
}

async function readAiGuide() {
  return readFile(path.join(process.cwd(), 'src/features/editor/ai/AI_DESIGN_GUIDE.md'), 'utf8')
}

export default async function AiDesignGuidePage() {
  const aiDesignGuide = await readAiGuide()

  return (
    <main className="ai-guide-page">
      <nav className="ai-guide-nav" aria-label="AI guide navigation">
        <a className="landing-brand" href="/">
          <span className="landing-brand-mark">BT</span>
          <span>Builder Thinking</span>
        </a>
        <a className="ai-guide-back" href="/">
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
