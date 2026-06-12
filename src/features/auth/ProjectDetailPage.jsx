import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from '../editor'
import { parseProjectToken, stringifyProjectToken } from '../editor/export/exportDocument'
import { getProjectInit, updateProject, updateProjectNodes, uploadImage } from './api'

const autosaveDelayMs = 5000
const imagePropNames = ['src', 'backgroundImage', 'imageSrc']

function parseProjectContent(content) {
  const token = JSON.parse(content)
  if (!Array.isArray(token?.pages)) {
    throw new Error('Project content pages are missing.')
  }

  return {
    activePageId: token.activePageId,
    pages: token.pages.map((page, index) => ({
      id: page.id || `page-${index + 1}`,
      name: page.name || `Page ${index + 1}`,
      nodes: JSON.parse(page.serialized || '{}'),
    })),
  }
}

function pageChangeRequiresFullSave(previousContent, nextContent) {
  const previousProject = parseProjectContent(previousContent)
  const nextProject = parseProjectContent(nextContent)
  const nextPageById = new Map(nextProject.pages.map((page, index) => [page.id, { page, index }]))

  for (const [index, previousPage] of previousProject.pages.entries()) {
    const nextPage = nextPageById.get(previousPage.id)

    if (!nextPage) {
      return true
    }

    if (nextPage.page.name !== previousPage.name) {
      return true
    }

    if (nextProject.pages[index]?.id !== previousPage.id) {
      return true
    }
  }

  return false
}

function parentNodeId(node) {
  return typeof node?.parent === 'string' ? node.parent : null
}

function nodePosition(node) {
  const props = node?.props || {}
  return typeof props.x === 'number' && typeof props.y === 'number'
    ? { x: props.x, y: props.y }
    : undefined
}

function diffProjectNodes(previousContent, nextContent) {
  const previousProject = parseProjectContent(previousContent)
  const nextProject = parseProjectContent(nextContent)

  const changes = []

  nextProject.pages.forEach((nextPage) => {
    const previousPage = previousProject.pages.find((page) => page.id === nextPage.id)
    const previousNodes = previousPage?.nodes || {}
    const nextNodes = nextPage.nodes || {}
    const previousIds = new Set(Object.keys(previousNodes))
    const nextIds = new Set(Object.keys(nextNodes))

    Object.entries(nextNodes).forEach(([nodeId, nextNode], index) => {
      const previousNode = previousNodes[nodeId]

      if (!previousNode) {
        changes.push({
          type: 'create',
          pageId: nextPage.id,
          nodeId,
          parentNodeId: parentNodeId(nextNode),
          content: nextNode,
          position: nodePosition(nextNode),
          sortOrder: index,
        })
        return
      }

      if (JSON.stringify(previousNode) !== JSON.stringify(nextNode)) {
        changes.push({
          type: 'update',
          pageId: nextPage.id,
          nodeId,
          patch: {
            parentNodeId: parentNodeId(nextNode),
            content: nextNode,
            position: nodePosition(nextNode),
            sortOrder: index,
          },
        })
      }
    })

    previousIds.forEach((nodeId) => {
      if (!nextIds.has(nodeId)) {
        changes.push({
          type: 'delete',
          pageId: nextPage.id,
          nodeId,
        })
      }
    })
  })

  return changes
}

function isLocalImageSource(value) {
  return typeof value === 'string' && (
    value.startsWith('data:image/') ||
    value.startsWith('blob:') ||
    value.startsWith('file:')
  )
}

function extensionFromMimeType(mimeType) {
  const subtype = mimeType.split('/')[1]?.split(';')[0]
  return subtype || 'png'
}

async function localImageSourceToFile(source, fallbackName) {
  const response = await fetch(source)
  const blob = await response.blob()
  const extension = extensionFromMimeType(blob.type || 'image/png')
  return new File([blob], `${fallbackName}.${extension}`, { type: blob.type || 'image/png' })
}

function projectContentToProjectData(projectContent) {
  return {
    schema: 'builder-thinking.project',
    version: 1,
    activePageId: projectContent.activePageId,
    pages: projectContent.pages.map((page) => ({
      id: page.id,
      name: page.name,
      serialized: JSON.stringify(page.nodes),
    })),
  }
}

async function uploadLocalImagesForContent(content, changes = null) {
  const projectContent = parseProjectContent(content)
  const changedNodeKeys = changes
    ? new Set(
      changes
        .filter((change) => change.type === 'create' || change.type === 'update')
        .map((change) => `${change.pageId}:${change.nodeId}`),
    )
    : null
  let uploaded = false

  for (const page of projectContent.pages) {
    for (const [nodeId, node] of Object.entries(page.nodes)) {
      if (changedNodeKeys && !changedNodeKeys.has(`${page.id}:${nodeId}`)) continue

      const props = node?.props
      if (!props || typeof props !== 'object') continue

      for (const propName of imagePropNames) {
        const source = props[propName]
        if (!isLocalImageSource(source)) continue

        const file = await localImageSourceToFile(source, `${page.id}-${nodeId}-${propName}`)
        const image = await uploadImage(file)
        props[propName] = image.url
        uploaded = true
      }
    }
  }

  if (!uploaded) {
    return { content, projectData: null, uploaded: false }
  }

  const projectData = projectContentToProjectData(projectContent)
  return {
    content: stringifyProjectToken(projectData),
    projectData,
    uploaded: true,
  }
}

export function ProjectDetailPage({ publicId }) {
  const [project, setProject] = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle')
  const ignoreNextChangeRef = useRef(false)
  const contentVersionRef = useRef(0)
  const hydratedContentRef = useRef('')
  const hasUnsavedChangesRef = useRef(false)
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
    contentVersionRef.current = 0
    hydratedContentRef.current = ''
    hasUnsavedChangesRef.current = false
    pendingContentRef.current = ''
    window.clearTimeout(saveTimerRef.current)

    try {
      const detail = await getProjectInit(decodedPublicId)
      const initialContent = detail.content?.trim() || ''
      const initialProjectData = initialContent ? await parseProjectToken(initialContent) : null
      const normalizedInitialContent = initialProjectData ? stringifyProjectToken(initialProjectData) : ''

      setProject(detail)
      setProjectData(initialProjectData)
      ignoreNextChangeRef.current = true
      contentVersionRef.current = detail.version ?? 0
      hydratedContentRef.current = normalizedInitialContent
      lastSavedContentRef.current = normalizedInitialContent
      pendingContentRef.current = ''
    } catch (err) {
      setError(err.message || 'Could not load project detail.')
      setProjectData(null)
    } finally {
      setIsLoading(false)
    }
  }, [decodedPublicId])

  const saveProjectContent = useCallback(async (nextContent) => {
    if (!decodedPublicId || !nextContent) return
    const requestedContent = nextContent

    window.clearTimeout(saveTimerRef.current)
    setSaveError('')

    if (
      nextContent === lastSavedContentRef.current ||
      (!hasUnsavedChangesRef.current && nextContent === hydratedContentRef.current)
    ) {
      pendingContentRef.current = ''
      setSaveStatus('saved')
      return
    }

    pendingContentRef.current = nextContent
    setSaveStatus('saving')

    try {
      let contentToSave = nextContent
      let nextProjectData = null
      const shouldUseFullSave = pageChangeRequiresFullSave(lastSavedContentRef.current, contentToSave)

      if (shouldUseFullSave) {
        const uploadedImages = await uploadLocalImagesForContent(contentToSave)
        contentToSave = uploadedImages.content
        nextProjectData = uploadedImages.projectData

        const nextProject = await updateProject(decodedPublicId, { content: contentToSave })
        setProject(nextProject)
        contentVersionRef.current = nextProject.version ?? contentVersionRef.current
        lastSavedContentRef.current = contentToSave
        hydratedContentRef.current = contentToSave
        hasUnsavedChangesRef.current = false
        if (nextProjectData) {
          ignoreNextChangeRef.current = true
          setProjectData(nextProjectData)
        }

        if (pendingContentRef.current === requestedContent || pendingContentRef.current === contentToSave) {
          pendingContentRef.current = ''
          setSaveStatus('saved')
        }
        return
      }

      let changes = diffProjectNodes(lastSavedContentRef.current, contentToSave)

      if (changes.length) {
        const uploadedImages = await uploadLocalImagesForContent(contentToSave, changes)
        contentToSave = uploadedImages.content
        nextProjectData = uploadedImages.projectData
        changes = diffProjectNodes(lastSavedContentRef.current, contentToSave)
      }

      if (changes.length) {
        const result = await updateProjectNodes(decodedPublicId, {
          baseVersion: contentVersionRef.current,
          changes,
        })
        contentVersionRef.current = result.version ?? contentVersionRef.current
        setProject((currentProject) => currentProject
          ? { ...currentProject, version: contentVersionRef.current }
          : currentProject)
      }

      lastSavedContentRef.current = contentToSave
      hydratedContentRef.current = contentToSave
      hasUnsavedChangesRef.current = false
      if (nextProjectData) {
        ignoreNextChangeRef.current = true
        setProjectData(nextProjectData)
      }

      if (pendingContentRef.current === requestedContent || pendingContentRef.current === contentToSave) {
        pendingContentRef.current = ''
        setSaveStatus('saved')
      }
    } catch (err) {
      if (pendingContentRef.current === requestedContent) {
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
      hydratedContentRef.current = nextContent
      lastSavedContentRef.current = nextContent
      hasUnsavedChangesRef.current = false
      return
    }

    if (nextContent === lastSavedContentRef.current) return

    hasUnsavedChangesRef.current = true
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
    return saveProjectContent(nextContent)
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
