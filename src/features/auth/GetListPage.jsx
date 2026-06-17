import { useEffect, useState } from 'react'
import { Edit3, FileText, FolderKanban, GalleryVerticalEnd, LayoutDashboard, LogOut, Plus, RefreshCcw, ShieldAlert, Trash2, X } from 'lucide-react'
import { createProject, deleteProject, listProjects } from './api'
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
  return project.name?.trim() || `Untitled page ${index + 1}`
}

export function GetListPage() {
  const [projects, setProjects] = useState(null)
  const [error, setError] = useState('')
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(null)
  const [deletingPublicId, setDeletingPublicId] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loadProjects = async () => {
    setError('')
    setIsLoading(true)

    try {
      const data = await listProjects({ page: 1, limit: 10 })
      setProjects(data)
    } catch (err) {
      setError(err.message || 'Could not load projects.')
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

  const createNewProject = async () => {
    setError('')
    setIsCreating(true)

    try {
      const project = await createProject()
      const projectPublicId = project.publicId || project.hashkeyid

      if (!projectPublicId) {
        throw new Error('Project was created without a public id.')
      }

      openProject(projectPublicId)
    } catch (err) {
      setError(err.message || 'Could not create project.')
    } finally {
      setIsCreating(false)
    }
  }

  const requestDeleteProject = (project, index) => {
    setConfirmDeleteProject({
      ...project,
      displayName: projectName(project, index),
      publicId: project.publicId || project.hashkeyid,
    })
  }

  const confirmDelete = async () => {
    const publicId = confirmDeleteProject?.publicId
    if (!publicId || deletingPublicId) return

    setError('')
    setDeletingPublicId(publicId)

    try {
      await deleteProject(publicId)
      setProjects((currentProjects) => currentProjects
        ? {
            ...currentProjects,
            items: (currentProjects.items || []).filter((project) => (project.publicId || project.hashkeyid) !== publicId),
            total: Math.max(0, (currentProjects.total || 0) - 1),
          }
        : currentProjects)
      setConfirmDeleteProject(null)
    } catch (err) {
      setError(err.message || 'Could not delete project.')
    } finally {
      setDeletingPublicId('')
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const allProjectItems = projects?.items || []
  const projectItems = allProjectItems.filter((project) => {
    if (projectFilter === 'templates') return project.template
    if (projectFilter === 'pages') return !project.template
    return true
  })
  const panelTitle = {
    all: `${projectItems.length} pages`,
    pages: `${projectItems.length} personal pages`,
    templates: `${projectItems.length} templates`,
  }[projectFilter]

  return (
    <main className="project-list-page">
      <aside className="project-list-sidebar" aria-label="Workspace navigation">
        <a className="project-list-brand" href="/">
          <span className="project-list-brand-mark">B</span>
          <span>Builder Thinking</span>
        </a>

        <nav className="project-list-nav" aria-label="Primary navigation">
          <a className="active" href="/getlist">
            <LayoutDashboard size={18} />
            My pages
          </a>
          <a href="/templates">
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
            <h1>My pages</h1>
            <p>Open a saved page, continue editing, or browse reusable templates.</p>
          </div>
          <div className="project-list-actions">
            <button type="button" onClick={loadProjects} disabled={isLoading}>
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
            <FolderKanban size={20} />
            <strong>{panelTitle}</strong>
            {isLoading ? <span>Loading</span> : null}
          </div>
          <div className="project-list-filters" aria-label="Project filters">
            <button type="button" className={projectFilter === 'all' ? 'active' : ''} onClick={() => setProjectFilter('all')}>
              All
            </button>
            <button type="button" className={projectFilter === 'pages' ? 'active' : ''} onClick={() => setProjectFilter('pages')}>
              Pages
            </button>
            <button type="button" className={projectFilter === 'templates' ? 'active' : ''} onClick={() => setProjectFilter('templates')}>
              Templates
            </button>
          </div>

          {projectItems.length ? (
            <div className="project-card-grid" aria-label="Project list">
              {projectItems.map((project, index) => {
                const projectPublicId = project.publicId || project.hashkeyid
                const name = projectName(project, index)

                return (
                  <article className="project-card" key={project.id || projectPublicId}>
                    <button
                      type="button"
                      className="project-card-open"
                      onClick={() => openProject(projectPublicId)}
                    >
                      <span className="project-card-preview" aria-hidden="true">
                        <FileText size={34} />
                      </span>
                      <span className="project-card-body">
                        <strong>{name}</strong>
                        <span className="project-card-meta">
                          <span>Modified {formatProjectDate(project.modifiedDate || project.createdDate)}</span>
                          {project.template ? <span className="project-card-badge">Template</span> : null}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="project-card-delete"
                      aria-label={`Delete ${name}`}
                      disabled={deletingPublicId === projectPublicId}
                      onClick={() => requestDeleteProject(project, index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="project-list-empty">
              {isLoading ? 'Loading projects...' : 'No projects match this filter.'}
            </div>
          )}
        </div>

      </section>

      {confirmDeleteProject ? (
        <div className="confirm-modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-project-title">
            <div className="confirm-modal-header">
              <div>
                <h2 id="delete-project-title">Delete page</h2>
                <p>This action cannot be undone.</p>
              </div>
              <button type="button" className="confirm-modal-close" aria-label="Close" onClick={() => setConfirmDeleteProject(null)}>
                <X size={16} />
              </button>
            </div>
            <p className="confirm-modal-message">
              Delete <strong>{confirmDeleteProject.displayName}</strong>?
            </p>
            <div className="confirm-modal-actions">
              <button type="button" onClick={() => setConfirmDeleteProject(null)} disabled={Boolean(deletingPublicId)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={confirmDelete} disabled={Boolean(deletingPublicId)}>
                {deletingPublicId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
