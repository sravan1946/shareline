import React, { useState } from 'react'
import { uploadFile } from '../services/api'
import './FileUpload.css'

function FileUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [lastFile, setLastFile] = useState(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file) => {
    setError(null)
    setSuccess(null)
    setLastFile(file)
    setUploading(true)

    try {
      await uploadFile(file)
      setSuccess(`Uploaded "${file.name}"`)
      if (onUploadSuccess) {
        setTimeout(() => {
          onUploadSuccess()
        }, 400)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const tips = [
    'Drag and drop any file type',
    'Share instantly after upload',
    'Links can be revoked anytime',
    'Up to 100MB per file',
  ]

  return (
    <div className="upload-layout">
      <div
        className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="file-input"
          onChange={handleChange}
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="file-label">
          <div className="upload-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="upload-copy">
            <p className="upload-title">
              {uploading ? 'Uploading...' : 'Drop files here or browse'}
            </p>
            <p className="file-hint">Max 100MB • Keeps original filenames</p>
          </div>
          <span className="browse-chip">Browse</span>
        </label>

        {uploading && (
          <div className="upload-progress">
            <div className="spinner-small"></div>
            <span>Uploading...</span>
          </div>
        )}

        {lastFile && !uploading && (
          <div className="last-file">
            <div className="last-file-name">{lastFile.name}</div>
            <div className="last-file-sub">Ready to share</div>
          </div>
        )}
      </div>

      <div className="upload-side">
        <p className="eyebrow">Upload tips</p>
        <ul className="tips-list">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <div className="upload-hint-card">
          <p className="hint-title">Need multiple files?</p>
          <p className="hint-body">Zip them first for a single upload and share link.</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>
    </div>
  )
}

export default FileUpload

