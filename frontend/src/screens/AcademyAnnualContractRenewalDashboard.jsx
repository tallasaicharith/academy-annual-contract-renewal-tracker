import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Timer,
  RefreshCw,
  TrendingUp,
  Download,
  SlidersHorizontal,
  Plus,
  PlusSquare,
  Activity,
  Calendar,
  AlertTriangle,
  History,
  CheckCircle2
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
import { getContracts, getDashboardSummary, updateStatus, getUsers, getCategories } from '../api/api'
import { useAuth } from '../context/AuthContext'
import KPICard from '../components/KPICard'
import DataTable from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS_OPTIONS = ['Draft', 'In Review', 'Active', 'Expiring Soon', 'Overdue', 'Renewed']
const CATEGORY_OPTIONS = ['Cricket', 'Football', 'Tennis', 'Badminton', 'Athletics', 'Swimming', 'Apparel', 'Team Kits', 'Gym Gear']

function AcademyAnnualContractRenewalDashboard({ searchValue }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Data State
  const [summary, setSummary] = useState(null)
  const [contracts, setContracts] = useState([])
  const [managers, setManagers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [managerFilter, setManagerFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('All') // 'All', 'Active', 'Completed', 'Archived'

  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.map(c => c.name || c)))
      .catch(err => console.error(err))
  }, [])
  
  // Dialog State
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    contractId: null,
    nextStatus: null,
    title: '',
    message: ''
  })
  
  // Toast State
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [searchValue, categoryFilter, statusFilter, managerFilter, activeTab, page])

  useEffect(() => {
    if (user?.role === 'admin') {
      getUsers()
        .then(res => {
          setManagers(res.filter(u => u.role === 'employee' && u.isActive === 1))
        })
        .catch(err => console.error(err))
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const summaryData = await getDashboardSummary()
      setSummary(summaryData)

      // Map status pills quick tab filter to standard status queries
      let queryStatus = statusFilter
      if (activeTab === 'Active') {
        queryStatus = 'Active'
      } else if (activeTab === 'Completed') {
        queryStatus = 'Renewed'
      } else if (activeTab === 'Archived') {
        queryStatus = 'Draft' // draft acts as archived for simulation
      }

      const list = await getContracts({
        search: searchValue,
        category: categoryFilter === 'All' ? '' : categoryFilter,
        status: queryStatus === 'All' ? '' : queryStatus,
        manager: managerFilter === 'All' ? '' : managerFilter
      })

      setTotalCount(list.length)
      // Paginate locally
      const limit = 20
      const start = (page - 1) * limit
      const paginated = list.slice(start, start + limit)
      setContracts(paginated)

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Handles clicking on status badge in table -> triggers confirmation
  const handleStatusBadgeClick = (contractId, currentStatus) => {
    // Cycles statuses for simulation: Active -> Expiring Soon -> Overdue -> Renewed -> Active
    const nextMap = {
      'Draft': 'In Review',
      'In Review': 'Active',
      'Active': 'Expiring Soon',
      'Expiring Soon': 'Overdue',
      'Overdue': 'Renewed',
      'Renewed': 'Active'
    }
    
    const nextStatus = nextMap[currentStatus] || 'Active'

    setDialogConfig({
      isOpen: true,
      contractId,
      nextStatus,
      title: 'Modify Contract Status?',
      message: `Are you sure you want to change this contract status to "${nextStatus}"? This event will be logged in the system audit trail.`
    })
  }

  const confirmStatusChange = async () => {
    try {
      await updateStatus(dialogConfig.contractId, dialogConfig.nextStatus)
      showToast(`Contract status changed to ${dialogConfig.nextStatus}`)
      setDialogConfig(prev => ({ ...prev, isOpen: false }))
      fetchDashboardData()
    } catch (e) {
      console.error(e)
    }
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleExportCSV = () => {
    const headers = ['Contract ID', 'Academy Name', 'Equipment Categories', 'Renewal Date', 'Contract Value (INR, ₹)', 'Price Revision (%)', 'Relationship Manager', 'Status']
    const rows = contracts.map(c => [
      c.id,
      c.academyName,
      c.equipmentCategories.join('; '),
      c.renewalDate,
      c.contractValue,
      c.priceRevision,
      c.relationshipManager,
      c.status
    ])
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `OxygenSports_Contracts_Export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast("CSV file exported successfully")
  }

  // Setup Projected monthly value chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonthIdx = new Date().getMonth()
  const mockMonthlyData = []
  let maxVal = 0
  for (let i = 0; i < 12; i++) {
    const idx = (currentMonthIdx + i) % 12
    const name = months[idx]
    // Generate some interesting curves
    const value = (120000 + Math.sin(i / 1.5) * 80000 + (i === 4 ? 140000 : 0))
    if (value > maxVal) maxVal = value
    mockMonthlyData.push({ month: name, value })
  }

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Toast Warning */}
      {toastMessage && (
        <div className="toast toast-success shadow-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText="Yes, Update"
        onConfirm={confirmStatusChange}
        onCancel={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-outline tracking-widest uppercase font-mono">
            <span>Oxygen Sports</span>
            <span>/</span>
            <span className="text-on-surface-variant font-extrabold">Dashboard Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight font-headline">
            Annual Contract Tracker
          </h1>
          <p className="text-on-surface-variant text-xs font-medium">
            Proactive renewal engine to prevent contract leakage.
          </p>
        </div>

        {/* New Contract Button */}
        <button
          onClick={() => navigate('/contracts/new')}
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <PlusSquare className="w-4 h-4" />
          New Contract
        </button>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          icon={FileText}
          label="Total Active Contracts"
          value={summary ? summary.totalActive : '-'}
          delta="+4.2% vs last month"
          deltaType="success"
          color="primary"
        />
        <KPICard
          icon={Timer}
          label="Expiring in 30 Days"
          value={summary ? summary.expiringSoon : '-'}
          delta="Critical Attention"
          deltaType="warning"
          color="warning"
        />
        <KPICard
          icon={RefreshCw}
          label="Recent Renewals"
          value={summary ? summary.totalActive : '-'} // mock active renewals
          delta="On Track"
          deltaType="success"
          color="tertiary"
        />
        <KPICard
          icon={TrendingUp}
          label="Avg Price Revision"
          value={summary ? `${summary.avgPriceRevision}%` : '-'}
          color="secondary"
        />
      </div>

      {/* Filters and Search toolbar */}
      <div className="flat-card p-4 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Quick Filter Status Pills */}
        <div className="flex items-center gap-1 border border-outline-variant p-1 rounded-sm bg-surface-container-low w-fit">
          {['All', 'Active', 'Completed', 'Archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1) }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-on-surface border-b border-outline-variant font-extrabold shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
            className="flat-input px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface bg-white cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="flat-input px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface bg-white cursor-pointer"
            disabled={activeTab !== 'All'} // Disabled when quick tab filters are active
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {user?.role === 'admin' && (
            <select
              value={managerFilter}
              onChange={(e) => { setManagerFilter(e.target.value); setPage(1) }}
              className="flat-input px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface bg-white cursor-pointer"
            >
              <option value="All">All Managers</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}

          {/* Export Action */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface bg-white border border-outline-variant rounded-sm hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-outline" />
            CSV Export
          </button>
        </div>
      </div>

      {/* Main Table section */}
      <div className="flat-card p-6 bg-white space-y-4">
        <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-outline">
          Academy Renewal Schedule ({totalCount})
        </h3>
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            contracts={contracts}
            onStatusClick={handleStatusBadgeClick}
            onEdit={(id) => navigate(`/contracts/${id}/edit`)}
            onView={(id) => navigate(`/academies/${id}`)}
            page={page}
            totalPages={Math.ceil(totalCount / 20)}
            totalCount={totalCount}
            onPageChange={setPage}
            limit={20}
          />
        )}
      </div>

      {/* Bottom Analytics block (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Projected Value Chart */}
        <div className="flat-card p-6 bg-white space-y-5 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-outline">
              Projected Renewal Value
            </h3>
            <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold font-mono tracking-wide text-secondary bg-secondary/10 uppercase">
              12-Month Forecast
            </span>
          </div>

          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" />
                <XAxis dataKey="month" tickLine={false} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <YAxis tickLine={false} tickFormatter={(val) => `₹${val/1000}K`} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Projected Renewal']} contentStyle={{ fontSize: '11px', borderRadius: '4px', fontFamily: 'var(--font-body)' }} />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {mockMonthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value === maxVal ? 'var(--color-secondary)' : 'var(--color-primary)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column: Recent activities Feed */}
        <div className="flat-card p-6 bg-white space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-outline">
              System Audit Stream
            </h3>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#0059bb] hover:underline cursor-pointer flex items-center gap-1">
              <History className="w-3.5 h-3.5" /> View All Activities
            </span>
          </div>

          <div className="space-y-4">
            {summary?.recentActivities.map((act) => {
              const dateText = new Date(act.createdAt).toLocaleString('en-IN', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })

              return (
                <div key={act.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-sm bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0 border border-outline-variant">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-on-surface">
                      <span className="font-bold">{act.changedBy}</span> {act.description}
                    </p>
                    <p className="text-[10px] text-outline font-medium font-mono uppercase tracking-wide">
                      {dateText}
                    </p>
                  </div>
                </div>
              )
            })}
            {(!summary || summary.recentActivities.length === 0) && (
              <p className="text-xs text-outline text-center py-4">No recent activities logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile Screens */}
      <button
        onClick={() => navigate('/contracts/new')}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-secondary hover:bg-secondary/95 text-white flex items-center justify-center shadow-lg cursor-pointer z-40 transition-transform active:scale-95"
        aria-label="Add new contract"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}

export default AcademyAnnualContractRenewalDashboard
