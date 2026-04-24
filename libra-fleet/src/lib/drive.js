// Google Drive integration using Google Identity Services (GIS)
// Token client flow — works in mobile browsers (PWA) and Capacitor webviews.
//
// Required env vars:
//   VITE_GOOGLE_CLIENT_ID   OAuth 2.0 Web Client ID (console.cloud.google.com)
//
// Scope: drive.file — app-created files only (minimal, safer).

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'

let tokenClient = null
let accessToken = null
let tokenExpiry = 0

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// In-memory + localStorage persistence of the short-lived token
try {
  const cached = JSON.parse(localStorage.getItem('gdrive_token') || 'null')
  if (cached && cached.expiry > Date.now()) {
    accessToken = cached.token
    tokenExpiry = cached.expiry
  }
} catch {
  // ignore corrupt cache
}

function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve()
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function ensureTokenClient() {
  if (!CLIENT_ID) throw new Error('Falta VITE_GOOGLE_CLIENT_ID en el entorno')
  await loadGis()
  if (tokenClient) return tokenClient
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: () => {},
  })
  return tokenClient
}

export function isSignedIn() {
  return !!accessToken && tokenExpiry > Date.now() + 30_000
}

export async function signIn({ prompt = '' } = {}) {
  const client = await ensureTokenClient()
  return new Promise((resolve, reject) => {
    client.callback = (resp) => {
      if (resp.error) return reject(new Error(resp.error_description || resp.error))
      accessToken = resp.access_token
      const expiresInMs = (resp.expires_in || 3600) * 1000
      tokenExpiry = Date.now() + expiresInMs
      try {
        localStorage.setItem('gdrive_token', JSON.stringify({ token: accessToken, expiry: tokenExpiry }))
      } catch {
        // storage unavailable
      }
      resolve(accessToken)
    }
    client.requestAccessToken({ prompt })
  })
}

export function signOut() {
  if (accessToken && window.google?.accounts?.oauth2) {
    try { window.google.accounts.oauth2.revoke(accessToken, () => {}) } catch {
      // revoke best-effort
    }
  }
  accessToken = null
  tokenExpiry = 0
  try { localStorage.removeItem('gdrive_token') } catch {
    // storage unavailable
  }
}

async function getToken() {
  if (isSignedIn()) return accessToken
  return signIn({ prompt: '' })
}

async function driveFetch(url, options = {}) {
  const token = await getToken()
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  })
  if (res.status === 401) {
    accessToken = null
    const retryToken = await signIn({ prompt: 'consent' })
    const res2 = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${retryToken}`, ...(options.headers || {}) },
    })
    if (!res2.ok) throw new Error(`Drive ${res2.status}: ${await res2.text()}`)
    return res2
  }
  if (!res.ok) throw new Error(`Drive ${res.status}: ${await res.text()}`)
  return res
}

// Find or create a folder by name under an optional parent.
export async function ensureFolder(name, parentId = 'root') {
  const q = [
    `name='${name.replace(/'/g, "\\'")}'`,
    "mimeType='application/vnd.google-apps.folder'",
    `'${parentId}' in parents`,
    'trashed=false',
  ].join(' and ')
  const listUrl = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`
  const list = await driveFetch(listUrl).then(r => r.json())
  if (list.files?.[0]) return list.files[0].id

  const body = { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }
  const created = await driveFetch(`${DRIVE_API}/files?fields=id,name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json())
  return created.id
}

// Multipart upload of a File/Blob. Returns { id, name, webViewLink, mimeType }.
export async function uploadFile(file, { folderId = null, name = null } = {}) {
  const metadata = {
    name: name || file.name || `upload-${Date.now()}`,
    ...(folderId ? { parents: [folderId] } : {}),
  }
  const boundary = '-------libra' + Math.random().toString(36).slice(2)
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelim = `\r\n--${boundary}--`

  const fileBuf = await file.arrayBuffer()
  const head = new TextEncoder().encode(
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`
  )
  const tail = new TextEncoder().encode(closeDelim)
  const body = new Blob([head, fileBuf, tail])

  const url = `${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name,webViewLink,mimeType,size`
  const res = await driveFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  return res.json()
}

export async function listFilesInFolder(folderId) {
  const q = `'${folderId}' in parents and trashed=false`
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink,size,createdTime)&orderBy=createdTime desc&pageSize=100`
  const res = await driveFetch(url)
  const json = await res.json()
  return json.files || []
}

export async function deleteFile(fileId) {
  await driveFetch(`${DRIVE_API}/files/${fileId}`, { method: 'DELETE' })
}

export async function downloadFile(fileId) {
  const res = await driveFetch(`${DRIVE_API}/files/${fileId}?alt=media`)
  return res.blob()
}

export function getWebViewLink(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`
}
