const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD 
  ? 'http://localhost:5000/api' 
  : '/api')


function getToken() {
  return localStorage.getItem('token')
}

async function request(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config)

  // Handle blob responses (CSV export)
  const contentType = response.headers.get('content-type')
  if (contentType && (contentType.includes('text/csv') || contentType.includes('application/octet-stream'))) {
    if (!response.ok) {
      throw new Error('Export failed')
    }
    return response.blob()
  }

  const data = await response.json()

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    const error = new Error(data.message || data.error || 'Request failed')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),

  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),

  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),

  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),

  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
}

export default api
