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

  const formatFileSize = (bytes) => {
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
    <div className="file-list-container">
      <div className="file-list-top">
        <div>
          <p className="eyebrow">Your files</p>
          <h2>Manage and share</h2>
        </div>
        <div className="top-actions">
          <button className="ghost-button" onClick={onRefresh || loadFiles}>
            Refresh
          </button>
        </div>
      </div>

      <div className="file-stats">
        <div className="stat-chip">
          <span className="stat-chip-label">Files</span>
          <strong>{stats.count}</strong>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Storage</span>
          <strong>{stats.sizeLabel}</strong>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-label">Shared</span>
          <strong>{stats.shared}</strong>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search filename..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="file-list">
        {filteredFiles.map((file) => (
          <div key={file.id} className="file-item">
            <div className="file-info">
              <div className="file-name">{file.originalFilename}</div>
              <div className="file-meta">
                <span>{formatFileSize(file.fileSize)}</span>
                <span>•</span>
                <span>{formatDate(file.createdAt)}</span>
                {file.shareable && (
                  <>
                    <span>•</span>
                    <span className="shared-badge">Shared</span>
                  </>
                )}
              </div>
            </div>
            <div className="file-actions">
              <button
                onClick={() => setPreviewFile(file)}
                className="chip-btn ghost"
                title="Preview"
              >
                <span className="icon">👁</span> Preview
              </button>
              <button
                onClick={() => handleDownload(file.id, file.originalFilename)}
                className="chip-btn solid"
                title="Download"
              >
                <span className="icon">⬇</span> Download
              </button>
              <button
                onClick={() => onShare(file)}
                className="chip-btn ghost"
                title="Share"
              >
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

