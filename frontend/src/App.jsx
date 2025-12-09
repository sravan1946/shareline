import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import FileUpload from './components/FileUpload'
import FileList from './components/FileList'
import ShareDialog from './components/ShareDialog'
import PublicFileView from './components/PublicFileView'
import { checkAuth, logout } from './services/api'
import './styles/App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

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

  const handleCloseShareDialog = () => {
    setShowShareDialog(false)
    setSelectedFile(null)
  }

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
              <div className="app-container">
                <header className="app-header">
                  <h1>Shareline</h1>
                  <div className="user-info">
                    <span>{user.name}</span>
                    <button onClick={handleLogout} className="btn-logout">
                      Logout
                    </button>
                  </div>
                </header>
                <main className="app-main">
                  <FileUpload onUploadSuccess={() => window.location.reload()} />
                  <FileList user={user} onShare={handleShare} />
                </main>
                {showShareDialog && selectedFile && (
                  <ShareDialog
                    file={selectedFile}
                    onClose={handleCloseShareDialog}
                  />
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

