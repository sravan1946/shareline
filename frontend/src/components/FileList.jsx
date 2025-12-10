import React, { useState, useEffect } from 'react'
import { getFiles, deleteFile, downloadFile } from '../services/api'
import './FileList.css'

function FileList({ user, onShare, files: externalFiles, loading: externalLoading, error: externalError, onRefresh }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const selfManaged = externalFiles === undefined

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
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(id)
        if (selfManaged) {
          loadFiles()
        } else if (onRefresh) {
          onRefresh()
        }
      } catch (err) {
        alert('Failed to delete file')
      }
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
      <h2>Your Files</h2>
      <div className="file-list">
        {displayFiles.map((file) => (
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
                onClick={() => handleDownload(file.id, file.originalFilename)}
                className="btn-download"
                title="Download"
              >
                ⬇
              </button>
              <button
                onClick={() => onShare(file)}
                className="btn-share"
                title="Share"
              >
                🔗
              </button>
              <button
                onClick={() => handleDelete(file.id)}
                className="btn-delete"
                title="Delete"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FileList

