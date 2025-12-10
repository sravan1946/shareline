import React, { useState, useEffect } from 'react'
import { createShareLink, revokeShareLink } from '../services/api'
import './ShareDialog.css'

function ShareDialog({ file, onClose }) {
  const [shareUrl, setShareUrl] = useState(null)
  const [expirationDays, setExpirationDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (file.shareToken) {
      setShareUrl(`${window.location.origin}/share/${file.shareToken}`)
    }
  }, [file])

  const handleCreateShare = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await createShareLink(file.id, expirationDays || null)
      setShareUrl(data.shareUrl)
    } catch (err) {
      setError('Failed to create share link')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeShare = async () => {
    if (window.confirm('Are you sure you want to revoke this share link?')) {
      setLoading(true)
      setError(null)
      try {
        await revokeShareLink(file.id)
        setShareUrl(null)
      } catch (err) {
        setError('Failed to revoke share link')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
    }
  }

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h3>Share File</h3>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="share-dialog-content">
          <div className="file-name-share">{file.originalFilename}</div>
          
          {shareUrl ? (
            <div className="share-url-section">
              <label>Share Link:</label>
              <div className="share-url-input-group">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="share-url-input"
                />
                <button onClick={handleCopy} className="btn-copy">
                  Copy
                </button>
              </div>
              {file.shareExpiresAt && (
                <p className="share-expiry">
                  Expires: {new Date(file.shareExpiresAt).toLocaleString()}
                </p>
              )}
              <button
                onClick={handleRevokeShare}
                className="btn-revoke"
                disabled={loading}
              >
                Revoke Share Link
              </button>
            </div>
          ) : (
            <div className="share-create-section">
              <label>Expiration (days, optional):</label>
              <input
                type="number"
                min="1"
                value={expirationDays}
                onChange={(e) => setExpirationDays(parseInt(e.target.value) || '')}
                className="expiration-input"
                placeholder="Leave empty for no expiration"
              />
              {error && <div className="error-message">{error}</div>}
              <button
                onClick={handleCreateShare}
                className="btn-create-share"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Share Link'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShareDialog

