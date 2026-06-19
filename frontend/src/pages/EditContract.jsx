import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import { Save, ArrowLeft, X, CheckCircle, Loader2 } from 'lucide-react'

const STATUS_OPTIONS = ['Active', 'Expiring Soon', 'Expired', 'Renewed', 'Cancelled']

function EditContract() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    academyName: '',
    equipmentCategories: '',
    contractValue: '',
    priceRevision: '0',
    relationshipManager: '',
    contractStartDate: '',
    renewalDate: '',
    status: 'Active',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchContract()
  }, [id])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const data = await api.get(`/contracts/${id}`)
      const contract = data.data || data.contract || data

      setFormData({
        academyName: contract.academyName || '',
        equipmentCategories: contract.equipmentCategories || '',
        contractValue: contract.contractValue?.toString() || '',
        priceRevision: contract.priceRevision?.toString() || '0',
        relationshipManager: contract.relationshipManager || '',
        contractStartDate: contract.contractStartDate
          ? contract.contractStartDate.split('T')[0]
          : '',
        renewalDate: contract.renewalDate
          ? contract.renewalDate.split('T')[0]
          : '',
        status: contract.status || 'Active',
        notes: contract.notes || '',
      })
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load contract data' })
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.academyName.trim()) {
      newErrors.academyName = 'Academy partner name is required'
    }
    if (!formData.equipmentCategories.trim()) {
      newErrors.equipmentCategories = 'Equipment categories are required'
    }
    if (!formData.contractValue || parseFloat(formData.contractValue) < 0) {
      newErrors.contractValue = 'Contract value must be a positive number'
    }
    if (!formData.contractValue) {
      newErrors.contractValue = 'Contract value is required'
    }
    if (!formData.relationshipManager.trim()) {
      newErrors.relationshipManager = 'Relationship manager is required'
    }
    if (!formData.contractStartDate) {
      newErrors.contractStartDate = 'Start date is required'
    }
    if (!formData.renewalDate) {
      newErrors.renewalDate = 'Renewal date is required'
    }
    if (
      formData.contractStartDate &&
      formData.renewalDate &&
      new Date(formData.renewalDate) <= new Date(formData.contractStartDate)
    ) {
      newErrors.renewalDate = 'Renewal date must be after the start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      await api.put(`/contracts/${id}`, {
        ...formData,
        contractValue: parseFloat(formData.contractValue),
        priceRevision: parseFloat(formData.priceRevision) || 0,
      })
      setToast({ type: 'success', message: 'Contract updated successfully!' })
      setTimeout(() => navigate(`/contracts/${id}`), 1500)
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to update contract',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#127464] animate-spin mx-auto mb-3" />
          <p className="text-[#717786] text-sm">Loading contract specifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
          onClick={() => setToast(null)}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#717786] tracking-widest uppercase">
        <span className="cursor-pointer hover:text-[#1A1C1E]" onClick={() => navigate('/dashboard')}>OXYGEN SPORTS</span>
        <span>/</span>
        <span className="cursor-pointer hover:text-[#1A1C1E]" onClick={() => navigate('/contracts')}>CONTRACT DIRECTORY</span>
        <span>/</span>
        <span className="cursor-pointer hover:text-[#1A1C1E]" onClick={() => navigate(`/contracts/${id}`)}>{formData.academyName}</span>
        <span>/</span>
        <span className="text-[#1A1C1E]">EDIT SPECIFICATIONS</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-[rgba(193,198,215,0.6)] bg-white hover:bg-[#F3F3F6] text-[#414754] hover:text-[#1A1C1E] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1E] tracking-tight">Edit Contract Specifications</h1>
          <p className="text-[#717786] text-sm mt-0.5">
            Modify details and values for partner: {formData.academyName}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Academy Name */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-[#717786] mb-1.5 uppercase tracking-wider">
              Academy Name <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              name="academyName"
              value={formData.academyName}
              onChange={handleChange}
              placeholder="e.g. Star Cricket Academy"
              className={`w-full px-4 py-3 rounded-xl neon-input text-[#1A1C1E] text-xs ${
                errors.academyName ? 'border-red-500' : ''
              }`}
            />
            {errors.academyName && (
              <p className="text-red-600 text-[10px] font-semibold mt-1.5">{errors.academyName}</p>
            )}
          </div>

          {/* Equipment Categories */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-[#717786] mb-1.5 uppercase tracking-wider">
              Equipment Categories <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              name="equipmentCategories"
              value={formData.equipmentCategories}
              onChange={handleChange}
              placeholder="Cricket Bats, Pads, Helmets, Soccer balls"
              className={`w-full px-4 py-3 rounded-xl neon-input text-[#1A1C1E] text-xs ${
                errors.equipmentCategories ? 'border-red-500' : ''
              }`}
            />
            {errors.equipmentCategories && (
              <p className="text-red-600 text-[10px] font-semibold mt-1.5">
                {errors.equipmentCategories}
              </p>
            )}
          </div>

          {/* Contract Value */}
          <div>
            <label className="block text-[10px] font-bold text-[#717786] mb-1.5 uppercase tracking-wider">
              Contract Value <span className="text-red-500 font-bold">*</span>
            </label>
            <div className={`relative flex rounded-xl bg-white border focus-within:ring-2 focus-within:ring-[#0059BB]/15 focus-within:border-[#0059BB] transition-all ${
              errors.contractValue ? 'border-red-500' : 'border-[rgba(193,198,215,0.8)]'
            }`}>
              <span className="inline-flex items-center px-4 rounded-l-xl border-r border-[rgba(193,198,215,0.8)] bg-[#F3F3F6] text-[#717786] font-bold text-xs">
                ₹
              </span>
              <input
                type="number"
                name="contractValue"
                value={formData.contractValue}
                onChange={handleChange}
                placeholder="500000"
                min="0"
                className="w-full px-4 py-3 bg-transparent text-[#1A1C1E] text-xs placeholder:text-[#717786] focus:outline-none"
              />
            </div>
            {errors.contractValue && (
              <p className="text-red-600 text-[10px] font-semibold mt-1.5">
                {errors.contractValue}
              </p>
            )}
          </div>

          {/* Price Revision */}
          <div>
            <label className="block text-[10px] font-bold text-[#717786] mb-1.5 uppercase tracking-wider">
              Price Revision %
            </label>
            <input
              type="number"
              name="priceRevision"
              value={formData.priceRevision}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl neon-input text-[#1A1C1E] text-xs"
            />
          </div>

          {/* Relationship Manager */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-[#717786] mb-1.5 uppercase tracking-wider">
              Relationship Manager <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              name="relationshipManager"
              value={formData.relationshipManager}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className={`w-full px-4 py-3 rounded-xl neon-input text-[#1A1C1E] text-xs ${
                errors.relationshipManager ? 'border-red-500' : ''
              }`}
            />
            {errors.relationshipManager && (
              <p className="text-red-600 text-[10px] font-semibold mt-1.5">
                {errors.relationshipManager}
              </p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold text-[#717786] mb-1.5 uppercase tracking-wider">
              Contract Start Date <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="date"
              name="contractStartDate"
              value={formData.contractStartDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl neon-input text-[#1A1C1E] text-xs ${
                errors.contractStartDate ? 'border-red-500' : ''
              }`}
            />
            {errors.contractStartDate && (
              <p className="text-red-600 text-[10px] font-semibold mt-1.5">
                {errors.contractStartDate}
              </p>
            )}
          </div>

          {/* Renewal Date */}
          <div>
            <label className="block text-[10px] font-bold text-[#717786] mb-1.5 uppercase tracking-wider">
              Renewal Date <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="date"
              name="renewalDate"
              value={formData.renewalDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl neon-input text-[#1A1C1E] text-xs ${
                errors.renewalDate ? 'border-red-500' : ''
              }`}
            />
            {errors.renewalDate && (
              <p className="text-red-600 text-[10px] font-semibold mt-1.5">
                {errors.renewalDate}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-[#717786] mb-1.5 uppercase tracking-wider">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl neon-input text-[#1A1C1E] text-xs bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-[#717786] mb-1.5 uppercase tracking-wider">
              Notes / Special Terms
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Any additional notes about this contract..."
              className="w-full px-4 py-3 rounded-xl neon-input text-[#1A1C1E] text-xs resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-[rgba(193,198,215,0.4)]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-[rgba(193,198,215,0.8)] text-[#414754] hover:bg-[#F3F3F6] hover:text-[#1A1C1E] text-xs font-bold uppercase tracking-wider transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0C4F44] hover:bg-[#08372F] text-white text-xs font-bold uppercase tracking-wider border border-[#0C4F44] shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Specifications
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditContract
