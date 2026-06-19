import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import StatsCard from '../components/StatsCard'
import AlertBanner from '../components/AlertBanner'
import StatusBadge from '../components/StatusBadge'
import {
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Download,
  Eye,
  User,
  FileText
} from 'lucide-react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [allContracts, setAllContracts] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Sub-tabs state
  const [activeTab, setActiveTab] = useState('Overview')

  // Local filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [managerFilter, setManagerFilter] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [summaryData, contractsData, activitiesData] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/contracts?limit=100'),
        api.get('/dashboard/activities')
      ])
      setSummary(summaryData)
      setAllContracts(contractsData.data || contractsData.contracts || (Array.isArray(contractsData) ? contractsData : []))
      setRecentActivities(activitiesData.activities || [])
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)} K`
    return `₹${value}`
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Generate initials for Academy badge
  const getInitials = (name) => {
    if (!name) return 'OS'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Consistent gradient color for avatars
  const getAvatarColor = (name) => {
    const colors = [
      'from-emerald-500 to-teal-600 text-emerald-100 ring-emerald-500/20',
      'from-blue-500 to-indigo-600 text-blue-100 ring-blue-500/20',
      'from-amber-500 to-orange-600 text-amber-100 ring-amber-500/20',
      'from-rose-500 to-red-600 text-rose-100 ring-rose-500/20',
      'from-purple-500 to-violet-600 text-purple-100 ring-purple-500/20',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  // Calculate dynamic stats
  const activeCount = allContracts.filter(c => c.status === 'Active').length
  const renewedCount = allContracts.filter(c => c.status === 'Renewed').length
  
  const avgPriceRevision = allContracts.length > 0
    ? (allContracts.reduce((sum, c) => sum + (c.priceRevision || 0), 0) / allContracts.length).toFixed(1)
    : '0.0'

  // Extract unique filter options
  const uniqueCategories = [...new Set(allContracts.flatMap(c => 
    c.equipmentCategories ? c.equipmentCategories.split(',').map(cat => cat.trim()) : []
  ))].sort()

  const uniqueManagers = [...new Set(allContracts.map(c => c.relationshipManager).filter(Boolean))].sort()

  // Apply filters
  const filteredContracts = allContracts.filter(c => {
    const matchesSearch = searchQuery === '' || 
      c.academyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.relationshipManager?.toLowerCase().includes(searchQuery.toLowerCase())
      
    const matchesCategory = categoryFilter === '' || 
      (c.equipmentCategories && c.equipmentCategories.toLowerCase().includes(categoryFilter.toLowerCase()))
      
    const matchesStatus = statusFilter === '' || c.status === statusFilter
    
    const matchesManager = managerFilter === '' || c.relationshipManager === managerFilter

    return matchesSearch && matchesCategory && matchesStatus && matchesManager
  })

  // Format Projected Renewal Value (rolling 12 months)
  const getProjectedRenewalData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const grouped = {}
    
    allContracts.forEach(c => {
      if (!c.renewalDate) return
      const date = new Date(c.renewalDate)
      const monthName = months[date.getMonth()]
      grouped[monthName] = (grouped[monthName] || 0) + (c.contractValue || 0)
    })
    
    // Generate next 12 months starting from current month
    const currentMonthIndex = new Date().getMonth()
    const result = []
    for (let i = 0; i < 12; i++) {
      const idx = (currentMonthIndex + i) % 12
      const mName = months[idx]
      result.push({
        month: mName,
        value: grouped[mName] || 0
      })
    }
    return result
  }

  const projectedData = getProjectedRenewalData()
  const maxProjectedValue = Math.max(...projectedData.map(d => d.value), 0)

  // Recent Event formatting helpers
  const getActivityText = (act) => {
    const academy = act.academyName || `Contract #${act.contractRenewalId}`
    if (act.action === 'CREATE') {
      return `New contract entry registered for ${academy}`
    }
    if (act.action === 'DELETE') {
      return `Contract deleted for ${academy}`
    }
    if (act.action === 'STATUS_CHANGE') {
      return `${academy} status changed to ${act.newValue}`
    }
    if (act.action === 'UPDATE') {
      return `${academy} details updated (${act.field} changed)`
    }
    if (act.action === 'AUTO_STATUS_UPDATE') {
      return `System auto-updated status of ${academy} to ${act.newValue}`
    }
    return `${academy} contract details updated`
  }

  const getActivityColor = (action) => {
    if (action === 'CREATE') return 'bg-[#127464]'
    if (action === 'DELETE') return 'bg-red-500'
    if (action === 'STATUS_CHANGE') return 'bg-blue-500'
    return 'bg-amber-500'
  }

  const handleExportCSV = () => {
    const headers = ['Contract ID', 'Academy Name', 'Equipment Categories', 'Contract Value (INR)', 'Price Revision (%)', 'Renewal Date', 'Relationship Manager', 'Status']
    const rows = filteredContracts.map(c => [
      `OX-${2010000 + c.id}`,
      c.academyName,
      c.equipmentCategories,
      c.contractValue,
      c.priceRevision,
      c.renewalDate,
      c.relationshipManager,
      c.status
    ])
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `oxygen_sports_dashboard_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading dashboard analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="text-blue-500 text-sm hover:underline cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header breadcrumbs and sub-tabs */}
      <div className="space-y-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-widest uppercase">
          <span>OXYGEN SPORTS</span>
          <span>/</span>
          <span className="text-gray-500">DASHBOARD OVERVIEW</span>
        </div>

        {/* Title and Add button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Academy Annual Contract Renewal
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Believe it, Achieve it ! &bull; Today is {todayStr}
            </p>
          </div>
          <button
            onClick={() => navigate('/contracts/new')}
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-[#0059BB] hover:bg-[#004493] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/15 transition-all duration-200 cursor-pointer"
          >
            + New Contract
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-gray-200">
          {['Overview', 'History', 'Forecast'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 -mb-[2px] ${
                activeTab === tab
                  ? 'border-[#ab3600] text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Banner */}
      <AlertBanner count={summary?.urgentAlerts || 0} />

      {/* 4 Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          icon={CheckCircle}
          label="Total Active Contracts"
          value={activeCount}
          trendLabel="+2.4% from last month"
          color="green"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Expiring in 30 Days"
          value={summary?.urgentAlerts || 0}
          trendLabel="! CRITICAL ATTENTION"
          color="orange"
        />
        <StatsCard
          icon={RefreshCw}
          label="Recent Renewals"
          value={renewedCount}
          trendLabel="Renewed this quarter"
          color="blue"
        />
        <StatsCard
          icon={TrendingUp}
          label="Avg Price Revision"
          value={`+${avgPriceRevision}%`}
          trendLabel="Target: < 15%"
          color="purple"
        />
      </div>

      {/* Filters row */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search academy or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg neon-input text-gray-900 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
          />
        </div>

        {/* Dropdowns & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
            <option value="Renewed">Renewed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Manager Dropdown */}
          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Managers</option>
            {uniqueManagers.map(mgr => (
              <option key={mgr} value={mgr}>{mgr}</option>
            ))}
          </select>

          {/* Actions */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            Export CSV
          </button>
          
          <button
            onClick={() => {
              setSearchQuery('')
              setCategoryFilter('')
              setStatusFilter('')
              setManagerFilter('')
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 bg-transparent border border-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Academy Contracts ({filteredContracts.length})
          </h3>
          <button
            onClick={() => navigate('/contracts')}
            className="text-[#0059BB] text-xs font-bold hover:text-blue-600 flex items-center gap-1 transition-colors uppercase tracking-wider cursor-pointer"
          >
            Advanced Table <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredContracts.length > 0 ? (
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle px-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                      Academy Partner
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell">
                      Equipment Group
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden md:table-cell">
                      Renewal Date
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                      Price Revision
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell">
                      Relationship Manager
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                      Value (₹)
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredContracts.slice(0, 10).map((contract) => {
                    const avatarColor = getAvatarColor(contract.academyName)
                    const initials = getInitials(contract.academyName)
                    return (
                      <tr
                        key={contract._id || contract.id}
                        onClick={() => navigate(`/contracts/${contract.id || contract._id}`)}
                        className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                      >
                        {/* Academy Badge & ID Info */}
                        <td className="py-4 px-4 text-sm font-bold text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center font-bold text-xs`}>
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="group-hover:text-[#0059BB] transition-colors">
                                {contract.academyName}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono font-medium">
                                ID: OX-{2010000 + contract.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        {/* Equipment tags */}
                        <td className="py-4 px-4 text-xs text-gray-500 hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {contract.equipmentCategories?.split(',').map((cat, idx) => (
                              <span key={idx} className="bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                                {cat.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        {/* Renewal Date */}
                        <td className="py-4 px-4 text-sm text-gray-600 hidden md:table-cell font-medium">
                          {formatDate(contract.renewalDate)}
                        </td>
                        {/* Price Revision */}
                        <td className="py-4 px-4 text-sm font-semibold text-emerald-600">
                          +{contract.priceRevision || 0}%
                        </td>
                        {/* Relationship Manager Avatar */}
                        <td className="py-4 px-4 text-sm text-gray-500 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="text-gray-700 text-xs font-semibold">
                              {contract.relationshipManager}
                            </span>
                          </div>
                        </td>
                        {/* Contract Value */}
                        <td className="py-4 px-4 text-sm font-bold text-gray-900">
                          ₹{(contract.contractValue || 0).toLocaleString('en-IN')}
                        </td>
                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          <StatusBadge status={contract.status} />
                        </td>
                        {/* Action buttons */}
                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigate(`/contracts/${contract.id || contract._id}`)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-45" />
            <p className="text-sm">No contract partnerships found matching criteria.</p>
          </div>
        )}
      </div>

      {/* Bottom split area: Projected Renewal Value Chart (Left) & Recent Events Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Projected Renewal Value */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Projected Renewal Value
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">12-Month Rolling Partnership Values</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ADC7FF]" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Standard</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#AB3600]" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Peak Month</span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectedData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#A0AEC0"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#717786', fontSize: 11, fontWeight: '600' }}
                />
                <YAxis
                  stroke="#A0AEC0"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrency}
                  tick={{ fill: '#717786', fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 text-xs border border-gray-200 rounded-lg shadow-md">
                          <p className="text-gray-900 font-bold mb-1">{payload[0].payload.month}</p>
                          <p className="text-gray-500">
                            Projected: <span className="text-gray-900 font-mono font-bold">₹{payload[0].value.toLocaleString('en-IN')}</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {projectedData.map((entry, index) => {
                    const isPeak = entry.value === maxProjectedValue && maxProjectedValue > 0
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isPeak ? '#AB3600' : '#ADC7FF'}
                        className="transition-all duration-300 hover:opacity-85"
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Recent Events Log */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Recent Events
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Real-time contract audit tracking logs</p>
              </div>
              <button
                onClick={() => navigate('/contracts')}
                className="text-[#0059BB] text-xs font-bold hover:text-blue-600 transition-colors uppercase tracking-wider cursor-pointer"
              >
                View All Activities
              </button>
            </div>

            {/* Event Log list */}
            {recentActivities.length > 0 ? (
              <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id || activity._id} className="flex gap-3 items-start">
                    {/* Event bullet */}
                    <div className="mt-1.5">
                      <span className={`block w-2 h-2 rounded-full ${getActivityColor(activity.action)}`} />
                    </div>
                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 leading-normal font-medium">
                        {getActivityText(activity)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
                        <span className="font-semibold text-gray-500">User: {activity.changedBy || 'system'}</span>
                        <span>&bull;</span>
                        <span>{new Date(activity.createdAt).toLocaleDateString('en-IN')} {new Date(activity.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="w-9 h-9 opacity-35 mb-2" />
                <p className="text-xs">No recent log events available.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-150 mt-4 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-medium">
              Audit log collection is active.
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
