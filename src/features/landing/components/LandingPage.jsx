import { ArrowRight, Blocks, Bot, Download, Layers3, MousePointer2, Palette, PanelLeft, Smartphone, Sparkles, Wand2 } from 'lucide-react'
import { Editor } from '../../editor'

const featureCards = [
  {
    icon: MousePointer2,
    title: 'Design directly on canvas',
    copy: 'Create sections, text, shapes, image fills, layers, and multi-page layouts without leaving the workspace.',
  },
  {
    icon: Layers3,
    title: 'Layer-first structure',
    copy: 'Organize nested sections, reorder layers, and keep complex pages readable as your design grows.',
  },
  {
    icon: Palette,
    title: 'Figma-like controls',
    copy: 'Tune size, layout, fill, stroke, typography, spacing, and alignment from focused inspector panels.',
  },
]

const workflowSteps = [
  'Choose a page size or start from A4',
  'Draw sections, text, shapes, and image frames',
  'Refine layout, colors, typography, and layers',
  'Export PNG, PDF, project files, or AI-ready JSON',
]

export function LandingPage({ onStart }) {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Landing navigation">
        <button type="button" className="landing-brand" onClick={onStart}>
          <span className="landing-brand-mark">
            <Blocks size={18} />
          </span>
          <span>Builder Thinking</span>
        </button>
        <div className="landing-nav-actions">
          <a href="#demo">Demo</a>
          <a href="#workflow">Workflow</a>
          <button type="button" className="landing-nav-cta" onClick={onStart}>
            Start <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <h1>Build visual documents with a Canva-like editor.</h1>
          <p>
            Builder Thinking helps teams design resumes, portfolios, posters, documents, and AI-generated layouts
            with draggable pages, layers, inspector controls, and export-ready output.
          </p>
          <div className="landing-hero-actions">
            <button type="button" className="landing-primary" onClick={onStart}>
              Start designing <ArrowRight size={18} />
            </button>
            <a className="landing-secondary" href="#demo">
              View live demo
            </a>
          </div>
        </div>

        <div className="landing-hero-media" aria-label="Product preview placeholder">
          <div className="landing-video-placeholder">
            <div className="landing-video-play">
              <Sparkles size={22} />
            </div>
            <p>Video placeholder</p>
          </div>
        </div>
      </section>

      <section className="landing-feature-strip" aria-label="Core editor capabilities">
        {featureCards.map((feature) => {
          const Icon = feature.icon
          return (
            <article key={feature.title} className="landing-feature">
              <Icon size={22} />
              <h2>{feature.title}</h2>
              <p>{feature.copy}</p>
            </article>
          )
        })}
      </section>

      <section className="landing-ai-builder" aria-label="AI Builder coming soon">
        <div className="landing-ai-copy">
          <span className="landing-coming-soon">
            <Sparkles size={15} />
            Coming soon
          </span>
          <h2>AI Builder for automatic UI generation.</h2>
          <p>
            We are researching an AI-assisted workflow that can turn prompts, structured JSON, or design briefs into
            editable Builder Thinking pages. The goal is not a static image output, but real layers, sections, text,
            shapes, and export-ready pages that users can continue editing.
          </p>
        </div>
        <div className="landing-ai-card">
          <Bot size={28} />
          <div>
            <strong>Research preview</strong>
            <span>Prompt to editable page, AI-ready token import, and layout-aware generation.</span>
          </div>
        </div>
      </section>

      <section id="demo" className="landing-demo-section">
        <div className="landing-section-heading">
          <h2>Try the editor inside the page.</h2>
          <p>
            This embedded demo uses the same editor experience as the product screen. On smaller devices, the sidebars
            become drawers so the canvas stays reachable.
          </p>
        </div>
        <div className="landing-demo-frame">
          <Editor presentation="demo" />
        </div>
        <button type="button" className="landing-demo-start" onClick={onStart}>
          Open full editor <ArrowRight size={16} />
        </button>
      </section>

      <section id="workflow" className="landing-workflow">
        <div className="landing-workflow-copy">
          <h2>From blank page to export in one flow.</h2>
          <p>
            Keep layout work, rich text, page management, assets, and export controls in one focused browser workspace.
          </p>
          <ol>
            {workflowSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="landing-media-grid">
          <div className="landing-image-placeholder">
            <PanelLeft size={24} />
            <span>Inspector placeholder</span>
          </div>
          <div className="landing-image-placeholder tall">
            <Wand2 size={24} />
            <span>AI layout placeholder</span>
          </div>
          <div className="landing-image-placeholder">
            <Download size={24} />
            <span>Export preview placeholder</span>
          </div>
        </div>
      </section>

      <section className="landing-responsive">
        <div>
          <Smartphone size={26} />
          <h2>Responsive enough for quick edits, best on desktop.</h2>
        </div>
        <p>
          The editor keeps its full-power desktop workflow, then adapts sidebars into drawers on tablet and mobile.
          Users still get a clear recommendation to switch to desktop for detailed work.
        </p>
        <button type="button" className="landing-primary compact" onClick={onStart}>
          Start now
        </button>
      </section>
    </main>
  )
}
