import { useEffect, useState } from 'react'
import { Edit3, FileText, GalleryVerticalEnd, LayoutDashboard, LayoutTemplate, LogOut, Plus, RefreshCcw, ShieldAlert, X } from 'lucide-react'
import { createProject, getProjectInitPublic, listTemplates, updateProject } from './api'
import { StaticPagePreview } from '../editor/components/canvas/StaticPagePreview'
import { parseProjectToken } from '../editor/export/exportDocument'
import { clearAuthCookies } from '../../shared/utils/authCookies'

function formatProjectDate(value) {
  if (!value) return 'No date'

  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function projectName(project, index) {
  return project.name?.trim() || `Untitled template ${index + 1}`
}

function projectPublicId(project) {
  return project.publicId || project.hashkeyid
}

function authorName(template) {
  const author = template.author || template.owner || template.createdBy || template.user
  return template.authorName ||
    template.ownerName ||
    template.createdByName ||
    author?.name ||
    author?.fullName ||
    author?.email ||
    'Unknown author'
}

export function TemplateListPage() {
  const [templates, setTemplates] = useState(null)
  const [error, setError] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [previewContent, setPreviewContent] = useState('')
  const [previewProject, setPreviewProject] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isUsingTemplate, setIsUsingTemplate] = useState(false)

  const loadTemplates = async () => {
    setError('')
    setIsLoading(true)

    try {
      const templateData = await listTemplates({ page: 1, limit: 20 })
      setTemplates(templateData)
    } catch (err) {
      setError(err.message || 'Could not load templates.')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearAuthCookies()
    window.location.href = '/login'
  }

  const openProject = (publicId) => {
    window.location.href = `/project/${encodeURIComponent(publicId)}`
  }

  const closePreview = () => {
    if (isPreviewLoading || isUsingTemplate) return

    setPreviewError('')
    setPreviewContent('')
    setPreviewProject(null)
    setPreviewTemplate(null)
  }

  const previewTemplateCard = async (template, index) => {
    const publicId = projectPublicId(template)
    if (!publicId) return

    setPreviewError('')
    setPreviewContent('')
    setPreviewProject(null)
    setPreviewTemplate({
      ...template,
      displayName: projectName(template, index),
      publicId,
    })
    setIsPreviewLoading(true)

    try {
      const detail = await getProjectInitPublic(publicId)
      const content = detail.content?.trim() || ''
      setPreviewContent(content)
      setPreviewProject(content ? await parseProjectToken(content) : null)
    } catch (err) {
      setPreviewError(err.message || 'Could not load template preview.')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const useTemplate = async () => {
    if (!previewTemplate || !previewContent || isUsingTemplate) return

    const copyName = `copy-${previewTemplate.displayName}`
    setPreviewError('')
    setIsUsingTemplate(true)
    try {
      const project = await createProject({ name: copyName,content: previewContent, })
      const publicId = projectPublicId(project)

      if (!publicId) {
        throw new Error('Project was created without a public id.')
      }
      openProject(publicId)
    } catch (err) {
      setPreviewError(err.message || 'Could not create project from template.')
    } finally {
      setIsUsingTemplate(false)
    }
  }

  const createNewProject = async () => {
    setError('')
    setIsCreating(true)

    try {
      const project = await createProject()
      const publicId = projectPublicId(project)

      if (!publicId) {
        throw new Error('Project was created without a public id.')
      }

      openProject(publicId)
    } catch (err) {
      setError(err.message || 'Could not create project.')
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const templateItems = templates?.items || []

  return (
    <main className="project-list-page">
      <aside className="project-list-sidebar" aria-label="Workspace navigation">
        <a className="project-list-brand" href="/">
          <span className="project-list-brand-mark">B</span>
          <span>Builder Thinking</span>
        </a>

        <nav className="project-list-nav" aria-label="Primary navigation">
          <a href="/getlist">
            <LayoutDashboard size={18} />
            My pages
          </a>
          <a className="active" href="/templates">
            <GalleryVerticalEnd size={18} />
            Templates
          </a>
          <button type="button" onClick={createNewProject} disabled={isCreating}>
            <Edit3 size={18} />
            {isCreating ? 'Creating' : 'New draft'}
          </button>
        </nav>

        <div className="project-list-sidebar-footer">
          <button type="button" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <section className="project-list-shell">
        <header className="project-list-header">
          <div>
            <h1>Templates</h1>
            <p>Browse reusable public templates from the community.</p>
          </div>
          <div className="project-list-actions">
            <button type="button" onClick={loadTemplates} disabled={isLoading}>
              <RefreshCcw size={16} />
              {isLoading ? 'Refreshing' : 'Refresh'}
            </button>
            <button type="button" className="primary" onClick={createNewProject} disabled={isCreating}>
              <Plus size={16} />
              {isCreating ? 'Creating' : 'New page'}
            </button>
          </div>
        </header>

        {error ? (
          <div className="project-list-error" role="alert">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="project-list-panel">
          <div className="project-list-panel-head">
            <LayoutTemplate size={20} />
            <strong>{templateItems.length} templates</strong>
            {isLoading ? <span>Loading</span> : null}
          </div>

          {templateItems.length ? (
            <div className="project-card-grid" aria-label="Public template list">
              {templateItems.map((template, index) => {
                const publicId = projectPublicId(template)
                const name = projectName(template, index)

                return (
                  <article className="project-card template" key={template.id || publicId}>
                    <button type="button" className="project-card-open" onClick={() => previewTemplateCard(template, index)}>
                      <span className="project-card-preview" aria-hidden="true">
                        <FileText size={34} />
                      </span>
                      <span className="project-card-body">
                        <strong>{name}</strong>
                        <span className="project-card-meta">
                          <span>By {authorName(template)}</span>
                          <span className="project-card-badge">Template</span>
                        </span>
                        <span className="project-card-meta">
                          <span>Modified {formatProjectDate(template.modifiedDate || template.createdDate)}</span>
                        </span>
                      </span>
                    </button>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="project-list-empty">
              {isLoading ? 'Loading templates...' : 'No public templates returned.'}
            </div>
          )}
        </div>
      </section>

      {previewTemplate ? (
        <div className="confirm-modal-backdrop template-preview-backdrop" role="presentation">
          <section className="template-preview-modal" role="dialog" aria-modal="true" aria-labelledby="template-preview-title">
            <div className="template-preview-header">
              <div>
                <h2 id="template-preview-title">{previewTemplate.displayName}</h2>
                <p>By {authorName(previewTemplate)}</p>
              </div>
              <button type="button" className="confirm-modal-close" aria-label="Close template preview" onClick={closePreview}>
                <X size={16} />
              </button>
            </div>

            <div className="template-preview-stage">
              {isPreviewLoading ? (
                <div className="project-list-empty">Loading preview...</div>
              ) : previewError ? (
                <div className="project-list-inline-error" role="alert">
                  <ShieldAlert size={18} />
                  <span>{previewError}</span>
                </div>
              ) : previewProject?.pages?.[0]?.serialized ? (
                <div className="template-preview-canvas">
                  <StaticPagePreview serialized={previewProject.pages[0].serialized} />
                </div>
              ) : (
                <div className="project-list-empty">No preview available.</div>
              )}
            </div>

            <div className="confirm-modal-actions">
              <button type="button" onClick={closePreview} disabled={isPreviewLoading || isUsingTemplate}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={useTemplate} disabled={isPreviewLoading || isUsingTemplate || Boolean(previewError) || !previewContent}>
                {isUsingTemplate ? 'Creating...' : 'Use template'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
