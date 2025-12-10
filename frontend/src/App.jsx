import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom'
import Login from './components/Login'
import FileUpload from './components/FileUpload'
import FileList from './components/FileList'
import ShareDialog from './components/ShareDialog'
import PublicFileView from './components/PublicFileView'
import DashboardHome from './components/DashboardHome'
import { checkAuth, logout, getFiles } from './services/api'
import './styles/App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(true)
  const [filesError, setFilesError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const checkAuthentication = async () => {
    try {
      console.log('Checking authentication...')
      const data = await checkAuth()
      console.log('Authentication result:', JSON.stringify(data, null, 2))
      
      // Check if authenticated flag is true
      if (data && data.authenticated === true) {
        console.log('User authenticated:', data)
        setUser(data)
        setLoading(false)
        return true
      } else {
        console.log('User not authenticated. Response:', data)
        setUser(null)
        setLoading(false)
        return false
      }
    } catch (error) {
      console.error('Authentication check failed:', error)
      console.error('Error details:', error.response?.data || error.message)
      setUser(null)
      setLoading(false)
      return false
    }
  }

  const loadFiles = async () => {
    if (!user) return
    try {
      setFilesLoading(true)
      const data = await getFiles()
      setFiles(data)
      setFilesError(null)
    } catch (err) {
      console.error('Failed to load files', err)
      setFilesError('Failed to load files')
    } finally {
      setFilesLoading(false)
    }
  }

  useEffect(() => {
    // Check if we're coming from OAuth success redirect
    const urlParams = new URLSearchParams(window.location.search)
    const isOAuthSuccess = urlParams.has('oauth_success')
    
    console.log('App mounted, isOAuthSuccess:', isOAuthSuccess)
    
    // Clean up the URL parameter
    if (isOAuthSuccess) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Initial auth check with retry for OAuth callback
    const performAuthCheck = async (retryCount = 0) => {
      console.log(`Performing auth check, attempt ${retryCount + 1}`)
      const authenticated = await checkAuthentication()
      
      // If we just came from OAuth and still not authenticated, retry a few times
      // This handles the case where session cookies are being set asynchronously
      if (isOAuthSuccess && !authenticated && retryCount < 5) {
        console.log(`Auth failed, retrying in ${500 * (retryCount + 1)}ms...`)
        setTimeout(() => {
          performAuthCheck(retryCount + 1)
        }, 500 * (retryCount + 1)) // Exponential backoff: 500ms, 1000ms, 1500ms, 2000ms, 2500ms
      } else if (authenticated) {
        console.log('Authentication successful!')
      } else {
        console.log('Authentication failed after all retries')
      }
    }
    
    // Small delay before first check to ensure OAuth redirect is complete
    const initialDelay = isOAuthSuccess ? 500 : 0
    setTimeout(() => {
      performAuthCheck()
    }, initialDelay)
    
    // Also check when window gains focus (useful after OAuth redirect)
    const handleFocus = () => {
      if (!user && !loading) {
        console.log('Window focused, re-checking auth')
        checkAuthentication()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, []) // Empty deps - only run on mount

  useEffect(() => {
    if (user) {
      loadFiles()
    }
  }, [user])

  const handleLogout = () => {
    logout()
      .then(() => {
        setUser(null)
        // Use replace to avoid adding to history and preserve protocol
        window.location.replace(window.location.origin + '/')
      })
      .catch((error) => {
        console.error('Logout error:', error)
        // Even if logout fails, clear local state and redirect
        setUser(null)
        window.location.replace(window.location.origin + '/')
      })
  }

  const handleShare = (file) => {
    setSelectedFile(file)
    setShowShareDialog(true)
  }

  const handleUploadSuccess = () => {
    loadFiles()
    navigate('/files')
  }

  const handleCloseShareDialog = () => {
    setShowShareDialog(false)
    setSelectedFile(null)
  }

  const sidebarLinks = [
    { to: '/home', label: 'Home' },
    { to: '/uploads', label: 'Uploads' },
    { to: '/files', label: 'Files' },
  ]

  const currentPath = location.pathname

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/share/:token" element={<PublicFileView />} />
        <Route
          path="/*"
          element={
            user ? (
              <div className="app-shell">
                <aside className="sidebar">
                  <div className="brand">
                    <span className="brand-dot" /> Shareline
                  </div>
                  <nav className="nav">
                    {sidebarLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                          `nav-link ${isActive ? 'active' : ''}`
                        }
                      >
                        {link.label}
                      </NavLink>
                    ))}
                  </nav>
                  <div className="sidebar-footer">
                    <div className="user-chip">
                      <div className="avatar">{user?.name?.[0] || 'U'}</div>
                      <div className="user-chip-meta">
                        <div className="user-name">{user?.name}</div>
                        <button className="text-button" onClick={handleLogout}>
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </aside>
                <div className="main-area">
                  <header className="topbar">
                    <div>
                      <p className="eyebrow">Shareline</p>
                      <h1 className="page-title">
                        {currentPath.includes('uploads')
                          ? 'Uploads'
                          : currentPath.includes('files')
                          ? 'Files'
                          : 'Home'}
                      </h1>
                    </div>
                    <button className="primary-button" onClick={() => navigate('/uploads')}>
                      New Upload
                    </button>
                  </header>
                  <div className="page-content">
                    <Routes>
                      <Route
                        path="/home"
                        element={
                          <DashboardHome
                            user={user}
                            files={files}
                            loading={filesLoading}
                            error={filesError}
                            onRefresh={loadFiles}
                            onUploadClick={() => navigate('/uploads')}
                          />
                        }
                      />
                      <Route
                        path="/uploads"
                        element={
                          <div className="panel">
                            <div className="panel-header">
                              <div>
                                <p className="eyebrow">Upload</p>
                                <h2>Drop files to share</h2>
                              </div>
                              <button className="ghost-button" onClick={loadFiles}>
                                Refresh
                              </button>
                            </div>
                            <FileUpload onUploadSuccess={handleUploadSuccess} />
                          </div>
                        }
                      />
                      <Route
                        path="/files"
                        element={
                          <FileList
                            user={user}
                            files={files}
                            loading={filesLoading}
                            error={filesError}
                            onShare={handleShare}
                            onRefresh={loadFiles}
                          />
                        }
                      />
                      <Route path="*" element={<Navigate to="/home" replace />} />
                    </Routes>
                  </div>
                </div>
                {showShareDialog && selectedFile && (
                  <ShareDialog file={selectedFile} onClose={handleCloseShareDialog} />
                )}
              </div>
            ) : (
              <Login />
            )
          }
        />
      </Routes>
    </div>
  )
}

export default App

