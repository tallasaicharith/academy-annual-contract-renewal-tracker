import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { KeyRound, Mail, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.')
      return
    }

    setSubmitting(true)
    try {
      const loggedUser = await login(email, password)
      if (loggedUser.role === 'admin') {
        navigate('/dashboard')
      } else {
        navigate('/my-contracts')
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#111315] flex items-center justify-center p-4">
      {/* Background visual blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-secondary/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] bg-[#1a1c1e] border border-outline/10 p-8 rounded-sm shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Oxygen Sports" className="h-28 w-auto mb-4" />
          <div className="text-center">
            <span className="text-[10px] font-mono tracking-[0.2em] font-bold text-outline uppercase">
              Contract Renewal Monitoring
            </span>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-4 bg-[#ba1a1a]/15 border border-[#ba1a1a]/30 rounded-sm flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-[#ffb4ab] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Authentication Alert</h4>
              <p className="text-xs text-[#ffb4ab]/90 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider block font-mono">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full pl-10 pr-4 py-2.5 bg-[#111315] border border-outline/20 text-white rounded-sm text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider block font-mono">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-[#111315] border border-outline/20 text-white rounded-sm text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#ab3600] hover:bg-[#c44000] active:bg-[#ab3600] text-white py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all duration-150 shadow-lg shadow-[#ab3600]/10 flex items-center justify-center gap-2 cursor-pointer mt-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={submitting}
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Info footer */}
        <div className="mt-8 border-t border-outline/5 pt-6 text-center">
          <p className="text-[10px] text-outline leading-relaxed font-sans">
            Use configured administrator credentials to access the secure tracking dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
