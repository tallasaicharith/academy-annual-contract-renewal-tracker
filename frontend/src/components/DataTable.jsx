import StatusBadge from './StatusBadge'
import { Eye, Pencil } from 'lucide-react'

function DataTable({ 
  contracts = [], 
  onStatusClick, 
  onEdit, 
  onView,
  page,
  totalPages,
  totalCount,
  onPageChange,
  limit = 20
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const startIdx = (page - 1) * limit + 1
  const endIdx = Math.min(page * limit, totalCount)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-outline-variant rounded-lg">
        <table className="w-full border-collapse text-left bg-white text-xs sm:text-sm text-on-surface">
          <thead className="bg-surface-container-low text-[10px] font-bold uppercase font-mono tracking-wider text-outline border-b border-outline-variant">
            <tr>
              <th className="py-3 px-4">Academy Name</th>
              <th className="py-3 px-4">Equipment Categories</th>
              <th className="py-3 px-4">Renewal Date</th>
              <th className="py-3 px-4">Price Revision</th>
              <th className="py-3 px-4">Relationship Manager</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {contracts.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-outline text-xs">
                  No contracts found matching your filters.
                </td>
              </tr>
            ) : (
              contracts.map((c) => (
                <tr 
                  key={c.id} 
                  className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                  onClick={() => onView && onView(c.id)}
                >
                  {/* Academy Name */}
                  <td className="py-3.5 px-4 font-bold text-on-surface">
                    <div>{c.academyName}</div>
                    <div className="text-[10px] font-mono tracking-wide font-normal text-outline mt-0.5 uppercase">
                      ID: {c.id}
                    </div>
                  </td>
                  
                  {/* Equipment Categories */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {c.equipmentCategories?.map((cat, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-surface-container text-[10px] font-medium rounded-sm border border-outline-variant text-on-surface-variant">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  
                  {/* Renewal Date */}
                  <td className="py-3.5 px-4 font-mono text-on-surface-variant font-medium">
                    {formatDate(c.renewalDate)}
                  </td>
                  
                  {/* Price Revision */}
                  <td className={`py-3.5 px-4 font-bold font-mono ${
                    (c.priceRevision || 0) > 0 ? 'text-[#00666d]' : 'text-on-surface-variant'
                  }`}>
                    {c.priceRevision > 0 ? `+${c.priceRevision}%` : `${c.priceRevision}%`}
                  </td>
                  
                  {/* Manager */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5.5 h-5.5 rounded-full bg-[#0059bb]/10 flex items-center justify-center text-[10px] font-bold text-primary border border-outline-variant uppercase">
                        {c.relationshipManager ? c.relationshipManager.split(' ').map(n=>n[0]).join('') : 'RM'}
                      </div>
                      <span className="font-medium text-on-surface-variant">
                        {c.relationshipManager || '-'}
                      </span>
                    </div>
                  </td>
                  
                  {/* Status Badges */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge 
                      status={c.status} 
                      onClick={() => onStatusClick && onStatusClick(c.id, c.status)} 
                    />
                  </td>
                  
                  {/* Actions Column */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => onView && onView(c.id)}
                        className="p-1 hover:bg-surface-container rounded-sm text-outline hover:text-primary transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit && onEdit(c.id)}
                        className="p-1 hover:bg-surface-container rounded-sm text-outline hover:text-secondary transition-colors cursor-pointer"
                        title="Edit Contract"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination row */}
      {contracts.length > 0 && onPageChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant font-medium">
          <div>
            Showing <span className="font-bold text-on-surface">{startIdx}</span> to{' '}
            <span className="font-bold text-on-surface">{endIdx}</span> of{' '}
            <span className="font-bold text-on-surface">{totalCount}</span> contracts
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => page > 1 && onPageChange(page - 1)}
              disabled={page === 1}
              className="px-2.5 py-1.5 border border-outline-variant hover:bg-surface-container-low disabled:bg-surface-container-low disabled:text-outline rounded-sm transition-colors cursor-pointer"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`px-3 py-1.5 border rounded-sm transition-all cursor-pointer ${
                    page === p
                      ? 'bg-primary text-white border-transparent font-bold'
                      : 'border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  {p}
                </button>
              )
            })}

            <button
              onClick={() => page < totalPages && onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 border border-outline-variant hover:bg-surface-container-low disabled:bg-surface-container-low disabled:text-outline rounded-sm transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
