import React, { useMemo } from 'react'
import './DashboardHome.css'

const formatFileSize = (bytes = 0) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function DashboardHome({ user, files = [], loading, error, onRefresh, onUploadClick }) {
  const stats = useMemo(() => {
    const totalFiles = files.length
    const totalBytes = files.reduce((sum, file) => sum + (file.fileSize || 0), 0)
    const sharedCount = files.filter((file) => file.shareable).length
    const recentFiles = [...files].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    return {
      totalFiles,
      totalBytes,
      sharedCount,
      recentFiles: recentFiles.slice(0, 5),
    }
  }, [files])

  return (
    <div className="dashboard">
      <div className="hero">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2 className="hero-title">{user?.name || 'Shareline user'}</h2>
          <p className="hero-subtitle">Keep your uploads organized and share-ready.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onUploadClick}>
              Upload now
            </button>
            <button className="ghost-button" onClick={onRefresh}>
              Refresh stats
            </button>
          </div>
        </div>
        <div className="hero-badge">
          <span>Storage used</span>
          <strong>{formatFileSize(stats.totalBytes)}</strong>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total files</span>
          <div className="stat-value">{stats.totalFiles}</div>
          <p className="stat-helper">Uploaded to your vault</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Storage used</span>
          <div className="stat-value">{formatFileSize(stats.totalBytes)}</div>
          <p className="stat-helper">Across all uploads</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Shared links</span>
          <div className="stat-value">{stats.sharedCount}</div>
          <p className="stat-helper">Currently shareable files</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Recent files</p>
            <h2>Latest uploads</h2>
          </div>
          <div className="panel-actions">
            <button className="ghost-button" onClick={onRefresh}>
              Refresh
            </button>
            <button className="primary-button" onClick={onUploadClick}>
              New upload
            </button>
          </div>
        </div>

        {loading ? (
          <div className="panel-placeholder">
            <div className="spinner"></div>
            <p>Loading your files...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : stats.recentFiles.length === 0 ? (
          <div className="panel-placeholder">
            <p>No uploads yet. Start by adding your first file.</p>
          </div>
        ) : (
          <div className="recent-list">
            {stats.recentFiles.map((file) => (
              <div key={file.id} className="recent-item">
                <div className="recent-meta">
                  <div className="recent-name">{file.originalFilename}</div>
                  <div className="recent-sub">
                    {formatFileSize(file.fileSize)} • {formatDate(file.createdAt)}
                  </div>
                </div>
                {file.shareable && <span className="shared-pill">Shared</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardHome
