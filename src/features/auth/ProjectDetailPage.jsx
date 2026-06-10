import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from '../editor'
import { parseProjectToken, stringifyProjectToken } from '../editor/export/exportDocument'
import { getProjectDetail, updateProject } from './api'

const autosaveDelayMs = 5000

export function ProjectDetailPage({ publicId }) {
  const [project, setProject] = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle')
  const ignoreNextChangeRef = useRef(false)
  const lastSavedContentRef = useRef('')
  const pendingContentRef = useRef('')
  const saveTimerRef = useRef(null)

  const decodedPublicId = useMemo(() => decodeURIComponent(publicId || ''), [publicId])

  const loadProject = useCallback(async () => {
    if (!decodedPublicId) {
      setError('Missing project id.')
      return
    }

    setError('')
    setSaveError('')
    setSaveStatus('idle')
    setProject(null)
    setProjectData(null)
    setIsLoading(true)
    ignoreNextChangeRef.current = false
    pendingContentRef.current = ''
    window.clearTimeout(saveTimerRef.current)

    try {
      const detail = await getProjectDetail(decodedPublicId)
      const initialContent = detail.content?.trim() || ''

      setProject(detail)
      setProjectData(initialContent ? await parseProjectToken(initialContent) : null)
      ignoreNextChangeRef.current = true
      lastSavedContentRef.current = initialContent
      pendingContentRef.current = ''
    } catch (err) {
      setError(err.message || 'Could not load project detail.')
      setProjectData(null)
    } finally {
      setIsLoading(false)
    }
  }, [decodedPublicId])

  const saveProjectContent = useCallback(async (nextContent, { force = false } = {}) => {
    if (!decodedPublicId || !nextContent) return

    window.clearTimeout(saveTimerRef.current)
    setSaveError('')

    if (!force && nextContent === lastSavedContentRef.current) {
      pendingContentRef.current = ''
      setSaveStatus('saved')
      return
    }

    pendingContentRef.current = nextContent
    setSaveStatus('saving')

    try {
      const nextProject = await updateProject(decodedPublicId, { content: nextContent })
      setProject(nextProject)
      lastSavedContentRef.current = nextContent
      if (pendingContentRef.current === nextContent) {
        pendingContentRef.current = ''
        setSaveStatus('saved')
      }
    } catch (err) {
      if (pendingContentRef.current === nextContent) {
        setSaveError(err.message || 'Could not save project.')
        setSaveStatus('error')
      }
    }
  }, [decodedPublicId])

  const handleProjectChange = useCallback((nextProjectData) => {
    if (!decodedPublicId || !nextProjectData) return

    const nextContent = stringifyProjectToken(nextProjectData)
    if (ignoreNextChangeRef.current) {
      ignoreNextChangeRef.current = false
      lastSavedContentRef.current = nextContent
      return
    }

    if (nextContent === lastSavedContentRef.current) return

    setSaveError('')
    setSaveStatus('pending')
    pendingContentRef.current = nextContent
    window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      saveProjectContent(nextContent)
    }, autosaveDelayMs)
  }, [decodedPublicId, saveProjectContent])

  const handleProjectSave = useCallback((nextProjectData) => {
    if (!nextProjectData) return Promise.resolve()

    const nextContent = stringifyProjectToken(nextProjectData)
    return saveProjectContent(nextContent, { force: true })
  }, [saveProjectContent])

  const handleProjectNameSave = useCallback(async (nextName) => {
    const normalizedName = nextName.trim()
    if (!decodedPublicId || !normalizedName || normalizedName === project?.name) return

    try {
      setSaveError('')
      const nextProject = await updateProject(decodedPublicId, { name: normalizedName })
      setProject(nextProject)
    } catch (err) {
      setSaveError(err.message || 'Could not update project name.')
    }
  }, [decodedPublicId, project?.name])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  useEffect(() => () => window.clearTimeout(saveTimerRef.current), [])

  if (isLoading || (!project && !error)) {
    return <div className="project-detail-empty">Loading project content...</div>
  }

  if (error) {
    return <div className="project-detail-empty">{error}</div>
  }

  return (
    <Editor
      key={decodedPublicId}
      autosaveError={saveError}
      autosaveStatus={saveStatus}
      initialProject={projectData}
      onBack={() => window.history.back()}
      onProjectChange={handleProjectChange}
      onProjectNameSave={handleProjectNameSave}
      onProjectSave={handleProjectSave}
      projectName={project?.name}
    />
  )
}
