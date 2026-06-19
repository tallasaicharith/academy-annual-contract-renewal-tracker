import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  FileText,
  User,
  Loader2
} from 'lucide-react'

const FILTERS = ['All', 'Active', 'Expiring Soon', 'Expired', 'Renewed']
const PER_PAGE = 20

function Contracts() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get('filter') || 'All'
  )
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [statusCounts, setStatusCounts] = useState({})

  useEffect(() => {
    fetchContracts()
  }, [page, activeFilter])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1)
      fetchContracts()
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page)
      params.set('limit', PER_PAGE)
      if (search) params.set('search', search)
      if (activeFilter !== 'All') params.set('status', activeFilter)

      const data = await api.get(`/contracts?${params.toString()}`)

      setContracts(data.data || data.contracts || data || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.total || data.totalContracts || 0)
      
      // Calculate status counts locally from total contracts for precision
      if (data.statusCounts) {
        setStatusCounts(data.statusCounts)
      } else {
        // Fallback calculation
        const counts = { All: data.total || 0 }
        setAllStatusCounts(counts)
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err)
    } finally {
      setLoading(false)
    }
  }

  const setAllStatusCounts = async (initialCounts) => {
    try {
      const allData = await api.get('/contracts?limit=1000')
      const list = allData.data || allData.contracts || allData || []
      const counts = { All: list.length }
      FILTERS.slice(1).forEach(f => {
        counts[f] = list.filter(c => c.status === f).length
      })
      setStatusCounts(counts)
    } catch (e) {
      console.error(e)
    }
  }

  const formatCurrency = (value) => {
    return `₹${(value || 0).toLocaleString('en-IN')}`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  }

  const getDaysLeftColor = (days) => {
    if (days === null) return 'text-gray-400'
    if (days < 0) return 'text-[#C5221F] font-bold'
    if (days <= 30) return 'text-[#C5221F] font-bold'
    if (days <= 90) return 'text-[#B06000] font-bold'
    return 'text-[#137333] font-bold'
  }

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    setPage(1)
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

  const renderPagination = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between mt-6 flex-wrap gap-4 px-6 pb-6 bg-white border-t border-gray-150 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Showing{' '}
          <span className="text-gray-900 font-bold">
            {Math.min((page - 1) * PER_PAGE + 1, totalCount)}
          </span>{' '}
          to{' '}
          <span className="text-gray-900 font-bold">
            {Math.min(page * PER_PAGE, totalCount)}
          </span>{' '}
          of <span className="text-gray-900 font-bold">{totalCount}</span>{' '}
          partnerships
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {start > 1 && (
            <>
              <button
                onClick={() => setPage(1)}
                className="w-9 h-9 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all border border-transparent cursor-pointer"
              >
                1
              </button>
              {start > 2 && (
                <span className="text-gray-400 px-1 text-xs">...</span>
              )}
            </>
          )}
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                p === page
                  ? 'bg-[#0059BB] text-white shadow-md shadow-blue-500/15 border border-transparent'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              {p}
            </button>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && (
                <span className="text-gray-400 px-1 text-xs">...</span>
              )}
              <button
                onClick={() => setPage(totalPages)}
                className="w-9 h-9 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all border border-transparent cursor-pointer"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
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
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-widest uppercase">
          <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate('/dashboard')}>OXYGEN SPORTS</span>
          <span>/</span>
          <span className="text-gray-500">CONTRACT DIRECTORY</span>
        </div>

        {/* Title and Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Partnership Directory
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Review, filter, and audit all active contract specifications.
            </p>
          </div>
          <button
            onClick={() => navigate('/contracts/new')}
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-[#0059BB] hover:bg-[#004493] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/15 transition-all duration-200 cursor-pointer"
          >
            + Add New Contract
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by academy partner, equipment specification, or manager..."
            className="w-full pl-11 pr-4 py-3 rounded-xl neon-input text-gray-900 bg-white border border-gray-200 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter
            const count = statusCounts[filter] || statusCounts[filter === 'All' ? 'All' : filter]
            return (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#0059BB] text-white border-transparent shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {filter}
                {count !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-[#004493] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#0059BB] animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-xs">Loading contract roster...</p>
            </div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white">
            <FileText className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-700 font-bold mb-1">No contracts found</p>
            <p className="text-gray-400 text-xs mb-4">
              {search
                ? 'Try adjusting your search criteria or filter selections'
                : 'Get started by adding your first partnership contract specification.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/contracts/new')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0059BB] hover:bg-[#004493] text-white text-xs font-bold transition-all cursor-pointer"
              >
                + Register Contract
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-wider">
                      Academy Partner
                    </th>
                    <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-wider hidden md:table-cell">
                      Equipment Group
                    </th>
                    <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-wider">
                      Value (₹)
                    </th>
                    <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell">
                      Renewal Date
                    </th>
                    <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-wider hidden lg:table-cell">
                      Timeline
                    </th>
                    <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-wider hidden xl:table-cell">
                      Relationship Mgr
                    </th>
                    <th className="text-left py-4 px-4 text-[10px] font-bold uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right py-4 px-4 text-[10px] font-bold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {contracts.map((contract) => {
                    const daysLeft = getDaysLeft(contract.renewalDate)
                    const avatarColor = getAvatarColor(contract.academyName)
                    const initials = getInitials(contract.academyName)
                    return (
                      <tr
                        key={contract.id || contract._id}
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                      >
                        {/* Academy Partner initials badge & formatted ID */}
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
                        {/* Equipment tag chips */}
                        <td className="py-4 px-4 text-xs text-gray-500 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {contract.equipmentCategories?.split(',').map((cat, idx) => (
                              <span key={idx} className="bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                                {cat.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        {/* Contract Value */}
                        <td className="py-4 px-4 text-sm font-bold text-gray-900">
                          {formatCurrency(contract.contractValue)}
                        </td>
                        {/* Renewal Date */}
                        <td className="py-4 px-4 text-sm text-gray-600 hidden lg:table-cell font-medium">
                          {formatDate(contract.renewalDate)}
                        </td>
                        {/* Days Left badge */}
                        <td className="py-4 px-4 text-sm hidden lg:table-cell">
                          <span className={`font-bold text-xs ${getDaysLeftColor(daysLeft)}`}>
                            {daysLeft !== null
                              ? daysLeft < 0
                                ? `${Math.abs(daysLeft)}d overdue`
                                : `${daysLeft}d`
                              : '-'}
                          </span>
                        </td>
                        {/* Relationship Manager Avatar */}
                        <td className="py-4 px-4 text-sm text-gray-500 hidden xl:table-cell font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-5.5 h-5.5 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="text-gray-700 text-xs font-semibold">
                              {contract.relationshipManager}
                            </span>
                          </div>
                        </td>
                        {/* Status badge */}
                        <td className="py-4 px-4">
                          <StatusBadge status={contract.status} />
                        </td>
                        {/* Action buttons */}
                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/contracts/${contract.id}`)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
                              title="Edit specifications"
                            >
                              <Pencil className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && renderPagination()}
          </>
        )}
      </div>
    </div>
  )
}

export default Contracts
