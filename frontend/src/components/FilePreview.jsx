import React, { useState, useEffect } from 'react'
import { getPreviewUrl, downloadFile } from '../services/api'
import './FilePreview.css'

function FilePreview({ file, onClose }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [previewType, setPreviewType] = useState(null)

  useEffect(() => {
    if (!file) return

    setLoading(true)
    setError(null)
    
    const mimeType = file.mimeType || ''
    
    // Determine preview type based on MIME type
    if (mimeType.startsWith('image/')) {
      setPreviewType('image')
    } else if (mimeType === 'application/pdf') {
      setPreviewType('pdf')
    } else if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/xml' ||
      mimeType === 'application/javascript'
    ) {
      setPreviewType('text')
    } else {
      setPreviewType('unsupported')
      setLoading(false)
    }
  }, [file])

  const previewUrl = file ? getPreviewUrl(file.id) : null

  const handleImageLoad = () => {
    setLoading(false)
  }

  const handleImageError = () => {
    setLoading(false)
    setError('Failed to load image preview')
  }

  const handleTextLoad = async () => {
    try {
      setLoading(false)
    } catch (err) {
      setError('Failed to load text preview')
      setLoading(false)
    }
  }

  if (!file) return null

  return (
    <div className="file-preview-overlay" onClick={onClose}>
      <div className="file-preview-container" onClick={(e) => e.stopPropagation()}>
        <div className="file-preview-header">
          <div className="file-preview-title">
            <h3>{file.originalFilename}</h3>
            <span className="file-preview-meta">
              {formatFileSize(file.fileSize)} • {file.mimeType || 'Unknown type'}
            </span>
          </div>
          <button className="file-preview-close" onClick={onClose} aria-label="Close preview">
            ✕
          </button>
        </div>

        <div className="file-preview-content">
          {loading && previewType !== 'unsupported' && (
            <div className="file-preview-loading">
              <div className="spinner"></div>
              <p>Loading preview...</p>
            </div>
          )}

          {error && (
            <div className="file-preview-error">
              <p>{error}</p>
            </div>
          )}

          {previewType === 'image' && (
            <div className="file-preview-image-wrapper">
              <img
                src={previewUrl}
                alt={file.originalFilename}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: loading ? 'none' : 'block' }}
              />
            </div>
          )}

          {previewType === 'pdf' && (
            <div className="file-preview-pdf-wrapper">
              <iframe
                src={previewUrl}
                title={file.originalFilename}
                className="file-preview-iframe"
                onLoad={handleTextLoad}
              />
            </div>
          )}

          {previewType === 'text' && (
            <div className="file-preview-text-wrapper">
              <iframe
                src={previewUrl}
                title={file.originalFilename}
                className="file-preview-iframe"
                onLoad={handleTextLoad}
              />
            </div>
          )}

          {previewType === 'unsupported' && (
            <div className="file-preview-unsupported">
              <div className="unsupported-icon">📄</div>
              <p>Preview not available for this file type</p>
              <p className="unsupported-hint">
                Use the download button to view this file
              </p>
            </div>
          )}
        </div>

        <div className="file-preview-footer">
          <button 
            className="file-preview-download-btn" 
            onClick={() => {
              downloadFile(file.id, file.originalFilename)
            }}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default FilePreview

