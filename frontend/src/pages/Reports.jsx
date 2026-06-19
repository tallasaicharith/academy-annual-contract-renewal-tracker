import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import StatsCard from '../components/StatsCard'
import StatusBadge from '../components/StatusBadge'
import {
  FileText,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Download,
  Loader2,
  Calendar,
  XCircle,
  Plus,
  ChevronDown,
  User,
  Clock
} from 'lucide-react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Legend
} from 'recharts'

const CHART_COLORS = ['#127464', '#F59E0B', '#EF4444', '#3B82F6', '#6B7280', '#8B5CF6', '#EC4899', '#14B8A6']

function Reports() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [contracts, setContracts] = useState([])
  const [exporting, setExporting] = useState(false)

  // Top header filter selectors
  const [managerFilter, setManagerFilter] = useState('')
  const [expiryPeriodFilter, setExpiryPeriodFilter] = useState('all') // '30', '90', 'all'

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const [summaryData, contractsData] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/contracts?limit=1000'),
      ])
      setSummary(summaryData)
      setContracts(contractsData.data || contractsData.contracts || contractsData || [])
    } catch (err) {
      setError('Failed to load report data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const blob = await api.get('/reports/export')
      if (blob instanceof Blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `oxygen_sports_analytics_report_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        exportCSVFromData()
      }
    } catch {
      exportCSVFromData()
    } finally {
      setExporting(false)
    }
  }

  const exportCSVFromData = () => {
    const headers = [
      'Academy Name',
      'Equipment Categories',
      'Contract Value (INR)',
      'Price Revision (%)',
      'Relationship Manager',
      'Start Date',
      'Renewal Date',
      'Status',
    ]
    const rows = filteredContracts.map((c) => [
      c.academyName,
      c.equipmentCategories,
      c.contractValue,
      c.priceRevision,
      c.relationshipManager,
      c.contractStartDate,
      c.renewalDate,
      c.status,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `oxygen_sports_analytics_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  }

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)} K`
    return `₹${value}`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Extract unique managers
  const uniqueManagers = [...new Set(contracts.map(c => c.relationshipManager).filter(Boolean))].sort()

  // Apply filters
  const filteredContracts = contracts.filter(c => {
    const matchesManager = managerFilter === '' || c.relationshipManager === managerFilter
    
    if (expiryPeriodFilter === 'all') return matchesManager
    
    const days = getDaysUntil(c.renewalDate)
    if (expiryPeriodFilter === '30') {
      return matchesManager && days !== null && days >= 0 && days <= 30
    }
    if (expiryPeriodFilter === '90') {
      return matchesManager && days !== null && days >= 0 && days <= 90
    }
    return matchesManager
  })

  // Calculations based on filtered list
  const totalValue = filteredContracts.reduce((sum, c) => sum + (c.contractValue || 0), 0)
  const avgValue = filteredContracts.length > 0 ? totalValue / filteredContracts.length : 0
  const activeCount = filteredContracts.filter(c => c.status === 'Active').length
  
  const expiringSoonCount = filteredContracts.filter(c => {
    const days = getDaysUntil(c.renewalDate)
    return days !== null && days >= 0 && days <= 30
  }).length

  // Top Left: Contracts by Equipment Category (Bar Chart)
  const getEquipmentCategoryData = () => {
    const map = {}
    filteredContracts.forEach((c) => {
      const categories = (c.equipmentCategories || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      categories.forEach((cat) => {
        map[cat] = (map[cat] || 0) + 1
      })
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }

  const equipmentData = getEquipmentCategoryData()

  // Top Right: Contract Status (Donut Chart)
  const getStatusDistributionData = () => {
    const statuses = ['Active', 'Expiring Soon', 'Expired', 'Renewed', 'Cancelled']
    return statuses.map(status => ({
      name: status,
      value: filteredContracts.filter(c => c.status === status).length
    })).filter(d => d.value > 0)
  }

  const statusData = getStatusDistributionData()

  // Bottom Left: Price Revision Trends (Current vs Forecast Line Chart)
  const getRevisionTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const grouped = {}
    
    filteredContracts.forEach(c => {
      if (!c.renewalDate) return
      const date = new Date(c.renewalDate)
      const mName = months[date.getMonth()]
      
      if (!grouped[mName]) {
        grouped[mName] = { current: 0, forecast: 0 }
      }
      grouped[mName].current += (c.contractValue || 0)
      grouped[mName].forecast += (c.contractValue || 0) * (1 + (c.priceRevision || 0) / 100)
    })
    
    // Sort or arrange by rolling months
    const currentMonthIndex = new Date().getMonth()
    const result = []
    for (let i = 0; i < 12; i++) {
      const idx = (currentMonthIndex + i) % 12
      const mName = months[idx]
      result.push({
        month: mName,
        current: Math.round(grouped[mName]?.current || 0),
        forecast: Math.round(grouped[mName]?.forecast || 0)
      })
    }
    return result
  }

  const revisionTrendData = getRevisionTrendData()

  // Bottom Right: Upcoming Renewals
  const upcomingRenewals = filteredContracts
    .filter(c => {
      const days = getDaysUntil(c.renewalDate)
      return days !== null && days >= 0
    })
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .slice(0, 10)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#127464] animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading analytics intelligence...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchReportData}
            className="text-blue-400 text-sm hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Breadcrumbs */}
      <div className="space-y-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#717786] tracking-widest uppercase">
          <span className="cursor-pointer hover:text-[#1A1C1E]" onClick={() => navigate('/dashboard')}>OXYGEN SPORTS</span>
          <span>/</span>
          <span className="text-[#1A1C1E]">REPORTS & ANALYTICS</span>
        </div>

        {/* Title row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1E] tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-[#717786] text-sm mt-0.5">
              Comprehensive contractual intelligence, revisions forecasting, and renewals tracking.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Expiry Selector */}
            <select
              value={expiryPeriodFilter}
              onChange={(e) => setExpiryPeriodFilter(e.target.value)}
              className="bg-white border border-[rgba(193,198,215,0.6)] text-[#414754] text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#0059BB] transition-colors"
            >
              <option value="all">All Timelines</option>
              <option value="30">Expires &le; 30 Days</option>
              <option value="90">Expires &le; 90 Days</option>
            </select>

            {/* Manager selector */}
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className="bg-white border border-[rgba(193,198,215,0.6)] text-[#414754] text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#0059BB] transition-colors"
            >
              <option value="">All Managers</option>
              {uniqueManagers.map(mgr => (
                <option key={mgr} value={mgr}>{mgr}</option>
              ))}
            </select>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0C4F44] hover:bg-[#08372F] text-white text-xs font-bold transition-all shadow-sm border border-[#0C4F44] disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          icon={FileText}
          label="Total Contracts"
          value={filteredContracts.length}
          color="blue"
        />
        <StatsCard
          icon={IndianRupee}
          label="Total Value"
          value={formatCurrency(totalValue)}
          color="green"
        />
        <StatsCard
          icon={TrendingUp}
          label="Avg Contract Value"
          value={formatCurrency(Math.round(avgValue))}
          color="purple"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Expiring in 30 Days"
          value={expiringSoonCount}
          color="orange"
        />
      </div>

      {/* Top Grid: Category Bar Chart & Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Left: Contracts by Equipment Category */}
        <div className="glass-card p-6">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-[#414754] uppercase tracking-wider">
              Contracts by Equipment Category
            </h3>
            <p className="text-[10px] text-[#717786] mt-0.5">Top performing equipment groupings by contract volume</p>
          </div>

          <div className="h-[300px]">
            {equipmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equipmentData} layout="vertical" margin={{ top: 5, right: 15, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.3)" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#717786"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#717786', fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#717786"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#414754', fontSize: 10, fontWeight: 'bold' }}
                    width={80}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2.5 rounded-xl shadow-lg text-xs border border-[rgba(193,198,215,0.6)]">
                            <p className="text-[#1A1C1E] font-bold">{payload[0].payload.name}</p>
                            <p className="text-[#717786] mt-0.5">
                              Contracts: <span className="text-[#1A1C1E] font-bold">{payload[0].value}</span>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {equipmentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#717786] text-xs">
                No equipment data matching filters.
              </div>
            )}
          </div>
        </div>

        {/* Top Right: Contract Status Donut Chart */}
        <div className="glass-card p-6">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-[#414754] uppercase tracking-wider">
              Contract Status
            </h3>
            <p className="text-[10px] text-[#717786] mt-0.5">Active, Expired, and Expiring Partnership ratios</p>
          </div>

          <div className="relative h-[300px]">
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => {
                        const statusColors = {
                          'Active': '#127464',
                          'Expiring Soon': '#F59E0B',
                          'Expired': '#EF4444',
                          'Renewed': '#0059BB',
                          'Cancelled': '#6B7280'
                        }
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={statusColors[entry.name] || CHART_COLORS[index % CHART_COLORS.length]}
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />
                        )
                      })}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-2.5 rounded-xl shadow-lg text-xs border border-[rgba(193,198,215,0.6)]">
                              <p className="text-[#1A1C1E] font-bold">{payload[0].name}</p>
                              <p className="text-[#717786] mt-0.5">
                                Volume: <span className="text-[#1A1C1E] font-bold">{payload[0].value}</span>
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconSize={8}
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-[#414754] text-xs font-semibold px-1">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center text active count */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-10%' }}>
                  <span className="text-2xl font-black text-[#1A1C1E]">{activeCount}</span>
                  <span className="text-[9px] font-bold text-[#717786] uppercase tracking-wider">Active Partners</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[#717786] text-xs">
                No status data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Price Revision Trend Line & Upcoming Renewals vertical list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bottom Left: Price Revision Trends */}
        <div className="glass-card p-6">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-[#414754] uppercase tracking-wider">
              Price Revision Trends
            </h3>
            <p className="text-[10px] text-[#717786] mt-0.5">Expected valuation expansion (Current vs Forecasted)</p>
          </div>

          <div className="h-[300px]">
            {filteredContracts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revisionTrendData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                  <defs>
                    <filter id="glow-current" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.3)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#717786"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#717786', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <YAxis
                    stroke="#717786"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCurrency}
                    tick={{ fill: '#717786', fontSize: 10 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-lg text-xs border border-[rgba(193,198,215,0.6)] space-y-1">
                            <p className="text-[#1A1C1E] font-bold">{label}</p>
                            <p className="text-[#0059BB] font-semibold">
                              Current: <span className="text-[#1A1C1E] font-mono">₹{payload[0].value.toLocaleString('en-IN')}</span>
                            </p>
                            <p className="text-emerald-700 font-semibold">
                              Forecast: <span className="text-[#1A1C1E] font-mono">₹{payload[1].value.toLocaleString('en-IN')}</span>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconSize={8}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-[#717786] text-[10px] font-bold uppercase tracking-wider px-1">{value}</span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name="Current"
                    stroke="#0059BB"
                    strokeWidth={3}
                    dot={{ fill: '#0059BB', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast"
                    stroke="#127464"
                    strokeWidth={3}
                    filter="url(#glow-current)"
                    dot={{ fill: '#127464', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#717786] text-xs">
                No trend data available.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Right: Upcoming Renewals List with Floating Add Button */}
        <div className="glass-card p-6 relative flex flex-col justify-between h-[380px]">
          <div>
            <div className="flex items-center justify-between border-b border-[rgba(193,198,215,0.4)] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#414754] uppercase tracking-wider">
                  Upcoming Renewals
                </h3>
                <p className="text-[10px] text-[#717786] mt-0.5 font-bold uppercase tracking-wider">Scheduled partnership renewals queue</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {upcomingRenewals.length > 0 ? (
                upcomingRenewals.map((c) => {
                  const days = getDaysUntil(c.renewalDate)
                  const isUrgent = days !== null && days <= 30
                  const isWarning = days !== null && days > 30 && days <= 90
                  return (
                    <div
                      key={c.id || c._id}
                      onClick={() => navigate(`/contracts/${c.id || c._id}`)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F9F9FC] border border-[rgba(193,198,215,0.4)] hover:border-[#0059BB] cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                          isUrgent ? 'bg-red-50 border-red-200 text-red-600' :
                          isWarning ? 'bg-amber-50 border-amber-200 text-amber-600' :
                          'bg-emerald-50 border-emerald-200 text-emerald-600'
                        }`}>
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1A1C1E] truncate max-w-[150px]">{c.academyName}</p>
                          <p className="text-[9px] text-[#717786] font-mono">Value: ₹{(c.contractValue || 0).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          isUrgent ? 'bg-red-50 text-red-700 border border-red-200' :
                          isWarning ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {days === 0 ? 'Today' : days < 0 ? 'Overdue' : `${days}d Left`}
                        </span>
                        <p className="text-[9px] text-[#717786] mt-1 font-semibold">{formatDate(c.renewalDate)}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-[#717786]">
                  <Calendar className="w-9 h-9 opacity-35 mb-2" />
                  <p className="text-xs">No upcoming renewals found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Floating plus button */}
          <button
            onClick={() => navigate('/contracts/new')}
            className="absolute bottom-6 right-6 w-11 h-11 rounded-full bg-[#AB3600] hover:bg-[#8F2D00] text-white flex items-center justify-center shadow-lg shadow-orange-500/10 transition-transform hover:scale-110"
            title="Register New Contract"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports
