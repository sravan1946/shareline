import React, { useCallback, useEffect, useRef, useState } from 'react'
import { uploadFileWithProgress } from '../services/api'
import './FileUpload.css'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_QUEUE = 10

function FileUpload({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false)
  const [queue, setQueue] = useState([])
  const [message, setMessage] = useState(null)
  const queueRef = useRef([])
  const processingRef = useRef(false)

  const setQueueSafe = (updater) => {
    setQueue((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      queueRef.current = next
      return next
    })
  }

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

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
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      enqueueFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length) {
      enqueueFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const enqueueFiles = (files) => {
    setMessage(null)
    const allowedCount = Math.max(0, MAX_QUEUE - queueRef.current.length)
    if (files.length > allowedCount) {
      setMessage(`Queue limit is ${MAX_QUEUE} files. Added the first ${allowedCount}.`)
    }
    const incoming = files.slice(0, allowedCount)
    const tooLarge = incoming.filter((f) => f.size > MAX_FILE_SIZE)
    if (tooLarge.length) {
      setMessage(`Some files exceed ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB and were skipped.`)
    }
    const valid = incoming.filter((f) => f.size <= MAX_FILE_SIZE)
    if (!valid.length) return

    const newItems = valid.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      status: 'queued',
      progress: 0,
      error: null,
      controller: null,
    }))

    setQueueSafe((prev) => [...prev, ...newItems])
  }

  const uploadOne = useCallback(
    async (itemId) => {
      const item = queueRef.current.find((i) => i.id === itemId)
      if (!item) return

      const controller = new AbortController()
      setQueueSafe((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, status: 'uploading', progress: 0, error: null, controller } : i,
        ),
      )

      try {
        await uploadFileWithProgress(item.file, {
          signal: controller.signal,
          onProgress: ({ loaded, total }) => {
            const percent = total ? Math.round((loaded / total) * 100) : 0
            setQueueSafe((prev) =>
              prev.map((i) => (i.id === itemId ? { ...i, progress: percent } : i)),
            )
          },
        })

        setQueueSafe((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, status: 'done', progress: 100, controller: null } : i)),
        )
        onUploadSuccess?.()
      } catch (err) {
        if (controller.signal.aborted) {
          setQueueSafe((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, status: 'canceled', controller: null } : i)),
          )
        } else {
          const message = err.response?.data?.message || err.message || 'Upload failed'
          setQueueSafe((prev) =>
            prev.map((i) =>
              i.id === itemId ? { ...i, status: 'error', error: message, controller: null } : i,
            ),
          )
        }
      }
    },
    [onUploadSuccess],
  )

  const runQueue = useCallback(async () => {
    if (processingRef.current) return
    processingRef.current = true
    try {
      while (true) {
        const next = queueRef.current.find((i) => i.status === 'queued')
        if (!next) break
        await uploadOne(next.id)
      }
    } finally {
      processingRef.current = false
    }
  }, [uploadOne])

  useEffect(() => {
    if (queueRef.current.some((i) => i.status === 'queued')) {
      runQueue()
    }
  }, [queue, runQueue])

  const handleCancel = (id) => {
    const item = queueRef.current.find((i) => i.id === id)
    if (item?.controller) {
      item.controller.abort()
    }
  }

  const handleRetry = (id) => {
    setQueueSafe((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'queued', error: null } : i)))
    runQueue()
  }

  const clearFinished = () => {
    setQueueSafe((prev) => prev.filter((i) => i.status === 'uploading' || i.status === 'queued'))
  }

  const tips = [
    'Drag in multiple files at once',
    'Progress shown per file',
    'Retry or cancel any upload',
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
          multiple
          onChange={handleChange}
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
            <p className="upload-title">Drop files here or browse</p>
            <p className="file-hint">Multiple files • {Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB limit each</p>
          </div>
          <span className="browse-chip">Browse</span>
        </label>

        {message && <div className="upload-note">{message}</div>}
      </div>

      <div className="upload-side">
        <div className="upload-side-header">
          <p className="eyebrow">Upload queue</p>
          <button className="ghost-button" onClick={clearFinished}>
            Clear done
          </button>
        </div>

        {queue.length === 0 && <p className="muted">No files queued yet.</p>}

        <div className="queue-list">
          {queue.map((item) => (
            <div key={item.id} className="queue-item">
              <div className="queue-main">
                <div className="queue-name">{item.file.name}</div>
                <div className="queue-sub">
                  {Math.round(item.file.size / 1024)} KB · {item.status}
                  {item.error && ` • ${item.error}`}
                </div>
              </div>
              <div className="queue-actions">
                {item.status === 'uploading' && (
                  <button className="chip-btn ghost small" onClick={() => handleCancel(item.id)}>
                    Cancel
                  </button>
                )}
                {item.status === 'error' && (
                  <button className="chip-btn solid small" onClick={() => handleRetry(item.id)}>
                    Retry
                  </button>
                )}
              </div>
              <div className="queue-progress">
                <div className="progress-bar">
                  <div
                    className={`progress-fill status-${item.status}`}
                    style={{ width: `${item.progress || (item.status === 'done' ? 100 : 0)}%` }}
                  ></div>
                </div>
                <span className="progress-label">
                  {item.status === 'uploading'
                    ? `${item.progress || 0}%`
                    : item.status === 'done'
                      ? 'Done'
                      : item.status === 'error'
                        ? 'Failed'
                        : item.status === 'canceled'
                          ? 'Canceled'
                          : 'Queued'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="eyebrow">Tips</p>
        <ul className="tips-list">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default FileUpload

