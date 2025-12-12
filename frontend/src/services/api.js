import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const checkAuth = async () => {
  try {
    const response = await api.get('/auth/user')
    console.log('Auth check response:', response.data)
    return response.data
  } catch (error) {
    console.error('Auth check error:', error.response?.status, error.response?.data || error.message)
    // Return unauthenticated on error
    return { authenticated: false }
  }
}

export const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    console.log('Logout request completed (may have failed if already logged out)')
  }
}

export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const uploadFileWithProgress = async (file, { onProgress, signal } = {}) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
    onUploadProgress: onProgress,
  })

  return response.data
}

export const getFiles = async () => {
  const response = await api.get('/files')
  return response.data
}

export const deleteFile = async (id) => {
  await api.delete(`/files/${id}`)
}

export const downloadFile = async (id, filename) => {
  const response = await api.get(`/files/${id}`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export const getPreviewUrl = (id) => {
  return `${API_BASE_URL}/files/${id}/preview`
}

export const createShareLink = async (fileId, expirationDays = null) => {
  const response = await api.post(`/files/${fileId}/share`, {
    expirationDays,
  })
  return response.data
}

export const revokeShareLink = async (fileId) => {
  await api.delete(`/files/${fileId}/share`)
}

export const getSharedFileInfo = async (token) => {
  const response = await api.get(`/share/${token}/info`)
  return response.data
}

export const downloadSharedFile = async (token, filename) => {
  const response = await api.get(`/share/${token}`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

