import { initialContracts } from '../mock/contracts.mock'
import { mockManagers } from '../mock/managers.mock'
import { mockAuditLogs } from '../mock/auditLogs.mock'

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

// Helper: Decode JWT payload in frontend
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// ─── Local Storage Mock Store Logic (Fallback Handler) ──────────────────────

const getStorageState = () => {
  let contracts = localStorage.getItem('oxygen_contracts')
  let logs = localStorage.getItem('oxygen_audit_logs')
  let users = localStorage.getItem('oxygen_users')

  const initialUsers = [
    {
      id: 1,
      username: 'admin',
      name: 'Alex Rivers',
      email: 'admin@oxygensports.com',
      role: 'admin',
      title: 'Lead Administrator',
      phone: '+91 99999 99999',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80',
      isActive: 1
    },
    {
      id: 2,
      username: 'sarah.jenkins',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@oxygensports.com',
      role: 'employee',
      title: 'Relationship Manager',
      phone: '+91 88888 88888',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80',
      isActive: 1
    },
    {
      id: 3,
      username: 'marcus.thorne',
      name: 'Marcus Thorne',
      email: 'marcus.thorne@oxygensports.com',
      role: 'employee',
      title: 'Relationship Manager',
      phone: '+91 77777 77777',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80',
      isActive: 1
    }
  ]

  if (!users) {
    localStorage.setItem('oxygen_users', JSON.stringify(initialUsers))
    users = JSON.stringify(initialUsers)
  }

  const parsedUsers = JSON.parse(users);

  if (!contracts) {
    // Adapt initial mock contracts to use user IDs
    const adapted = initialContracts.map((c, i) => {
      const isSarah = i % 2 === 0;
      const manager = isSarah ? parsedUsers[1] : parsedUsers[2];
      return {
        ...c,
        relationshipManagerId: manager.id,
        relationshipManager: manager.name
      }
    });
    localStorage.setItem('oxygen_contracts', JSON.stringify(adapted))
    contracts = JSON.stringify(adapted)
  }

  if (!logs) {
    localStorage.setItem('oxygen_audit_logs', JSON.stringify(mockAuditLogs))
    logs = JSON.stringify(mockAuditLogs)
  }

  return {
    contracts: JSON.parse(contracts),
    logs: JSON.parse(logs),
    users: parsedUsers
  }
}

const saveStorageState = (state) => {
  localStorage.setItem('oxygen_contracts', JSON.stringify(state.contracts))
  localStorage.setItem('oxygen_audit_logs', JSON.stringify(state.logs))
  localStorage.setItem('oxygen_users', JSON.stringify(state.users))
}

const isMockActive = () => {
  const token = localStorage.getItem('oxygen_jwt_token')
  return token === 'mock_token_123' || (token && token.startsWith('mock_'))
}

const getLoggedInMockUser = () => {
  const token = localStorage.getItem('oxygen_jwt_token')
  if (!token) return null
  const { users } = getStorageState()
  if (token === 'mock_token_123' || token === 'mock_token_admin') {
    return users[0] // Admin
  }
  if (token === 'mock_token_sarah') {
    return users[1] // Sarah
  }
  if (token === 'mock_token_marcus') {
    return users[2] // Marcus
  }
  // Try decoding or fallback to admin
  const decoded = decodeJwt(token)
  if (decoded) {
    return users.find(u => u.id === decoded.id) || users[0]
  }
  return users[0]
}

// ─── Global HTTP Fetch Wrapper ──────────────────────────────────────────────

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
    window.location.href = '/login'
    throw new Error('Session expired. Please sign in again.')
  }

  if (response.status === 403) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Access denied. You do not have permissions to perform this action.')
  }

  // Handle non-JSON HTML error fallback
  const contentType = response.headers.get('content-type')
  if (!response.ok || !contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    throw new Error(text.substring(0, 50) || 'Invalid server response')
  }

  return await response.json()
}

// Convert record from database schema to UI schema
const mapContractToUI = (c, usersList = []) => {
  if (!c) return c
  
  let cats = []
  if (typeof c.equipmentCategories === 'string') {
    cats = c.equipmentCategories.split(',').map(s => s.trim())
  } else if (Array.isArray(c.equipmentCategories)) {
    cats = c.equipmentCategories
  }

  let managerName = c.relationshipManager
  if (!managerName && usersList.length > 0 && c.relationshipManagerId) {
    const m = usersList.find(u => u.id === c.relationshipManagerId)
    if (m) managerName = m.name
  }

  return {
    ...c,
    id: dbIdToFrontendId(c.id),
    equipmentCategories: cats,
    contractValue: parseFloat(c.contractValue || 0),
    priceRevision: parseFloat(c.priceRevision || 0),
    relationshipManager: managerName || 'Unassigned',
    documentName: c.documentName || 'contract_attachment.pdf'
  }
}

// Convert record from UI schema to database schema
const mapContractToDB = (c) => {
  const body = { ...c }
  if (Array.isArray(body.equipmentCategories)) {
    body.equipmentCategories = body.equipmentCategories.join(', ')
  }
  // Remove UI-only resolved properties
  delete body.relationshipManager;
  delete body.daysUntilRenewal;
  return body
}

// ─── API Methods ────────────────────────────────────────────────────────────

export async function getContracts({ search = '', status = '', category = '', manager = '' } = {}) {
  if (!isMockActive()) {
    try {
      const res = await apiFetch(`/api/contracts?limit=500&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`)
      let list = (res.data || []).map(c => mapContractToUI(c))

      if (category && category !== 'All') {
        list = list.filter(c => c.equipmentCategories.includes(category))
      }
      if (manager && manager !== 'All') {
        list = list.filter(c => String(c.relationshipManagerId) === String(manager) || c.relationshipManager === manager)
      }
      return list
    } catch (err) {
      console.warn('[API] Server unreachable, loading localStorage mock contracts:', err.message)
    }
  }

  // Local Storage Fallback
  const state = getStorageState()
  const loggedUser = getLoggedInMockUser()
  let filtered = [...state.contracts]

  // Role Scoping (RLS Simulation)
  if (loggedUser && loggedUser.role !== 'admin') {
    filtered = filtered.filter(c => c.relationshipManagerId === loggedUser.id)
  }

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(c => 
      c.academyName.toLowerCase().includes(q) || 
      c.id.toLowerCase().includes(q) ||
      (c.relationshipManager && c.relationshipManager.toLowerCase().includes(q))
    )
  }
  if (status && status !== 'All') {
    filtered = filtered.filter(c => c.status === status)
  }
  if (category && category !== 'All') {
    filtered = filtered.filter(c => c.equipmentCategories.includes(category))
  }
  if (manager && manager !== 'All') {
    filtered = filtered.filter(c => String(c.relationshipManagerId) === String(manager) || c.relationshipManager === manager)
  }

  return filtered.map(c => mapContractToUI(c, state.users))
}

export async function getContractById(id) {
  if (!isMockActive()) {
    try {
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
    } catch (err) {
      console.warn('[API] Server unreachable, loading localStorage mock contract details:', err.message)
    }
  }

  // Local Storage Fallback
  const state = getStorageState()
  const loggedUser = getLoggedInMockUser()
  const contract = state.contracts.find(c => c.id === id)
  if (!contract) throw new Error('Contract not found')

  // Access check
  if (loggedUser && loggedUser.role !== 'admin' && contract.relationshipManagerId !== loggedUser.id) {
    throw new Error('Access denied. You do not manage this contract.')
  }
  
  const history = state.logs.filter(l => l.contractRenewalId === id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
  return { 
    contract: mapContractToUI(contract, state.users), 
    history 
  }
}

export async function createContract(contractData) {
  if (!isMockActive()) {
    try {
      const dbPayload = mapContractToDB(contractData)
      const res = await apiFetch('/api/contracts', {
        method: 'POST',
        body: JSON.stringify(dbPayload)
      })
      return mapContractToUI(res.data)
    } catch (err) {
      console.warn('[API] Server unreachable, creating contract inside localStorage:', err.message)
    }
  }

  // Local Storage Fallback
  const state = getStorageState()
  const loggedUser = getLoggedInMockUser()
  const nextNum = 2000 + state.contracts.length + 1
  const id = `OX-${nextNum}`

  let targetId = contractData.relationshipManagerId;
  if (loggedUser.role !== 'admin') {
    targetId = loggedUser.id;
  } else {
    // Admin check validation
    const m = state.users.find(u => u.id === parseInt(targetId));
    if (!m) throw new Error('Selected manager does not exist');
    if (m.isActive === 0) throw new Error('Cannot assign to a deactivated employee');
  }

  const manager = state.users.find(u => u.id === parseInt(targetId))
  
  const newContract = {
    id,
    ...contractData,
    relationshipManagerId: parseInt(targetId),
    relationshipManager: manager ? manager.name : 'Unknown',
    priceRevision: parseFloat(contractData.priceRevision || 0),
    contractValue: parseFloat(contractData.contractValue || 0),
    documentName: contractData.documentName || 'contract_attachment.pdf',
  }
  state.contracts.unshift(newContract)

  const log = {
    id: `a-${Date.now()}`,
    contractRenewalId: id,
    action: 'CREATE',
    fieldChanged: 'contract',
    oldValue: 'None',
    newValue: 'Created',
    changedBy: loggedUser.username || 'System',
    createdAt: new Date().toISOString(),
    description: `Contract ${id} registered for ${contractData.academyName}`
  }
  state.logs.unshift(log)
  
  saveStorageState(state)
  return newContract
}

export async function updateContract(id, contractData) {
  if (!isMockActive()) {
    try {
      const dbId = frontendIdToDbId(id)
      const dbPayload = mapContractToDB(contractData)
      const res = await apiFetch(`/api/contracts/${dbId}`, {
        method: 'PUT',
        body: JSON.stringify(dbPayload)
      })
      return mapContractToUI(res.data)
    } catch (err) {
      console.warn('[API] Server unreachable, updating contract inside localStorage:', err.message)
    }
  }

  // Local Storage Fallback
  const state = getStorageState()
  const loggedUser = getLoggedInMockUser()
  const idx = state.contracts.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Contract not found')
  
  const oldContract = state.contracts[idx]

  // Scoping Check
  if (loggedUser.role !== 'admin' && oldContract.relationshipManagerId !== loggedUser.id) {
    throw new Error('Access denied. You do not manage this contract.')
  }

  let updatedManagerId = contractData.relationshipManagerId;
  if (loggedUser.role !== 'admin') {
    // Strip change attempt
    updatedManagerId = oldContract.relationshipManagerId;
  } else if (updatedManagerId !== undefined && parseInt(updatedManagerId) !== oldContract.relationshipManagerId) {
    // Validate target manager exists and is active
    const m = state.users.find(u => u.id === parseInt(updatedManagerId))
    if (!m) throw new Error('Selected manager does not exist')
    if (m.isActive === 0) throw new Error('Cannot assign to a deactivated employee')
  }

  const manager = state.users.find(u => u.id === parseInt(updatedManagerId || oldContract.relationshipManagerId))
  
  const updatedContract = {
    ...oldContract,
    ...contractData,
    relationshipManagerId: parseInt(updatedManagerId || oldContract.relationshipManagerId),
    relationshipManager: manager ? manager.name : oldContract.relationshipManager,
    priceRevision: parseFloat(contractData.priceRevision || 0),
    contractValue: parseFloat(contractData.contractValue || 0),
  }
  state.contracts[idx] = updatedContract

  const changes = []
  Object.keys(contractData).forEach(key => {
    if (key === 'relationshipManagerId') return; // Handled separately
    if (contractData[key] !== undefined && JSON.stringify(contractData[key]) !== JSON.stringify(oldContract[key])) {
      changes.push({ key, oldVal: oldContract[key], newVal: contractData[key] })
    }
  })

  if (parseInt(updatedManagerId || oldContract.relationshipManagerId) !== oldContract.relationshipManagerId) {
    changes.push({ key: 'relationship_manager_id', oldVal: oldContract.relationshipManagerId, newVal: updatedManagerId })
  }

  changes.forEach(change => {
    state.logs.unshift({
      id: `a-${Date.now()}-${change.key}`,
      contractRenewalId: id,
      action: 'UPDATE',
      fieldChanged: change.key,
      oldValue: String(change.oldVal),
      newValue: String(change.newVal),
      changedBy: loggedUser.username || 'System',
      createdAt: new Date().toISOString(),
      description: `Updated ${change.key} from ${change.oldVal} to ${change.newVal}`
    })
  })

  saveStorageState(state)
  return updatedContract
}

export async function updateStatus(id, newStatus) {
  if (!isMockActive()) {
    try {
      const dbId = frontendIdToDbId(id)
      const res = await apiFetch(`/api/contracts/${dbId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })
      return mapContractToUI(res.data)
    } catch (err) {
      console.warn('[API] Server unreachable, shifting status inside localStorage:', err.message)
    }
  }

  // Local Storage Fallback
  const state = getStorageState()
  const loggedUser = getLoggedInMockUser()
  const idx = state.contracts.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Contract not found')

  const oldContract = state.contracts[idx]

  if (loggedUser.role !== 'admin' && oldContract.relationshipManagerId !== loggedUser.id) {
    throw new Error('Access denied. You do not manage this contract.')
  }
  
  const oldStatus = oldContract.status
  state.contracts[idx].status = newStatus

  state.logs.unshift({
    id: `a-${Date.now()}`,
    contractRenewalId: id,
    action: 'STATUS_CHANGE',
    fieldChanged: 'status',
    oldValue: oldStatus,
    newValue: newStatus,
    changedBy: loggedUser.username || 'System',
    createdAt: new Date().toISOString(),
    description: `Status changed from ${oldStatus} to ${newStatus}`
  })

  saveStorageState(state)
  return state.contracts[idx]
}

export async function getDashboardSummary() {
  if (!isMockActive()) {
    try {
      const [summary, activitiesRes] = await Promise.all([
        apiFetch('/api/dashboard/summary'),
        apiFetch('/api/dashboard/activities')
      ])

      const statusMap = summary.statusCounts || {}
      const totalActive = (statusMap['Active'] || 0) + (statusMap['Renewed'] || 0)
      const expiringSoon = statusMap['Expiring Soon'] || 0
      const overdue = statusMap['Expired'] || 0

      const contracts = await getContracts()
      const avgRevision = contracts.length > 0
        ? contracts.reduce((sum, c) => sum + (c.priceRevision || 0), 0) / contracts.length
        : 0

      const activities = (activitiesRes.activities || []).map(log => ({
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
    } catch (err) {
      console.warn('[API] Server unreachable, loading localStorage dashboard stats:', err.message)
    }
  }

  // Local Storage Fallback
  const state = getStorageState()
  const loggedUser = getLoggedInMockUser()
  let list = [...state.contracts]

  if (loggedUser.role !== 'admin') {
    list = list.filter(c => c.relationshipManagerId === loggedUser.id)
  }
  
  const totalActive = list.filter(c => c.status === 'Active' || c.status === 'Renewed').length
  const expiringSoon = list.filter(c => c.status === 'Expiring Soon').length
  const overdue = list.filter(c => c.status === 'Overdue' || c.status === 'Expired').length
  
  const totalValue = list.reduce((sum, c) => sum + (c.contractValue || 0), 0)
  const avgRevision = list.length > 0 
    ? list.reduce((sum, c) => sum + (c.priceRevision || 0), 0) / list.length 
    : 0

  const contractIds = new Set(list.map(c => c.id))
  const recentActivities = [...state.logs]
    .filter(l => contractIds.has(l.contractRenewalId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(log => {
      const contract = list.find(c => c.id === log.contractRenewalId)
      return {
        ...log,
        academyName: contract ? contract.academyName : 'Unknown Academy'
      }
    })

  return {
    totalActive,
    expiringSoon,
    overdue,
    avgPriceRevision: avgRevision.toFixed(1),
    totalContractValue: totalValue,
    recentActivities
  }
}

export async function getReportsSummary() {
  if (!isMockActive()) {
    try {
      const [summary, expiringRes] = await Promise.all([
        apiFetch('/api/reports/summary'),
        apiFetch('/api/reports/expiring')
      ])

      const categoriesData = (summary.categoryBreakdown || []).map(cat => ({
        name: cat.category,
        value: cat.count
      }))

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

      const donutData = [
        { name: 'Active', value: (statusCounts['Active'] || 0) + (statusCounts['Renewed'] || 0) },
        { name: 'In Review', value: statusCounts['In Review'] || 0 },
        { name: 'Draft', value: (statusCounts['Draft'] || 0) + (statusCounts['Expiring Soon'] || 0) + (statusCounts['Overdue'] || 0) }
      ]

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
        const forecastVal = baseVal * 1.055

        trendsData.push({
          month: name,
          current: i <= 2 ? baseVal : null,
          forecast: Math.round(forecastVal)
        })
      }

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
    } catch (err) {
      console.warn('[API] Server unreachable, loading localStorage reports:', err.message)
    }
  }

  // Local Storage Fallback
  const state = getStorageState()
  const loggedUser = getLoggedInMockUser()
  let list = [...state.contracts]

  if (loggedUser.role !== 'admin') {
    list = list.filter(c => c.relationshipManagerId === loggedUser.id)
  }

  const categoryCounts = {}
  list.forEach(c => {
    if (!c.equipmentCategories) return
    c.equipmentCategories.forEach(cat => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })
  })
  const categoriesData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))

  const statusCounts = {
    'Active': list.filter(c => c.status === 'Active').length,
    'In Review': list.filter(c => c.status === 'In Review').length,
    'Draft': list.filter(c => c.status === 'Draft').length,
    'Expiring Soon': list.filter(c => c.status === 'Expiring Soon').length,
    'Overdue': list.filter(c => c.status === 'Overdue' || c.status === 'Expired').length,
    'Renewed': list.filter(c => c.status === 'Renewed').length,
  }

  const donutData = [
    { name: 'Active', value: statusCounts['Active'] + statusCounts['Renewed'] },
    { name: 'In Review', value: statusCounts['In Review'] },
    { name: 'Draft', value: statusCounts['Draft'] + statusCounts['Expiring Soon'] + statusCounts['Overdue'] }
  ]

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonthIdx = new Date().getMonth()
  const trendsData = []
  for (let i = 0; i < 6; i++) {
    const idx = (currentMonthIdx - 3 + i + 12) % 12
    const name = months[idx]
    const baseVal = 450000 + i * 25000
    const forecastVal = baseVal * 1.055
    trendsData.push({
      month: name,
      current: i <= 2 ? baseVal : null,
      forecast: Math.round(forecastVal)
    })
  }

  const today = new Date()
  const sixtyDaysLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
  const upcomingRenewals = list
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

// ─── Team Management API Wrapper ────────────────────────────────────────────

export async function getUsers() {
  if (!isMockActive()) {
    try {
      const res = await apiFetch('/api/users')
      return res.users || []
    } catch (err) {
      console.warn('[API] Server unreachable, loading localStorage mock users:', err.message)
    }
  }

  // Local Storage Fallback
  const state = getStorageState()
  const loggedUser = getLoggedInMockUser()
  if (loggedUser.role !== 'admin') {
    throw new Error('Access denied. Administrator privileges required.')
  }

  return state.users.map(u => {
    const assignedCount = state.contracts.filter(c => c.relationshipManagerId === u.id).length
    return {
      ...u,
      assignedAcademiesCount: assignedCount
    }
  })
}

export async function createUser(userData) {
  if (!isMockActive()) {
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      })
      return res.user
    } catch (err) {
      console.warn('[API] Server unreachable, creating mock user locally:', err.message)
    }
  }

  // Local Storage Fallback
  const state = getStorageState()
  const loggedUser = getLoggedInMockUser()
  if (loggedUser.role !== 'admin') {
    throw new Error('Access denied. Administrator privileges required.')
  }

  // Check unique username or email
  const exists = state.users.find(u => u.username === userData.username || u.email === userData.email)
  if (exists) {
    throw new Error('Username or email already exists.')
  }

  const newUser = {
    id: state.users.length + 1,
    username: userData.username,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    title: userData.title || 'Relationship Manager',
    phone: userData.phone || null,
    avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80',
    isActive: 1,
    createdAt: new Date().toISOString()
  }

  state.users.push(newUser)
  saveStorageState(state)
  return newUser
}

export async function updateUser(id, userData) {
  if (!isMockActive()) {
    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      })
      return res.user
    } catch (err) {
      console.warn('[API] Server unreachable, updating mock user locally:', err.message)
    }
  }

  // Local Storage Fallback
  const state = getStorageState()
  const loggedUser = getLoggedInMockUser()
  if (loggedUser.role !== 'admin') {
    throw new Error('Access denied. Administrator privileges required.')
  }

  const idx = state.users.findIndex(u => u.id === parseInt(id))
  if (idx === -1) throw new Error('Employee not found.')

  const targetUser = state.users[idx]

  // Lockout check
  const isDemotingOrDeactivating = 
    (userData.role !== undefined && userData.role !== 'admin' && targetUser.role === 'admin') || 
    (userData.isActive !== undefined && parseInt(userData.isActive) === 0 && targetUser.isActive === 1)

  if (isDemotingOrDeactivating) {
    if (loggedUser.id === targetUser.id) {
      throw new Error('Self-lockout prevention: You cannot demote yourself or deactivate your own account.')
    }
    const activeAdminsCount = state.users.filter(u => u.role === 'admin' && u.isActive === 1).length
    if (activeAdminsCount <= 1 && targetUser.role === 'admin' && targetUser.isActive === 1) {
      throw new Error('Lockout prevention: At least one active Administrator must exist in the system.')
    }
  }

  const updatedUser = {
    ...targetUser,
    ...userData,
    isActive: userData.isActive !== undefined ? parseInt(userData.isActive) : targetUser.isActive
  }

  state.users[idx] = updatedUser
  saveStorageState(state)
  return updatedUser
}
