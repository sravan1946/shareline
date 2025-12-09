import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getSharedFileInfo, downloadSharedFile } from '../services/api'
import './PublicFileView.css'

function PublicFileView() {
  const { token } = useParams()
  const [fileInfo, setFileInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadFileInfo()
  }, [token])

  const loadFileInfo = async () => {
    try {
      setLoading(true)
      const info = await getSharedFileInfo(token)
      setFileInfo(info)
      setError(null)
    } catch (err) {
      setError('Share link not found or expired')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      await downloadSharedFile(token, fileInfo.originalFilename)
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

  if (loading) {
    return (
      <div className="public-file-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (error || !fileInfo) {
    return (
      <div className="public-file-error">
        <h2>File Not Available</h2>
        <p>{error || 'The share link is invalid or has expired.'}</p>
      </div>
    )
  }

  return (
    <div className="public-file-container">
      <div className="public-file-card">
        <h1>Shared File</h1>
        <div className="file-details">
          <div className="file-name-large">{fileInfo.originalFilename}</div>
          <div className="file-meta-large">
            <span>Size: {formatFileSize(fileInfo.fileSize)}</span>
            {fileInfo.mimeType && <span>Type: {fileInfo.mimeType}</span>}
            <span>Uploaded: {new Date(fileInfo.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <button onClick={handleDownload} className="btn-download-large">
          Download File
        </button>
      </div>
    </div>
  )
}

export default PublicFileView

