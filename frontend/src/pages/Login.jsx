import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Loader2 } from 'lucide-react'

function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')

  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const newErrors = {}
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    if (!isLogin && !formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isLogin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return

    setLoading(true)
    try {
      if (isLogin) {
        await login(formData.username, formData.password)
      } else {
        await signup(formData.username, formData.email, formData.password)
      }
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0C4F44]/10 blur-3xl"></div>
      <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-emerald-600/5 blur-2xl"></div>

      {/* Login card */}
      <div className="w-full max-w-md relative animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/oxygen-logo.svg"
            alt="Oxygen Sports Logo"
            className="h-12 object-contain mb-4"
          />
        </div>

        {/* Card */}
        <div className="bg-[#112240] border border-[#1E3A5F]/50 rounded-2xl p-8 shadow-2xl shadow-black/30">
          {/* Tabs */}
          <div className="flex rounded-xl bg-[#0A192F] p-1 mb-6 border border-[#1E3A5F]/40">
            <button
              onClick={() => {
                setIsLogin(true)
                setErrors({})
                setApiError('')
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isLogin
                  ? 'bg-[#0C4F44] text-white shadow-lg shadow-[#0C4F44]/25 border border-[#127464]/30'
                  : 'text-[#8892B0] hover:text-white border border-transparent'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false)
                setErrors({})
                setApiError('')
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                !isLogin
                  ? 'bg-[#0C4F44] text-white shadow-lg shadow-[#0C4F44]/25 border border-[#127464]/30'
                  : 'text-[#8892B0] hover:text-white border border-transparent'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold animate-fadeIn">
              {apiError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[10px] font-bold text-[#8892B0] mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6580]" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A192F] border text-white text-xs placeholder:text-[#5A6580] focus:outline-none focus:border-[#127464] focus:ring-2 focus:ring-[#127464]/20 transition-all ${
                    errors.username ? 'border-red-500/50' : 'border-[#1E3A5F]/60'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-red-400 text-[10px] font-semibold mt-1.5">{errors.username}</p>
              )}
            </div>

            {/* Email (signup only) */}
            {!isLogin && (
              <div className="animate-fadeIn">
                <label className="block text-[10px] font-bold text-[#8892B0] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6580]" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#0A192F] border text-white text-xs placeholder:text-[#5A6580] focus:outline-none focus:border-[#127464] focus:ring-2 focus:ring-[#127464]/20 transition-all ${
                      errors.email ? 'border-red-500/50' : 'border-[#1E3A5F]/60'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-[10px] font-semibold mt-1.5">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-[#8892B0] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6580]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl bg-[#0A192F] border text-white text-xs placeholder:text-[#5A6580] focus:outline-none focus:border-[#127464] focus:ring-2 focus:ring-[#127464]/20 transition-all ${
                    errors.password ? 'border-red-500/50' : 'border-[#1E3A5F]/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6580] hover:text-[#8892B0] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-[10px] font-semibold mt-1.5">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0C4F44] to-[#127464] hover:from-[#08372F] hover:to-[#0C4F44] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#0C4F44]/25 border border-[#127464]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[#5A6580] text-[10px] font-bold mt-6 tracking-wide">
          &bull; BELIEVE IT, ACHIEVE IT &bull;
        </p>
      </div>
    </div>
  )
}

export default Login
