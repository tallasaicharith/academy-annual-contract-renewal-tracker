import { initialContracts } from '../mock/contracts.mock'
import { mockManagers } from '../mock/managers.mock'
import { mockAuditLogs } from '../mock/auditLogs.mock'

// Helper to initialize and retrieve local storage state
const getStorageState = () => {
  let contracts = localStorage.getItem('oxygen_contracts')
  let logs = localStorage.getItem('oxygen_audit_logs')

  if (!contracts) {
    localStorage.setItem('oxygen_contracts', JSON.stringify(initialContracts))
    contracts = JSON.stringify(initialContracts)
  }
  if (!logs) {
    localStorage.setItem('oxygen_audit_logs', JSON.stringify(mockAuditLogs))
    logs = JSON.stringify(mockAuditLogs)
  }

  return {
    contracts: JSON.parse(contracts),
    logs: JSON.parse(logs),
    managers: mockManagers
  }
}

const saveStorageState = (state) => {
  localStorage.setItem('oxygen_contracts', JSON.stringify(state.contracts))
  localStorage.setItem('oxygen_audit_logs', JSON.stringify(state.logs))
}

// Simulated latency helper
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms))

export async function getContracts({ search = '', status = '', category = '', manager = '' } = {}) {
  await delay()
  const { contracts } = getStorageState()
  
  let filtered = [...contracts]

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
    filtered = filtered.filter(c => c.relationshipManager === manager)
  }

  return filtered
}

export async function getContractById(id) {
  await delay()
  const { contracts, logs } = getStorageState()
  const contract = contracts.find(c => c.id === id)
  if (!contract) throw new Error('Contract not found')
  
  const history = logs.filter(l => l.contractRenewalId === id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
  return { contract, history }
}

export async function createContract(contractData) {
  await delay()
  const state = getStorageState()
  
  // Generate ID: OX-XXXX
  const nextNum = 2000 + state.contracts.length + 1
  const id = `OX-${nextNum}`
  
  const newContract = {
    id,
    ...contractData,
    priceRevision: parseFloat(contractData.priceRevision || 0),
    contractValue: parseFloat(contractData.contractValue || 0),
    documentName: contractData.documentName || 'contract_attachment.pdf',
  }

  state.contracts.unshift(newContract)

  // Log audit event
  const log = {
    id: `a-${Date.now()}`,
    contractRenewalId: id,
    action: 'CREATE',
    fieldChanged: 'contract',
    oldValue: 'None',
    newValue: 'Created',
    changedBy: contractData.relationshipManager || 'System',
    createdAt: new Date().toISOString(),
    description: `Contract OX-${nextNum} registered for ${contractData.academyName}`
  }
  state.logs.unshift(log)
  
  saveStorageState(state)
  return newContract
}

export async function updateContract(id, contractData) {
  await delay()
  const state = getStorageState()
  const idx = state.contracts.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Contract not found')
  
  const oldContract = state.contracts[idx]
  const updatedContract = {
    ...oldContract,
    ...contractData,
    priceRevision: parseFloat(contractData.priceRevision || 0),
    contractValue: parseFloat(contractData.contractValue || 0),
  }

  state.contracts[idx] = updatedContract

  // Detect changes for audit log
  const changes = []
  Object.keys(contractData).forEach(key => {
    if (contractData[key] !== undefined && JSON.stringify(contractData[key]) !== JSON.stringify(oldContract[key])) {
      changes.push({
        key,
        oldVal: oldContract[key],
        newVal: contractData[key]
      })
    }
  })

  // Create audit logs
  changes.forEach(change => {
    const log = {
      id: `a-${Date.now()}-${change.key}`,
      contractRenewalId: id,
      action: 'UPDATE',
      fieldChanged: change.key,
      oldValue: String(change.oldVal),
      newValue: String(change.newVal),
      changedBy: contractData.relationshipManager || oldContract.relationshipManager || 'System',
      createdAt: new Date().toISOString(),
      description: `Updated ${change.key} from ${change.oldVal} to ${change.newVal}`
    }
    state.logs.unshift(log)
  })

  saveStorageState(state)
  return updatedContract
}

export async function updateStatus(id, newStatus) {
  await delay()
  const state = getStorageState()
  const idx = state.contracts.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Contract not found')
  
  const oldStatus = state.contracts[idx].status
  state.contracts[idx].status = newStatus

  // Log status change
  const log = {
    id: `a-${Date.now()}`,
    contractRenewalId: id,
    action: 'STATUS_CHANGE',
    fieldChanged: 'status',
    oldValue: oldStatus,
    newValue: newStatus,
    changedBy: state.contracts[idx].relationshipManager || 'System',
    createdAt: new Date().toISOString(),
    description: `Status changed from ${oldStatus} to ${newStatus}`
  }
  state.logs.unshift(log)

  saveStorageState(state)
  return state.contracts[idx]
}

export async function getDashboardSummary() {
  await delay()
  const { contracts, logs } = getStorageState()
  
  const totalActive = contracts.filter(c => c.status === 'Active' || c.status === 'Renewed').length
  const expiringSoon = contracts.filter(c => c.status === 'Expiring Soon').length
  const overdue = contracts.filter(c => c.status === 'Overdue').length
  
  const totalValue = contracts.reduce((sum, c) => sum + (c.contractValue || 0), 0)
  const avgRevision = contracts.length > 0 
    ? contracts.reduce((sum, c) => sum + (c.priceRevision || 0), 0) / contracts.length 
    : 0

  // Grab recent 5 activity logs
  const recentActivities = [...logs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(log => {
      const contract = contracts.find(c => c.id === log.contractRenewalId)
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
  await delay()
  const { contracts } = getStorageState()

  // 1. Contracts by Category distribution
  const categoryCounts = {}
  contracts.forEach(c => {
    if (!c.equipmentCategories) return
    c.equipmentCategories.forEach(cat => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })
  })
  
  const categoriesData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value
  }))

  // 2. Status distribution
  const statusCounts = {
    'Active': contracts.filter(c => c.status === 'Active').length,
    'In Review': contracts.filter(c => c.status === 'In Review').length,
    'Draft': contracts.filter(c => c.status === 'Draft').length,
    'Expiring Soon': contracts.filter(c => c.status === 'Expiring Soon').length,
    'Overdue': contracts.filter(c => c.status === 'Overdue').length,
    'Renewed': contracts.filter(c => c.status === 'Renewed').length,
  }

  // Grouped segments for donut chart (Active / In Review / Draft)
  const donutData = [
    { name: 'Active', value: statusCounts['Active'] + statusCounts['Renewed'] },
    { name: 'In Review', value: statusCounts['In Review'] },
    { name: 'Draft', value: statusCounts['Draft'] + statusCounts['Expiring Soon'] + statusCounts['Overdue'] }
  ]

  // 3. Price Revision Trends (Solid vs Forecast dashed)
  // Group by month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonthIdx = new Date().getMonth()
  
  const trendsData = []
  for (let i = 0; i < 6; i++) {
    const idx = (currentMonthIdx - 3 + i + 12) % 12
    const name = months[idx]
    
    // Mock trends
    const baseVal = 450000 + i * 25000
    const forecastVal = baseVal * (1.05) // adding 5% forecast
    
    trendsData.push({
      month: name,
      current: i <= 2 ? baseVal : null, // current is solid up to today (i=2 is current month)
      forecast: forecastVal
    })
  }

  // 4. Upcoming Renewals (Next 60 Days)
  const today = new Date()
  const sixtyDaysLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
  
  const upcomingRenewals = contracts
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
