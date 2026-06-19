import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  Percent, 
  FileText, 
  Loader2,
  Trash2,
  Sparkles
} from 'lucide-react'
import { getContractById, createContract, updateContract } from '../api/api'
import { mockManagers } from '../mock/managers.mock'
import Chip from '../components/Chip'

const CATEGORY_OPTIONS = [
  'Cricket', 'Football', 'Tennis', 'Badminton', 'Athletics', 
  'Swimming', 'Apparel', 'Footwear', 'Gym Gear', 'Team Kits', 'Nutrition'
]

const STATUS_OPTIONS = ['Draft', 'In Review', 'Active', 'Expiring Soon', 'Overdue']

function AcademyAnnualContractRenewalEntryForm({ mode = 'create' }) {
  const navigate = useNavigate()
  const { id } = useParams()
  
  // States
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  
  const [formData, setFormData] = useState({
    academyName: '',
    equipmentCategories: [],
    contractStartDate: '',
    renewalDate: '',
    contractValue: '',
    priceRevision: '',
    relationshipManager: '',
    status: 'Draft',
    notes: '',
    documentName: ''
  })

  // Pre-load data for Edit Mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      loadContractData()
    }
  }, [mode, id])

  const loadContractData = async () => {
    try {
      setLoading(true)
      const data = await getContractById(id)
      const c = data.contract
      setFormData({
        academyName: c.academyName || '',
        equipmentCategories: c.equipmentCategories || [],
        contractStartDate: c.contractStartDate || '',
        renewalDate: c.renewalDate || '',
        contractValue: c.contractValue || '',
        priceRevision: c.priceRevision || '',
        relationshipManager: c.relationshipManager || '',
        status: c.status || 'Draft',
        notes: c.notes || '',
        documentName: c.documentName || ''
      })
    } catch (e) {
      console.error(e)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Handle standard input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clean error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle manager selection
  const handleManagerSelect = (name) => {
    setFormData(prev => ({ ...prev, relationshipManager: name }))
    if (errors.relationshipManager) {
      setErrors(prev => ({ ...prev, relationshipManager: '' }))
    }
  }

  // Handle file input mock
  const handleFileAttach = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, documentName: file.name }))
    }
  }

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, documentName: '' }))
  }

  // Live price revision preview calculations
  const getLivePreview = () => {
    const val = parseFloat(formData.contractValue)
    const rev = parseFloat(formData.priceRevision)
    if (isNaN(val) || val <= 0) return null
    
    const revisionPercent = isNaN(rev) ? 0 : rev
    const revisedVal = val * (1 + revisionPercent / 100)
    
    const format = (v) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(v)

    return {
      original: format(val),
      revised: format(revisedVal),
      percentText: revisionPercent >= 0 ? `+${revisionPercent}%` : `${revisionPercent}%`
    }
  }

  const preview = getLivePreview()

  // Validator
  const validateForm = () => {
    const err = {}
    if (!formData.academyName.trim()) err.academyName = 'Academy name is required.'
    if (!formData.renewalDate) err.renewalDate = 'Renewal date is required.'
    
    // Date order validation
    if (formData.contractStartDate && formData.renewalDate) {
      const start = new Date(formData.contractStartDate)
      const end = new Date(formData.renewalDate)
      if (end <= start) {
        err.renewalDate = 'Renewal date must be after the contract start date.'
      }
    }

    if (formData.contractValue && parseFloat(formData.contractValue) < 0) {
      err.contractValue = 'Contract value must be positive.'
    }

    if (!formData.relationshipManager) err.relationshipManager = 'Relationship manager is required.'
    
    setErrors(err)
    return Object.keys(err).length === 0
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    try {
      setSaving(true)
      if (mode === 'edit') {
        await updateContract(id, formData)
      } else {
        await createContract(formData)
      }
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Header breadcrumb & back button */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider font-mono cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
        
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">
          {mode === 'edit' ? `Edit Contract Renewal Details` : 'Register New Contract Entry'}
        </h1>
        <p className="text-on-surface-variant text-xs font-medium">
          Ensure all required fields are validated before submission.
        </p>
      </div>

      {/* Main Entry Card */}
      <form onSubmit={handleSubmit} className="flat-card p-6 sm:p-8 bg-white space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Academy Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Academy Name <span className="text-error font-sans font-bold">*</span>
            </label>
            <input
              type="text"
              name="academyName"
              value={formData.academyName}
              onChange={handleChange}
              placeholder="e.g. Pinnacle Athletics"
              className={`flat-input w-full px-3.5 py-2 ${
                errors.academyName ? 'border-error ring-1 ring-error/25' : 'border-outline-variant'
              }`}
            />
            {errors.academyName && (
              <p className="text-xs text-error font-medium">{errors.academyName}</p>
            )}
          </div>

          {/* Academy ID (Read-only) */}
          <div>
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Academy ID
            </label>
            <input
              type="text"
              value={mode === 'edit' ? id : 'OX-XXXX (Auto-generated)'}
              disabled
              className="flat-input w-full px-3.5 py-2 bg-surface-container-low text-outline cursor-not-allowed font-mono"
            />
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Contract Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="flat-input w-full px-3 py-2 cursor-pointer"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Contract Start Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Contract Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="date"
                name="contractStartDate"
                value={formData.contractStartDate}
                onChange={handleChange}
                className="flat-input w-full pl-10 pr-3.5 py-2"
              />
            </div>
          </div>

          {/* Renewal Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Renewal Date <span className="text-error font-sans font-bold">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="date"
                name="renewalDate"
                value={formData.renewalDate}
                onChange={handleChange}
                className={`flat-input w-full pl-10 pr-3.5 py-2 ${
                  errors.renewalDate ? 'border-error ring-1 ring-error/25' : 'border-outline-variant'
                }`}
              />
            </div>
            {errors.renewalDate && (
              <p className="text-xs text-error font-medium">{errors.renewalDate}</p>
            )}
          </div>

          {/* Contract Value */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Contract Value (USD, $)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="number"
                name="contractValue"
                value={formData.contractValue}
                onChange={handleChange}
                placeholder="0"
                className={`flat-input w-full pl-10 pr-3.5 py-2 ${
                  errors.contractValue ? 'border-error ring-1 ring-error/25' : 'border-outline-variant'
                }`}
                min="0"
              />
            </div>
            {errors.contractValue && (
              <p className="text-xs text-error font-medium">{errors.contractValue}</p>
            )}
          </div>

          {/* Price Revision % */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Price Revision Rate (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="number"
                name="priceRevision"
                value={formData.priceRevision}
                onChange={handleChange}
                placeholder="0.0"
                step="0.1"
                className="flat-input w-full pl-10 pr-3.5 py-2"
              />
            </div>
          </div>

          {/* Live Price Revision Preview Chip */}
          {preview && (
            <div className="md:col-span-2 p-3 bg-tertiary/5 border border-tertiary/20 rounded-[4px] text-xs flex items-center gap-2 text-tertiary animate-fadeIn">
              <Sparkles className="w-4 h-4 shrink-0 text-tertiary-light animate-pulse" />
              <span className="font-medium">
                Live Price Forecast Preview:{' '}
                <span className="font-bold text-on-surface">{preview.original}</span>
                {' '}→{' '}
                <span className="font-extrabold text-primary">{preview.revised}</span>
                {' '}
                <span className="font-bold font-mono text-[10px] uppercase bg-tertiary/10 px-1 py-0.5 rounded-sm">
                  {preview.percentText} Revision
                </span>
              </span>
            </div>
          )}

          {/* Relationship Manager Selection */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Assigned Relationship Manager <span className="text-error font-sans font-bold">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mockManagers.map((mgr) => {
                const isSelected = formData.relationshipManager === mgr.name
                return (
                  <button
                    key={mgr.id}
                    type="button"
                    onClick={() => handleManagerSelect(mgr.name)}
                    className={`p-3 border rounded-sm flex items-center gap-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    <img
                      src={mgr.avatar}
                      alt={mgr.name}
                      className="w-8 h-8 rounded-full border border-outline-variant object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold">{mgr.name}</p>
                      <p className="text-[9px] uppercase font-mono tracking-wide text-outline">{mgr.title}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {errors.relationshipManager && (
              <p className="text-xs text-error font-medium">{errors.relationshipManager}</p>
            )}
          </div>

          {/* Equipment Categories (Multi-select Chip) */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Equipment Supply Categories
            </label>
            <Chip
              selected={formData.equipmentCategories}
              options={CATEGORY_OPTIONS}
              onChange={(updated) => setFormData(prev => ({ ...prev, equipmentCategories: updated }))}
            />
          </div>

          {/* Notes description */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Renewal Negotiation Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Discussing bundle discounts for football uniforms. Price revision is pending executive review."
              className="flat-input w-full px-3.5 py-2 h-28 resize-none"
            />
          </div>

          {/* Contract Document upload mock */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
              Master Service Agreement (MSA) Document Attachment
            </label>
            
            {formData.documentName ? (
              <div className="inline-flex items-center gap-2 p-2 bg-surface-container-low border border-outline-variant rounded-sm text-xs font-bold text-on-surface">
                <FileText className="w-4 h-4 text-outline" />
                <span className="font-mono">{formData.documentName}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 hover:bg-surface-container text-outline hover:text-error transition-colors rounded-sm cursor-pointer"
                  title="Remove document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  id="msa-file-upload"
                  onChange={handleFileAttach}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                />
                <label
                  htmlFor="msa-file-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-outline hover:bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors"
                >
                  Choose Document File
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer Buttons */}
        <div className="border-t border-outline-variant pt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-outline-variant hover:bg-surface-container-low text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer text-on-surface-variant"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-sm bg-secondary hover:bg-secondary/95 disabled:bg-outline-variant text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-[0px_4px_12px_rgba(0,0,0,0.05)]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Agreement'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AcademyAnnualContractRenewalEntryForm
