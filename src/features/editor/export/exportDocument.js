import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

const exportScale = 2
const projectFileVersion = 1
const projectFileName = 'builder-thinking.btproj'
const projectTokenFileName = 'builder-thinking-token.json'
const projectFileType = 'builder-thinking.project'
const projectEncryptionSecret = 'builder-thinking-project-format-v1'
const componentNameMap = {
  CanvasRoot: 'CanvasRoot',
  Page: 'CanvasRoot',
  Section: 'Section',
  Text: 'TextBlock',
  TextBlock: 'TextBlock',
  Image: 'ImageBlock',
  ImageBlock: 'ImageBlock',
  Shape: 'ShapeBlock',
  ShapeBlock: 'ShapeBlock',
  Icon: 'SvgIconBlock',
  SvgIconBlock: 'SvgIconBlock',
}

function pageFileName(index, extension) {
  return `page-${String(index + 1).padStart(2, '0')}.${extension}`
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function downloadText(text, fileName, type = 'text/plain') {
  downloadBlob(new Blob([text], { type }), fileName)
}

function projectPayload(projectData, options = {}) {
  const payload = {
    schema: projectFileType,
    version: projectFileVersion,
    activePageId: projectData.activePageId,
    pages: projectData.pages,
  }

  if (options.includeExportedAt) {
    payload.exportedAt = new Date().toISOString()
  }

  return payload
}

export function stringifyProjectToken(projectData) {
  return JSON.stringify(projectPayload(projectData))
}

function encodeBase64(bytes) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function decodeBase64(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function projectCryptoKey() {
  const encodedSecret = new TextEncoder().encode(projectEncryptionSecret)
  const secretHash = await crypto.subtle.digest('SHA-256', encodedSecret)
  return crypto.subtle.importKey('raw', secretHash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function encryptProjectPayload(payload) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await projectCryptoKey()
  const encodedPayload = new TextEncoder().encode(JSON.stringify(payload))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedPayload)

  return {
    type: projectFileType,
    version: projectFileVersion,
    algorithm: 'AES-GCM',
    iv: encodeBase64(iv),
    data: encodeBase64(new Uint8Array(encrypted)),
  }
}

async function decryptProjectPayload(filePayload) {
  if (filePayload?.type !== projectFileType || filePayload?.version !== projectFileVersion) {
    throw new Error('Unsupported project file.')
  }

  const key = await projectCryptoKey()
  const iv = decodeBase64(filePayload.iv)
  const encrypted = decodeBase64(filePayload.data)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)

  return JSON.parse(new TextDecoder().decode(decrypted))
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Unable to create export image.'))
      }
    }, 'image/png')
  })
}

function pageElements() {
  return Array.from(document.querySelectorAll('.page-workbench .page-canvas'))
}

async function capturePage(element) {
  return html2canvas(element, {
    backgroundColor: null,
    scale: exportScale,
    useCORS: true,
    allowTaint: true,
    width: element.offsetWidth,
    height: element.offsetHeight,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
  })
}

async function capturePages() {
  const pages = pageElements()
  if (!pages.length) {
    throw new Error('No pages found to export.')
  }

  document.documentElement.classList.add('is-exporting')
  await new Promise((resolve) => requestAnimationFrame(resolve))

  try {
    const canvases = []
    for (const page of pages) {
      canvases.push(await capturePage(page))
    }
    return canvases
  } finally {
    document.documentElement.classList.remove('is-exporting')
  }
}

async function exportPng() {
  const canvases = await capturePages()

  if (canvases.length === 1) {
    downloadBlob(await canvasToBlob(canvases[0]), pageFileName(0, 'png'))
    return
  }

  const zip = new JSZip()
  for (const [index, canvas] of canvases.entries()) {
    zip.file(pageFileName(index, 'png'), await canvasToBlob(canvas))
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, 'pages-png.zip')
}

async function exportPdf() {
  const canvases = await capturePages()
  const firstCanvas = canvases[0]
  const firstPageWidth = firstCanvas.width / exportScale
  const firstPageHeight = firstCanvas.height / exportScale
  const pdf = new jsPDF({
    orientation: firstPageWidth >= firstPageHeight ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [firstPageWidth, firstPageHeight],
    compress: true,
  })

  canvases.forEach((canvas, index) => {
    const pageWidth = canvas.width / exportScale
    const pageHeight = canvas.height / exportScale

    if (index > 0) {
      pdf.addPage([pageWidth, pageHeight], pageWidth >= pageHeight ? 'landscape' : 'portrait')
    }

    pdf.setPage(index + 1)
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight)
  })

  pdf.setDisplayMode('fullwidth', 'continuous', 'UseThumbs')
  pdf.save('pages.pdf')
}

async function exportProject(projectData) {
  if (!projectData?.pages?.length) {
    throw new Error('No project data found to export.')
  }

  const encryptedPayload = await encryptProjectPayload(projectPayload(projectData, { includeExportedAt: true }))
  const blob = new Blob([JSON.stringify(encryptedPayload)], { type: 'application/octet-stream' })
  downloadBlob(blob, projectFileName)
}

function inferNodeComponentName(id, node) {
  const currentName = typeof node?.type === 'string' ? node.type : node?.type?.resolvedName
  if (componentNameMap[currentName]) return componentNameMap[currentName]

  const displayName = node?.displayName || node?.name
  if (componentNameMap[displayName]) return componentNameMap[displayName]

  if (id === 'ROOT') return 'CanvasRoot'
  if (node?.props?.richText || node?.props?.text) return 'TextBlock'
  if (node?.props?.iconName || node?.props?.icon) return 'SvgIconBlock'
  if (node?.props?.shapeType || node?.props?.shape) return 'ShapeBlock'
  if (node?.props?.src || node?.props?.imageUrl) return 'ImageBlock'
  if (node?.isCanvas) return 'Section'

  return 'ShapeBlock'
}

function normalizeSerializedNodeTypes(serialized) {
  const nodes = typeof serialized === 'string' ? JSON.parse(serialized) : serialized
  if (!nodes?.ROOT) {
    return typeof serialized === 'string' ? serialized : JSON.stringify(serialized)
  }

  const normalizedNodes = Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [
      id,
      {
        ...node,
        type: {
          resolvedName: inferNodeComponentName(id, node),
        },
      },
    ]),
  )

  return JSON.stringify(normalizedNodes)
}

function normalizeProjectPages(pages) {
  return pages.map((page, index) => ({
    id: page.id || `page-${index + 1}`,
    name: page.name || `Page ${index + 1}`,
    serialized: page.serialized ? normalizeSerializedNodeTypes(page.serialized) : null,
  }))
}

function normalizeProjectPayload(payload) {
  if (payload?.schema === projectFileType && Array.isArray(payload.pages)) {
    return {
      ...payload,
      pages: normalizeProjectPages(payload.pages),
    }
  }

  if (Array.isArray(payload?.pages)) {
    return normalizeProjectPayload({
      schema: projectFileType,
      version: projectFileVersion,
      activePageId: payload.activePageId || payload.pages[0]?.id || 'page-1',
      pages: payload.pages,
    })
  }

  if (payload?.ROOT) {
    return {
      schema: projectFileType,
      version: projectFileVersion,
      activePageId: 'page-1',
      pages: [
        {
          id: 'page-1',
          name: 'Imported Page',
          serialized: normalizeSerializedNodeTypes(payload),
        },
      ],
    }
  }

  throw new Error('Unsupported project token.')
}

function parseJsonTokenValue(value) {
  let parsed = JSON.parse(value.trim())
  if (typeof parsed === 'string') {
    parsed = JSON.parse(parsed)
  }
  return parsed
}

export async function parseProjectFile(file) {
  const filePayload = JSON.parse(await file.text())
  return normalizeProjectPayload(await decryptProjectPayload(filePayload))
}

export async function parseProjectToken(token) {
  const payload = parseJsonTokenValue(token)
  if (payload?.type === projectFileType) {
    return normalizeProjectPayload(await decryptProjectPayload(payload))
  }
  return normalizeProjectPayload(payload)
}

export async function exportDocument(format, projectData = null) {
  if (format === 'png') {
    await exportPng()
    return
  }

  if (format === 'pdf') {
    await exportPdf()
    return
  }

  if (format === 'project') {
    await exportProject(projectData)
    return
  }

  if (format === 'token') {
    if (!projectData?.pages?.length) {
      throw new Error('No project data found to export.')
    }
    downloadText(JSON.stringify(projectPayload(projectData, { includeExportedAt: true }), null, 2), projectTokenFileName, 'application/json')
    return
  }

  if (format === 'ai-guide') {
    downloadText(String(projectData || ''), 'builder-thinking-ai-guide.md', 'text/markdown')
  }
}
