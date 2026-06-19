function StatusBadge({ status }) {
  const statusConfig = {
    'Active': {
      bg: 'bg-[#E6F4EA]',
      text: 'text-[#137333]',
      border: 'border-transparent',
      dot: 'bg-[#137333]',
    },
    'Expiring Soon': {
      bg: 'bg-[#FEF7E0]',
      text: 'text-[#B06000]',
      border: 'border-transparent',
      dot: 'bg-[#B06000]',
    },
    'Expired': {
      bg: 'bg-[#FCE8E6]',
      text: 'text-[#C5221F]',
      border: 'border-transparent',
      dot: 'bg-[#C5221F]',
      label: 'OVERDUE',
    },
    'Overdue': {
      bg: 'bg-[#FCE8E6]',
      text: 'text-[#C5221F]',
      border: 'border-transparent',
      dot: 'bg-[#C5221F]',
      label: 'OVERDUE',
    },
    'Renewed': {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-transparent',
      dot: 'bg-blue-600',
    },
    'Cancelled': {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-transparent',
      dot: 'bg-gray-500',
    },
  }

  const config = statusConfig[status] || statusConfig['Active']
  const displayLabel = config.label || status

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {displayLabel}
    </span>
  )
}

export default StatusBadge
