function StatusBadge({ status, onClick }) {
  const statusConfig = {
    'Active': {
      bg: 'bg-[#e6f5f4] text-[#00666d]',
      dot: 'bg-[#00666d]'
    },
    'Renewed': {
      bg: 'bg-blue-50 text-blue-700',
      dot: 'bg-blue-600'
    },
    'Expiring Soon': {
      bg: 'bg-[#fef7e0] text-[#ab3600]',
      dot: 'bg-[#ab3600]'
    },
    'Overdue': {
      bg: 'bg-[#ffdad6] text-[#ba1a1a]',
      dot: 'bg-[#ba1a1a]'
    },
    'Expired': {
      bg: 'bg-[#ffdad6] text-[#ba1a1a]',
      dot: 'bg-[#ba1a1a]',
      label: 'OVERDUE'
    },
    'In Review': {
      bg: 'bg-[#fef3c7] text-[#b45309]',
      dot: 'bg-[#b45309]'
    },
    'Draft': {
      bg: 'bg-[#eeeef0] text-[#414754]',
      dot: 'bg-[#717786]'
    }
  }

  const config = statusConfig[status] || {
    bg: 'bg-[#eeeef0] text-[#414754]',
    dot: 'bg-[#717786]'
  }
  
  const displayLabel = config.label || status

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm status-label ${config.bg} ${
        onClick ? 'cursor-pointer hover:opacity-90' : ''
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {displayLabel}
    </span>
  )
}

export default StatusBadge
