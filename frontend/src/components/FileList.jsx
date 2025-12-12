import React, { useMemo, useState, useEffect } from 'react'
import { getFiles, deleteFile, downloadFile } from '../services/api'
import FilePreview from './FilePreview'
import './FileList.css'

function FileList({ user, onShare, files: externalFiles, loading: externalLoading, error: externalError, onRefresh }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const selfManaged = externalFiles === undefined
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  useEffect(() => {
    if (selfManaged) {
      loadFiles()
    }
  }, [selfManaged])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const data = await getFiles()
      setFiles(data)
      setError(null)
    } catch (err) {
      setError('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (pendingDelete !== id) {
      setPendingDelete(id)
      return
    }
    try {
      await deleteFile(id)
      setPendingDelete(null)
      if (selfManaged) {
        loadFiles()
      } else if (onRefresh) {
        onRefresh()
      }
    } catch (err) {
      setError('Failed to delete file')
      setPendingDelete(null)
    }
  }

  const handleDownload = async (id, filename) => {
    try {
      await downloadFile(id, filename)
    } catch (err) {
      alert('Failed to download file')
    }
  }

  const formatFileSize = (bytes = 0) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getExtension = (name = '') => {
    const lastDot = name.lastIndexOf('.')
    if (lastDot === -1) return ''
    return name.slice(lastDot + 1).toUpperCase()
  }

  const getTypeLabel = (file) => {
    const mt = file.mimeType || ''
    if (!mt) return 'Unknown type'
    if (mt.startsWith('image/')) return 'Image'
    if (mt.startsWith('video/')) return 'Video'
    if (mt.startsWith('audio/')) return 'Audio'
    if (mt === 'application/pdf') return 'PDF'
    if (mt.startsWith('text/')) return 'Text'
    if (mt.includes('zip') || mt.includes('compressed')) return 'Archive'
    if (mt.includes('json')) return 'JSON'
    return mt
  }

  const displayFiles = selfManaged ? files : externalFiles || []
  const displayLoading = selfManaged ? loading : externalLoading
  const displayError = selfManaged ? error : externalError

  const filteredFiles = useMemo(() => {
    if (!query.trim()) return displayFiles
    const lower = query.toLowerCase()
    return displayFiles.filter((f) => f.originalFilename?.toLowerCase().includes(lower))
  }, [displayFiles, query])

  const stats = useMemo(() => {
    const totalSize = displayFiles.reduce((sum, f) => sum + (f.fileSize || 0), 0)
    const shared = displayFiles.filter((f) => f.shareable).length
    return {
      count: displayFiles.length,
      sizeLabel: formatFileSize(totalSize),
      shared,
    }
  }, [displayFiles])

  if (displayLoading) {
    return (
      <div className="file-list-loading">
        <div className="spinner"></div>
        <p>Loading files...</p>
      </div>
    )
  }

  if (displayError) {
    return <div className="error-message">{displayError}</div>
  }

  if (displayFiles.length === 0) {
    return (
      <div className="file-list-empty">
        <p>No files uploaded yet. Upload your first file to get started.</p>
      </div>
    )
  }

  return (
    <div className="file-shell">
      <div className="file-header">
        <div className="file-header-text">
          <p className="eyebrow">Library</p>
          <h2>Your uploads</h2>
          <p className="subdued">Browse, preview, and share everything in one place.</p>
        </div>
        <div className="file-header-actions">
          <button className="ghost-button" onClick={onRefresh || loadFiles}>
            Refresh
          </button>
        </div>
      </div>

      <div className="file-controls">
        <div className="control search">
          <div className="control-label">Search</div>
          <input
            type="text"
            placeholder="Find by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="control stats">
          <div className="stat-card">
            <span className="stat-label">Files</span>
            <strong>{stats.count}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Storage</span>
            <strong>{stats.sizeLabel}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Shared</span>
            <strong>{stats.shared}</strong>
          </div>
        </div>
      </div>

      <div className="file-grid">
        {filteredFiles.map((file) => (
          <div key={file.id} className="file-card">
            <div className="file-card-head">
              <div className="file-avatar">{getExtension(file.originalFilename) || 'FILE'}</div>
              <div className="file-card-title">
                <div className="file-name">{file.originalFilename}</div>
                <div className="file-badges">
                  <span className="badge">{getTypeLabel(file)}</span>
                  {file.shareable && <span className="badge accent">Shared</span>}
                </div>
              </div>
            </div>

            <div className="file-card-meta">
              <div>
                <span className="meta-label">Size</span>
                <span className="meta-value">{formatFileSize(file.fileSize)}</span>
              </div>
              <div>
                <span className="meta-label">Added</span>
                <span className="meta-value">{formatDate(file.createdAt)}</span>
              </div>
              <div>
                <span className="meta-label">MIME</span>
                <span className="meta-value mono">{file.mimeType || 'Unknown'}</span>
              </div>
            </div>

            <div className="file-card-actions">
              <button className="chip-btn ghost" onClick={() => setPreviewFile(file)}>
                <span className="icon">👁</span> Preview
              </button>
              <button className="chip-btn solid" onClick={() => handleDownload(file.id, file.originalFilename)}>
                <span className="icon">⬇</span> Download
              </button>
              <button className="chip-btn ghost" onClick={() => onShare(file)}>
                <span className="icon">🔗</span> Share
              </button>
              <div className="delete-wrap">
                <button
                  onClick={() => handleDelete(file.id)}
                  className={`chip-btn danger ${pendingDelete === file.id ? 'confirm' : ''}`}
                  title={pendingDelete === file.id ? 'Click again to confirm' : 'Delete'}
                >
                  <span className="icon">🗑</span>
                  {pendingDelete === file.id ? 'Confirm' : 'Delete'}
                </button>
                {pendingDelete === file.id && (
                  <button className="text-cancel" onClick={() => setPendingDelete(null)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredFiles.length === 0 && (
          <div className="file-list-empty">
            <p>No files match that search.</p>
          </div>
        )}
      </div>

      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  )
}

export default FileList

