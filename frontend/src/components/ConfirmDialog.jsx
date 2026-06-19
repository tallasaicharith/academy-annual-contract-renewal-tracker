import { AlertTriangle, X } from 'lucide-react'

function ConfirmDialog({ 
  isOpen, 
  title = 'Are you sure?', 
  message = 'Do you want to perform this action?', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel,
  severity = 'warning' // 'warning', 'info', 'error'
}) {
  if (!isOpen) return null

  const themeColors = {
    warning: {
      icon: 'text-secondary bg-secondary/10',
      btn: 'bg-secondary hover:bg-secondary/95 text-white',
    },
    error: {
      icon: 'text-error bg-error/10',
      btn: 'bg-error hover:bg-error/95 text-white',
    },
    info: {
      icon: 'text-primary bg-primary/10',
      btn: 'bg-primary hover:bg-primary/95 text-white',
    }
  }

  const activeColor = themeColors[severity] || themeColors.warning

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs transition-opacity" 
        onClick={onCancel}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white border border-outline-variant rounded-lg p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.05)] animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-sm hover:bg-surface-container text-outline hover:text-on-surface transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon and Title */}
        <div className="flex gap-4">
          <div className={`w-10 h-10 shrink-0 rounded-sm flex items-center justify-center ${activeColor.icon}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-on-surface font-headline leading-snug">
              {title}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-outline-variant hover:bg-surface-container-low text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer text-on-surface-variant"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer ${activeColor.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
