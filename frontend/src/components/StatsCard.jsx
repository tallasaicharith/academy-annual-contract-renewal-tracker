import { TrendingUp, TrendingDown } from 'lucide-react'

function StatsCard({ icon: Icon, label, value, trend, trendLabel, color = 'blue' }) {
  const iconColorMap = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-emerald-700 bg-emerald-100',
    orange: 'text-orange-700 bg-orange-100',
    red: 'text-red-700 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
  }

  return (
    <div
      className="bg-white border border-[#C1C6D7]/40 rounded-xl p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-extrabold tracking-tight text-gray-900">{value}</p>
          {trend !== undefined ? (
            <div className="flex items-center gap-1 mt-1.5">
              {trend >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-600" />
              )}
              <span
                className={`text-[11px] font-bold ${
                  trend >= 0 ? 'text-[#137333]' : 'text-[#C5221F]'
                }`}
              >
                {trend >= 0 ? '+' : '-'}{Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-[11px] text-gray-500 font-medium">{trendLabel}</span>
              )}
            </div>
          ) : (
            trendLabel && (
              <p className={`text-[11px] font-bold mt-1.5 uppercase tracking-wide ${
                color === 'orange' ? 'text-[#B06000]' : 
                color === 'red' ? 'text-[#C5221F]' : 
                color === 'green' ? 'text-[#137333]' : 'text-gray-500'
              }`}>
                {trendLabel}
              </p>
            )
          )}
        </div>
        <div className={`p-2 rounded-lg ${iconColorMap[color] || iconColorMap.blue}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
    </div>
  )
}

export default StatsCard
