import { useEffect, useState } from 'react'
import { Edit3, FileText, FolderKanban, LayoutDashboard, LogOut, Plus, RefreshCcw, ShieldAlert } from 'lucide-react'
import { createProject, listProjects } from './api'
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
    window.location.hash = 'login'
  }

  const openProject = (publicId) => {
    window.location.hash = `project/${encodeURIComponent(publicId)}`
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

  useEffect(() => {
    loadProjects()
  }, [])

  const projectItems = projects?.items || []

  return (
    <main className="project-list-page">
      <aside className="project-list-sidebar" aria-label="Workspace navigation">
        <a className="project-list-brand" href="#home">
          <span className="project-list-brand-mark">B</span>
          <span>Builder Thinking</span>
        </a>

        <nav className="project-list-nav" aria-label="Primary navigation">
          <a className="active" href="#getlist">
            <LayoutDashboard size={18} />
            My pages
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
            <p>Open an existing page or continue editing your saved work.</p>
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
            <strong>{projectItems.length} pages</strong>
            {isLoading ? <span>Loading</span> : null}
          </div>

          {projectItems.length ? (
            <div className="project-card-grid" aria-label="Project list">
              {projectItems.map((project, index) => {
                const projectPublicId = project.publicId || project.hashkeyid
                const name = projectName(project, index)

                return (
                  <button
                    type="button"
                    className="project-card"
                    key={project.id || projectPublicId}
                    onClick={() => openProject(projectPublicId)}
                  >
                    <span className="project-card-preview" aria-hidden="true">
                      <FileText size={34} />
                    </span>
                    <span className="project-card-body">
                      <strong>{name}</strong>
                      <span>Modified {formatProjectDate(project.modifiedDate || project.createdDate)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="project-list-empty">
              {isLoading ? 'Loading projects...' : 'No projects returned.'}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
