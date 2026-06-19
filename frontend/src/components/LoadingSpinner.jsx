import { Loader2 } from 'lucide-react'

function LoadingSpinner({ message = 'Loading system records...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
      <p className="text-xs text-outline font-medium tracking-wide uppercase font-mono">
        {message}
      </p>
    </div>
  )
}

export default LoadingSpinner
