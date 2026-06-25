import { mockManagers } from '../mock/managers.mock'

// ID format helpers: Database integer ID <-> Frontend "OX-2XXX" format
const dbIdToFrontendId = (id) => {
  const parsed = parseInt(id, 10)
  if (isNaN(parsed)) return id
  return `OX-${2000 + parsed}`
}

const frontendIdToDbId = (id) => {
  if (typeof id === 'number') return id
  if (typeof id === 'string' && id.startsWith('OX-')) {
    return parseInt(id.replace('OX-', ''), 10) - 2000
  }
  return id
}

// Global API fetch wrapper with JWT authorization header injection
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('oxygen_jwt_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (response.status === 401) {
    localStorage.removeItem('oxygen_jwt_token')
    // Trigger automatic login redirection
    window.location.href = '/login'
    throw new Error('Session expired. Please sign in again.')
  }

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

// Convert a single contract record from database format to UI format
const mapContractToUI = (c) => {
  if (!c) return c
  
  let cats = []
  if (typeof c.equipmentCategories === 'string') {
    cats = c.equipmentCategories.split(',').map(s => s.trim())
  } else if (Array.isArray(c.equipmentCategories)) {
    cats = c.equipmentCategories
  }

  return {
    ...c,
    id: dbIdToFrontendId(c.id),
    equipmentCategories: cats,
    contractValue: parseFloat(c.contractValue || 0),
    priceRevision: parseFloat(c.priceRevision || 0),
    documentName: c.documentName || 'contract_attachment.pdf'
  }
}

// Convert a single contract record from UI format to database payload format
const mapContractToDB = (c) => {
  const body = { ...c }
  if (Array.isArray(body.equipmentCategories)) {
    body.equipmentCategories = body.equipmentCategories.join(', ')
  }
  return body
}

export async function getContracts({ search = '', status = '', category = '', manager = '' } = {}) {
  // Query all contracts up to backend limit constraint
  const res = await apiFetch(`/api/contracts?limit=100&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`)
  let list = (res.data || []).map(mapContractToUI)

  // Filter client-side for parameters not resolved on database SQL query
  if (category && category !== 'All') {
    list = list.filter(c => c.equipmentCategories.includes(category))
  }
  if (manager && manager !== 'All') {
    list = list.filter(c => c.relationshipManager === manager)
  }

  return list
}

export async function getContractById(id) {
  const dbId = frontendIdToDbId(id)
  const res = await apiFetch(`/api/contracts/${dbId}`)
  
  const contract = mapContractToUI(res.data)
  const history = (res.auditHistory || []).map(log => ({
    id: log.id,
    contractRenewalId: dbIdToFrontendId(log.contractRenewalId),
    action: log.action,
    fieldChanged: log.field,
    oldValue: log.oldValue,
    newValue: log.newValue,
    changedBy: log.changedBy,
    createdAt: log.createdAt,
    description: log.description || `${log.action} performed on contract ${dbIdToFrontendId(log.contractRenewalId)}`
  }))

  return { contract, history }
}

export async function createContract(contractData) {
  const dbPayload = mapContractToDB(contractData)
  const res = await apiFetch('/api/contracts', {
    method: 'POST',
    body: JSON.stringify(dbPayload)
  })
  return mapContractToUI(res.data)
}

export async function updateContract(id, contractData) {
  const dbId = frontendIdToDbId(id)
  const dbPayload = mapContractToDB(contractData)
  const res = await apiFetch(`/api/contracts/${dbId}`, {
    method: 'PUT',
    body: JSON.stringify(dbPayload)
  })
  return mapContractToUI(res.data)
}

export async function updateStatus(id, newStatus) {
  const dbId = frontendIdToDbId(id)
  const res = await apiFetch(`/api/contracts/${dbId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus })
  })
  return mapContractToUI(res.data)
}

export async function getDashboardSummary() {
  const [summary, activitiesRes] = await Promise.all([
    apiFetch('/api/dashboard/summary'),
    apiFetch('/api/dashboard/activities')
  ])

  const statusMap = summary.statusCounts || {}
  const totalActive = (statusMap['Active'] || 0) + (statusMap['Renewed'] || 0)
  const expiringSoon = statusMap['Expiring Soon'] || 0
  const overdue = statusMap['Expired'] || 0

  // Fetch all to compute average revision across the current database contracts
  const contracts = await getContracts()
  const avgRevision = contracts.length > 0
    ? contracts.reduce((sum, c) => sum + (c.priceRevision || 0), 0) / contracts.length
    : 0

  const activities = (activitiesRes.activities || []).slice(0, 5).map(log => ({
    id: log.id,
    contractRenewalId: dbIdToFrontendId(log.contractRenewalId),
    action: log.action,
    fieldChanged: log.fieldChanged,
    oldValue: log.oldValue,
    newValue: log.newValue,
    changedBy: log.changedBy,
    createdAt: log.createdAt,
    description: log.description || `${log.action} performed on contract ${dbIdToFrontendId(log.contractRenewalId)}`,
    academyName: log.academyName || 'Unknown Academy'
  }))

  return {
    totalActive,
    expiringSoon,
    overdue,
    avgPriceRevision: avgRevision.toFixed(1),
    totalContractValue: summary.totalValue,
    recentActivities: activities
  }
}

export async function getReportsSummary() {
  const [summary, expiringRes] = await Promise.all([
    apiFetch('/api/reports/summary'),
    apiFetch('/api/reports/expiring')
  ])

  // 1. categoriesData
  const categoriesData = (summary.categoryBreakdown || []).map(cat => ({
    name: cat.category,
    value: cat.count
  }))

  // 2. statusCounts
  const statusCounts = {
    'Active': 0,
    'In Review': 0,
    'Draft': 0,
    'Expiring Soon': 0,
    'Overdue': 0,
    'Renewed': 0
  }
  ;(summary.statusDistribution || []).forEach(row => {
    if (statusCounts[row.status] !== undefined) {
      statusCounts[row.status] = row.count
    }
  })

  // 3. donutData
  const donutData = [
    { name: 'Active', value: (statusCounts['Active'] || 0) + (statusCounts['Renewed'] || 0) },
    { name: 'In Review', value: statusCounts['In Review'] || 0 },
    { name: 'Draft', value: (statusCounts['Draft'] || 0) + (statusCounts['Expiring Soon'] || 0) + (statusCounts['Overdue'] || 0) }
  ]

  // 4. trendsData (next 6 months price revision projection)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonthIdx = new Date().getMonth()
  const trendsData = []
  
  for (let i = 0; i < 6; i++) {
    const idx = (currentMonthIdx - 3 + i + 12) % 12
    const name = months[idx]
    
    const dbMonth = (summary.monthlyTrends || []).find(t => {
      if (!t.month) return false
      const m = parseInt(t.month.split('-')[1], 10)
      return m === (idx + 1)
    })
    
    const baseVal = dbMonth ? dbMonth.totalValue : 450000 + i * 25000
    const forecastVal = baseVal * 1.055 // apply 5.5% revision forecast

    trendsData.push({
      month: name,
      current: i <= 2 ? baseVal : null,
      forecast: Math.round(forecastVal)
    })
  }

  // 5. upcomingRenewals
  const allContracts = await getContracts()
  const today = new Date()
  const sixtyDaysLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
  const upcomingRenewals = allContracts
    .filter(c => {
      if (!c.renewalDate) return false
      const rDate = new Date(c.renewalDate)
      return rDate >= today && rDate <= sixtyDaysLater
    })
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))

  return {
    categoriesData,
    donutData,
    trendsData,
    upcomingRenewals,
    statusCounts
  }
}
