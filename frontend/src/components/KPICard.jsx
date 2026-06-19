
function KPICard({ icon: Icon, label, value, delta, deltaType, color = 'primary' }) {
  // Determine color classes for styles
  const iconColors = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    tertiary: 'bg-tertiary/10 text-tertiary',
    error: 'bg-error/10 text-error',
    warning: 'bg-secondary-container/10 text-secondary-container'
  }

  const deltaColors = {
    success: 'text-tertiary bg-tertiary/10',
    warning: 'text-secondary-container bg-secondary-container/10',
    error: 'text-error bg-error/10',
    none: 'text-outline bg-surface-container-low'
  }

  return (
    <div className="flat-card p-5 bg-white flex flex-col justify-between h-36">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-mono tracking-wider font-bold text-outline">
          {label}
        </span>
        <div className={`p-2 rounded-sm ${iconColors[color] || iconColors.primary}`}>
          {Icon && <Icon className="w-4 h-4" />}
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-3xl font-extrabold text-on-surface font-headline leading-none">
          {value}
        </h3>
        
        {delta && (
          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono tracking-wide ${deltaColors[deltaType] || deltaColors.none}`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}

export default KPICard
