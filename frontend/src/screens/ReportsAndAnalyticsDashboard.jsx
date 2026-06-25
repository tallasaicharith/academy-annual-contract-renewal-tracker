import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
  Area
} from 'recharts'
import { 
  BarChart3, 
  Calendar, 
  User, 
  Download, 
  Info,
  CalendarCheck, 
  CheckCircle2
} from 'lucide-react'
import { getReportsSummary, getContracts, getUsers } from '../api/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const CHART_COLORS = ['#0059bb', '#ab3600', '#00666d', '#008189', '#717786', '#ba1a1a']

function ReportsAndAnalyticsDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // States
  const [loading, setLoading] = useState(true)
  const [reportsData, setReportsData] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [managers, setManagers] = useState([])
  
  // Filter States
  const [dateRange, setDateRange] = useState('Last 30 Days')
  const [managerFilter, setManagerFilter] = useState('All')

  useEffect(() => {
    if (user?.role === 'admin') {
      getUsers()
        .then(res => {
          setManagers(res.filter(u => u.role === 'employee' && u.isActive === 1))
        })
        .catch(err => console.error(err))
    }
  }, [user])

  useEffect(() => {
    fetchReports()
  }, [managerFilter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await getReportsSummary()
      
      // Handle filtering by relationship manager locally for prototype
      if (managerFilter !== 'All') {
        const fullContracts = await getContracts({ manager: managerFilter })
        
        // Recalculate category counts for the filtered manager
        const categoryCounts = {}
        fullContracts.forEach(c => {
          c.equipmentCategories.forEach(cat => {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
          })
        })
        const categoriesData = Object.entries(categoryCounts).map(([name, value]) => ({
          name, value
        }))

        // Recalculate status for donut
        const statusCounts = {
          'Active': fullContracts.filter(c => c.status === 'Active').length,
          'In Review': fullContracts.filter(c => c.status === 'In Review').length,
          'Draft': fullContracts.filter(c => c.status === 'Draft').length,
          'Expiring Soon': fullContracts.filter(c => c.status === 'Expiring Soon').length,
          'Overdue': fullContracts.filter(c => c.status === 'Overdue').length,
          'Renewed': fullContracts.filter(c => c.status === 'Renewed').length,
        }
        const donutData = [
          { name: 'Active', value: statusCounts['Active'] + statusCounts['Renewed'] },
          { name: 'In Review', value: statusCounts['In Review'] },
          { name: 'Draft', value: statusCounts['Draft'] + statusCounts['Expiring Soon'] + statusCounts['Overdue'] }
        ]

        const upcomingRenewals = fullContracts
          .filter(c => {
            if (!c.renewalDate) return false
            const today = new Date()
            const sixtyDaysLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
            const rDate = new Date(c.renewalDate)
            return rDate >= today && rDate <= sixtyDaysLater
          })
          .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))

        setReportsData({
          categoriesData,
          donutData,
          trendsData: data.trendsData, // trends remain static
          upcomingRenewals,
          statusCounts
        })
      } else {
        setReportsData(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleExportCSV = () => {
    if (!reportsData) return
    const headers = ['Category', 'Value Count']
    const rows = reportsData.categoriesData.map(c => [c.name, c.value])
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `OxygenSports_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast("CSV report exported successfully")
  }

  const getDonutTotal = () => {
    if (!reportsData?.donutData) return 0
    return reportsData.donutData.reduce((sum, item) => sum + item.value, 0)
  }

  const donutTotal = getDonutTotal()

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    })
  }

  const formatCurrency = (val) => {
    return val.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })
  }

  if (loading || !reportsData) {
    return <LoadingSpinner message="Calculating analytics charts..." />
  }

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast toast-success shadow-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-outline tracking-widest uppercase font-mono">
            <span>Oxygen Sports</span>
            <span>/</span>
            <span className="text-on-surface-variant font-extrabold">Analytics Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight font-headline">
            Reports & Analytics
          </h1>
          <p className="text-on-surface-variant text-xs font-medium">
            Consolidated supply forecast, category share distribution, and renewal logs.
          </p>
        </div>

        {/* Date Range & RM filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flat-input pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface bg-white cursor-pointer"
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {user?.role === 'admin' && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <select
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
                className="flat-input pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface bg-white cursor-pointer"
              >
                <option value="All">All Managers</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Row 1 Analytics: Categories distribution & Donut Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Contracts by Equipment Category (Horizontal Bar Chart) */}
        <div className="flat-card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-outline flex items-center gap-1.5">
              Contracts by Equipment Category
              <button title="Counts include contract agreements containing this specific product supply category" className="cursor-help">
                <Info className="w-3.5 h-3.5 text-outline" />
              </button>
            </h3>
            <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold font-mono tracking-wide text-primary bg-primary/10 uppercase">
              Supply Share
            </span>
          </div>

          <div className="min-h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reportsData.categoriesData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-outline-variant)" />
                <XAxis type="number" tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <YAxis dataKey="name" type="category" tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontFamily: 'var(--font-body)' }} />
                <Tooltip formatter={(value) => [value, 'Contracts']} contentStyle={{ fontSize: '11px', borderRadius: '4px', fontFamily: 'var(--font-body)' }} />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 2, 2, 0]}>
                  {reportsData.categoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Contract Status (Donut Chart) */}
        <div className="flat-card p-6 bg-white space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-outline">
              Contract Lifecycle Distribution
            </h3>
            <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold font-mono tracking-wide text-tertiary bg-tertiary/10 uppercase">
              Current Segments
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* The Donut Ring */}
            <div className="relative flex justify-center items-center h-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={reportsData.donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {reportsData.donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Centered label */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-on-surface font-headline leading-none">
                  {donutTotal}
                </span>
                <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-outline mt-1">
                  Contracts
                </span>
              </div>
            </div>

            {/* Colored-dot legend */}
            <div className="space-y-2">
              {reportsData.donutData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    ></span>
                    <span className="text-xs font-semibold text-on-surface-variant">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-on-surface">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Analytics: Price Revision line trends & Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Price Revision Trends (Solid vs Dashed line chart) */}
        <div className="flat-card p-6 bg-white space-y-4">
          <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-outline">
            Price Revision Revenue Trends
          </h3>

          <div className="min-h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={reportsData.trendsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" />
                <XAxis dataKey="month" tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <YAxis tickLine={false} tickFormatter={(val) => `₹${val/1000}K`} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ fontSize: '11px', borderRadius: '4px', fontFamily: 'var(--font-body)' }} />
                
                {/* Current actual line (Solid, ends at current month) */}
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1 }}
                  connectNulls={false}
                  name="Current Base Revenue"
                />

                {/* Forecast projection line (Dashed) */}
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="var(--color-secondary)" 
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Forecast Projection"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 justify-center text-[10px] font-mono tracking-wider uppercase font-bold text-outline mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-primary block"></span>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t border-dashed border-secondary block"></span>
              <span>Forecast (+5% revision)</span>
            </div>
          </div>
        </div>

        {/* Right: Upcoming Renewals (Next 60 Days) warning list */}
        <div className="flat-card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-outline">
              Upcoming Renewals (Next 60 Days)
            </h3>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#ab3600] hover:underline cursor-pointer flex items-center gap-1" onClick={() => navigate('/dashboard')}>
              <CalendarCheck className="w-3.5 h-3.5" /> View All Schedules
            </span>
          </div>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {reportsData.upcomingRenewals.map((item) => {
              const daysLeft = Math.ceil((new Date(item.renewalDate) - new Date()) / (1000 * 60 * 60 * 24))
              return (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between border-b border-outline-variant/30 pb-3 hover:bg-surface-container-low p-2 rounded-sm cursor-pointer transition-colors"
                  onClick={() => navigate(`/academies/${item.id}`)}
                >
                  <div className="flex items-center gap-3">
                    {/* Initials circular badge */}
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-outline-variant uppercase">
                      {item.academyName.split(' ').map(n=>n[0]).slice(0,2).join('')}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">{item.academyName}</h4>
                      <p className="text-[9px] text-outline font-mono uppercase tracking-wide">
                        ID: {item.id} &bull; {item.equipmentCategories.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-on-surface font-mono">{formatCurrency(item.contractValue)}</p>
                    <p className="text-[9px] font-bold font-mono text-secondary-container mt-0.5">
                      Expires: {formatDate(item.renewalDate)} ({daysLeft}d left)
                    </p>
                  </div>
                </div>
              )
            })}
            {reportsData.upcomingRenewals.length === 0 && (
              <p className="text-xs text-outline text-center py-8">No contracts expiring in the next 60 days.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsAndAnalyticsDashboard
