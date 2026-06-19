import { FileText } from 'lucide-react'

function EmptyState({ 
  icon: Icon = FileText, 
  title = 'No records found', 
  message = 'Try modifying your search query or filters to find results.' 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-outline-variant bg-white/50 rounded-lg">
      <div className="w-12 h-12 rounded-sm bg-surface-container flex items-center justify-center text-outline mb-4">
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-bold text-on-surface font-headline uppercase tracking-wider mb-1">
        {title}
      </h3>
      <p className="text-xs text-outline max-w-sm leading-relaxed">
        {message}
      </p>
    </div>
  )
}

export default EmptyState
