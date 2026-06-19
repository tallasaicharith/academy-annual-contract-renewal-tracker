import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import {
  ArrowLeft,
  Pencil,
  Printer,
  Download,
  Calendar,
  User,
  Package,
  IndianRupee,
  TrendingUp,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  X,
  Mail,
  PhoneCall,
  FileCheck
} from 'lucide-react'

const ALL_STATUSES = ['Active', 'Expiring Soon', 'Expired', 'Renewed', 'Cancelled']

const getManagerAvatar = (name) => {
  if (name?.toLowerCase().includes('rivers')) {
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCXn0vh6P45GaBWKTrxruADvZ_l5fLskKfmyvmnNPaHGW7_J2Syjv5NmAscIJ_4Yms6Tdi5RMDs2ae3YB4zEv1-NUp5ExAYtEnVkKSyqgBzfbXfLAZtTwaC7_QWyyHhZLlZhk3gl4T2ppT6Cyu9sSXT___UAxwMMNRRg0ohVOkAeydRsF6s8totf4TsYwHt2xCW0dt5-nLV3JnjpvSy7r4jtRy2bXGTRJdl9cPPxGmvdjKt777-O8j40LX4a-nR0_6PNuGY8PchEo';
  }
  if (name?.toLowerCase().includes('jenkins')) {
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuB53hHfC88RiOQX_xCfrCGJLiXUu5uOTgQzkrHj6qVrUoYPNomq1w1Wte5xePlKObeS0JdnYng8_f7Q99b416bYkgaAr2tUHKA6wQv0Qg9eMOVMF5Cu_zkyTGpjTUEuAODPAxAUwllxd1hxXQ5GzCek1tppxFy3nUxEThg1BmBAoAGptpkTd77fZnxvtHalRHj7mE53qh8QGb5FXuWk3ZYvXqQl-18qMe-GcTD_MQxSST-JlgPH67cUJkq55YpDh-Puas1sRqYn7-g';
  }
  if (name?.toLowerCase().includes('thorne')) {
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBa8AU9jUU3f8pHZmTzY1tk-T8s8nMQm-iXtrTEb9QFOKodeITUwsTVK97zpWYtsfavdvZUcq0nigYG3Uk_zKxaAyJmEekJ-uzdBpnXorddoLCqreVxPc71ptCwYZd3CgvYAAcY52nqbQzEgRk3H6hbkVLgCdRjq2gacF8mOb5ZCXm-DuF22gMJzRWu7s-IfQlFFJOFAO1hZJ3xqp_1DEMoNWlq2qt0b6Ixq_h6cXc1lVSzrLdZv0pd6ATjs4DYroWm3o1pieQg478';
  }
  return null;
}

function ContractDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contract, setContract] = useState(null)
  const [auditHistory, setAuditHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [expandedLog, setExpandedLog] = useState(false)

  useEffect(() => {
    fetchContract()
  }, [id])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const data = await api.get(`/contracts/${id}`)
      setContract(data.data || data.contract || data)

      try {
        const historyData = await api.get(`/contracts/${id}/history`)
        setAuditHistory(historyData.history || historyData || [])
      } catch {
        setAuditHistory([])
      }
    } catch (err) {
      setError('Failed to load contract details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setConfirmModal(null)
    setUpdatingStatus(true)
    try {
      await api.patch(`/contracts/${id}/status`, { status: newStatus })
      setContract((prev) => ({ ...prev, status: newStatus }))
      setToast({ type: 'success', message: `Status changed to ${newStatus}` })
      setShowStatusMenu(false)
      fetchContract()
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to update status',
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    if (!contract) return
    const data = JSON.stringify(contract, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contract-${contract.academyName || id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDaysUntilExpiry = () => {
    if (!contract?.renewalDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(contract.renewalDate)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  }

  const daysLeft = getDaysUntilExpiry()

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!contract?.contractStartDate || !contract?.renewalDate) return 0
    const start = new Date(contract.contractStartDate).getTime()
    const end = new Date(contract.renewalDate).getTime()
    const today = new Date().getTime()
    
    if (today >= end) return 100
    if (today <= start) return 0
    
    const total = end - start
    const elapsed = today - start
    return Math.round((elapsed / total) * 100)
  }

  const progressPct = getProgressPercentage()

  const getExpiryTheme = (days) => {
    if (days === null) return { text: 'text-gray-400', border: 'border-gray-500/30', fill: 'bg-gray-500/20' }
    if (days < 0) return { text: 'text-red-400', border: 'border-red-500/30', fill: 'bg-red-500/20' }
    if (days <= 30) return { text: 'text-red-400', border: 'border-red-500/30', fill: 'bg-red-500/20' }
    if (days <= 90) return { text: 'text-amber-400', border: 'border-amber-500/30', fill: 'bg-amber-500/20' }
    return { text: 'text-emerald-400', border: 'border-emerald-500/30', fill: 'bg-emerald-500/20' }
  }

  const expiryTheme = getExpiryTheme(daysLeft)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#127464] animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading contract details...</p>
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">{error || 'Contract not found'}</p>
          <button
            onClick={() => navigate('/contracts')}
            className="text-blue-400 text-sm hover:underline"
          >
            Back to Contracts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
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

      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-sm w-full mx-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-[#1A1C1E] mb-2">Confirm Status Change</h3>
            <p className="text-[#414754] text-xs mb-6 leading-relaxed">
              Are you sure you want to change the status of <span className="text-[#1A1C1E] font-semibold">{contract.academyName}</span> to{' '}
              <span className="text-[#1A1C1E] font-bold">{confirmModal.status}</span>? This update will be recorded in the audit logs.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-[rgba(193,198,215,0.8)] text-[#414754] hover:bg-[#F3F3F6] text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(confirmModal.status)}
                className="px-4 py-2 rounded-xl bg-[#0C4F44] hover:bg-[#08372F] text-white text-xs font-semibold transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header and Breadcrumbs */}
      <div className="space-y-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#717786] tracking-widest uppercase">
          <span className="cursor-pointer hover:text-[#1A1C1E]" onClick={() => navigate('/dashboard')}>OXYGEN SPORTS</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-[#1A1C1E]" onClick={() => navigate('/contracts')}>ACADEMIES</span>
          <span>/</span>
          <span className="text-[#1A1C1E]">{contract.academyName}</span>
        </div>

        {/* Action Title and Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/contracts')}
              className="p-2 rounded-xl border border-[rgba(193,198,215,0.6)] bg-white hover:bg-[#F3F3F6] text-[#414754] hover:text-[#1A1C1E] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C1E] tracking-tight leading-none">
                  {contract.academyName}
                </h1>
                <span className="text-xs font-mono font-bold text-[#414754] bg-[#F3F3F6] px-2 py-0.5 rounded border border-[rgba(193,198,215,0.6)]">
                  ID: OX-{2010000 + contract.id}
                </span>
              </div>
              <p className="text-xs text-[#717786] mt-1.5 flex items-center gap-2">
                <StatusBadge status={contract.status} />
                <span>&bull;</span>
                <span>Renewal Schedule: Yearly</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate(`/contracts/${id}/edit`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0059BB] hover:bg-[#004493] text-white text-xs font-bold transition-all shadow-sm border border-[#0059BB]"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>

            {/* Change Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={updatingStatus}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[rgba(193,198,215,0.6)] bg-white hover:bg-[#F3F3F6] text-[#414754] hover:text-[#1A1C1E] text-xs font-bold transition-all disabled:opacity-50"
              >
                {updatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                Change Status
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-20 animate-fadeIn border border-[rgba(193,198,215,0.6)]">
                  {ALL_STATUSES.filter((s) => s !== contract.status).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setShowStatusMenu(false)
                        setConfirmModal({ status })
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-[#414754] hover:bg-[#F3F3F6] hover:text-[#1A1C1E] transition-colors font-semibold"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setConfirmModal({ status: 'Renewed' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#AB3600] hover:bg-[#8F2D00] text-white text-xs font-bold transition-all shadow-sm border border-[#AB3600]"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Renew Contract
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-[rgba(193,198,215,0.6)] bg-white hover:bg-[#F3F3F6] text-[#414754] hover:text-[#1A1C1E] transition-all"
              title="Print Documentation"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-xl border border-[rgba(193,198,215,0.6)] bg-white hover:bg-[#F3F3F6] text-[#414754] hover:text-[#1A1C1E] transition-all"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Cards Grid (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Next Renewal */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#717786] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Next Renewal</span>
            <Clock className="w-4 h-4 text-[#0059BB]" />
          </div>
          <p className="text-2xl font-black text-[#1A1C1E]">
            {daysLeft !== null
              ? daysLeft < 0
                ? `${Math.abs(daysLeft)} Days Overdue`
                : `${daysLeft} Days`
              : 'N/A'}
          </p>
          <div className="mt-4">
            <div className="w-full bg-[#F3F3F6] rounded-full h-1.5 overflow-hidden border border-[rgba(193,198,215,0.4)]">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  daysLeft !== null && daysLeft <= 30 ? 'bg-red-500' :
                  daysLeft !== null && daysLeft <= 90 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[9px] font-bold tracking-wider text-[#717786] uppercase">
              <span>Start</span>
              <span>{progressPct}% elapsed</span>
              <span>Renewal</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0059BB]/50" />
        </div>

        {/* Contract Value */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#717786] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Contract Value</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#1A1C1E]">
            ₹{(contract.contractValue || 0).toLocaleString('en-IN')}
          </p>
          <div className="mt-4 flex items-center">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded">
              <TrendingUp className="w-3 h-3" />
              +{contract.priceRevision || 0}% Revision Scheduled
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500/50" />
        </div>

        {/* Equipment Categories */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#717786] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Equip. Categories</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[40px] overflow-y-auto mt-2">
            {contract.equipmentCategories?.split(',').map((cat, idx) => (
              <span key={idx} className="bg-[#F3F3F6] border border-[rgba(193,198,215,0.6)] text-[#414754] px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
                {cat.trim()}
              </span>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500/50" />
        </div>

        {/* Relationship Manager */}
        <div className="glass-card p-5 relative overflow-hidden">
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-3">Relationship Manager</p>
          <div className="flex items-center space-x-3">
            {getManagerAvatar(contract.relationshipManager) ? (
              <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 ring-2 ring-blue-500/10">
                <img className="w-full h-full object-cover" src={getManagerAvatar(contract.relationshipManager)} alt="avatar" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0C4F44] to-[#127464] flex items-center justify-center text-white text-xs font-bold shadow-md">
                {contract.relationshipManager?.slice(0, 2).toUpperCase() || 'RM'}
              </div>
            )}
            <div>
              <h4 className="font-bold text-sm text-gray-900 leading-none">{contract.relationshipManager}</h4>
              <p className="text-[10px] text-gray-500 mt-1">Senior Key Accounts</p>
            </div>
          </div>
          <div className="mt-3.5 space-y-2">
            <a
              href={`mailto:${contract.relationshipManager?.toLowerCase().replace(/\s+/g, '')}@oxygensports.com`}
              className="w-full flex items-center justify-center py-2 px-3 border border-gray-200 hover:bg-gray-50 rounded-lg transition-all text-[11px] font-semibold text-gray-700"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600 mr-2" />
              Email {contract.relationshipManager?.split(' ')[0]}
            </a>
            <a
              href="tel:+1800555981"
              className="w-full flex items-center justify-center py-2 px-3 border border-gray-200 hover:bg-gray-50 rounded-lg transition-all text-[11px] font-semibold text-gray-700"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-600 mr-2" />
              Call Extension (x442)
            </a>
          </div>
        </div>
      </div>

      {/* Split Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Hand Column: MSA PDF preview */}
        <div className="glass-card p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(193,198,215,0.4)] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#414754] uppercase tracking-wider">
                Master Service Agreement
              </h3>
              <p className="text-[9px] text-[#717786] uppercase tracking-wider font-bold mt-0.5">Verified Document Vault</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">ACTIVE PREVIEW</span>
            </div>
          </div>

          {/* Attachment Info Card */}
          <div className="bg-[#F9F9FC] border border-[rgba(193,198,215,0.6)] rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center border border-red-200">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1A1C1E] truncate max-w-[200px] sm:max-w-[300px]">
                  {contract.academyName?.replace(/\s+/g, '_')}_MSA_Contract_v2.pdf
                </p>
                <p className="text-[10px] text-[#717786] font-mono">1.2 MB &bull; Signed PDF</p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0C4F44] hover:bg-[#08372F] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-[#0C4F44]"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>

          {/* Simulated Document Preview Sheet */}
          <div className="relative border border-[rgba(193,198,215,0.6)] rounded-xl bg-white p-6 flex flex-col font-mono shadow-sm h-[340px] overflow-y-auto overflow-x-hidden text-[11px] leading-relaxed text-[#414754]">
            {/* Stamp / Watermark */}
            <div className="absolute right-6 top-6 w-16 h-16 rounded-full border-4 border-emerald-500/10 flex items-center justify-center text-[8px] font-sans font-black tracking-widest text-emerald-500/10 uppercase select-none transform rotate-12">
              Oxygen
            </div>

            {/* Document body */}
            <div className="space-y-4 font-mono text-[#414754]">
              <div className="text-center font-sans font-bold text-xs text-[#1A1C1E] border-b border-[rgba(193,198,215,0.4)] pb-2 mb-4">
                MASTER SERVICE AGREEMENT (MSA)
              </div>
              
              <p>
                <strong className="text-[#1A1C1E]">PARTIES:</strong> This agreement is entered by and between <span className="text-[#0059BB] font-bold">Oxygen Sports Co.</span> and <span className="text-[#1A1C1E] font-bold">{contract.academyName}</span>, hereafter referred to as the "Academy Partner".
              </p>

              <div>
                <strong className="text-[#1A1C1E]">1. TERM OF AGREEMENT:</strong>
                <p className="pl-3 mt-1 text-[#414754]">
                  The term of this Agreement shall commence on <span className="text-[#1A1C1E] font-semibold">{formatDate(contract.contractStartDate)}</span> and will terminate on <span className="text-[#1A1C1E] font-semibold">{formatDate(contract.renewalDate)}</span>, unless renewed earlier by mutual execution.
                </p>
              </div>

              <div>
                <strong className="text-[#1A1C1E]">2. EQUIPMENT SPECIFICATIONS:</strong>
                <p className="pl-3 mt-1 text-[#414754]">
                  Oxygen Sports agrees to procure and supply sports equipment groups belonging to: <span className="text-purple-700 font-semibold">{contract.equipmentCategories}</span> as outlined in Schedule B.
                </p>
              </div>

              <div>
                <strong className="text-[#1A1C1E]">3. VALUATION & PAYMENT TERMS:</strong>
                <p className="pl-3 mt-1 text-[#414754]">
                  The initial contractual partnership valuation is established at <span className="text-[#1A1C1E] font-bold font-mono">₹{(contract.contractValue || 0).toLocaleString('en-IN')}</span>. A mandatory price index modification of <span className="text-emerald-700 font-bold font-mono">+{contract.priceRevision || 0}%</span> is integrated to handle renewals.
                </p>
              </div>

              {/* Redacted placeholders */}
              <div className="space-y-2 pt-2 border-t border-[rgba(193,198,215,0.4)]">
                <strong className="text-[#717786]">4. INDEMNITY & GENERAL PROVISIONS:</strong>
                <div className="h-2.5 bg-slate-100 rounded w-full" />
                <div className="h-2.5 bg-slate-100 rounded w-5/6" />
                <div className="h-2.5 bg-slate-100 rounded w-4/5" />
                <div className="h-2.5 bg-slate-100 rounded w-11/12" />
              </div>

              <div className="pt-6 flex justify-between items-center font-sans text-[8px] text-[#717786] uppercase font-bold tracking-wider">
                <span>Signed By: Oxygen Sports Operations</span>
                <span>Signed By: {contract.relationshipManager}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand Column: Timeline audit log */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(193,198,215,0.4)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#414754] uppercase tracking-wider">
                  Contract Audit Log
                </h3>
                <p className="text-[9px] text-[#717786] uppercase tracking-wider font-bold mt-0.5">Chronological system events</p>
              </div>
            </div>

            {/* Vertical timeline */}
            {auditHistory.length > 0 ? (
              <div className="relative border-l border-[rgba(193,198,215,0.6)] pl-6 ml-3 space-y-5 py-2 max-h-[360px] overflow-y-auto pr-1">
                {(expandedLog ? auditHistory : auditHistory.slice(0, 5)).map((entry, idx) => {
                  // Bullet colors based on action
                  const isCreate = entry.action === 'CREATE'
                  const isStatus = entry.action === 'STATUS_CHANGE' || entry.field === 'status'
                  const isAuto = entry.action === 'AUTO_STATUS_UPDATE'
                  
                  return (
                    <div key={idx} className="relative group">
                      {/* Timeline dot marker */}
                      <span className={`absolute -left-[30.5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                        isCreate ? 'bg-emerald-500' :
                        isStatus ? 'bg-blue-500' :
                        isAuto ? 'bg-purple-500' :
                        'bg-amber-500'
                      }`} />
                      
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#1A1C1E]">
                          {entry.action} {entry.field ? `(${entry.field})` : ''}
                        </p>
                        
                        {/* Detail text */}
                        {entry.oldValue || entry.newValue ? (
                          <p className="text-[11px] text-[#414754] leading-relaxed">
                            Changed from <span className="text-red-600 font-mono">"{entry.oldValue || 'null'}"</span> to <span className="text-emerald-700 font-mono">"{entry.newValue}"</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#414754]">
                            Partnership details initialized in data store.
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 text-[9px] text-[#717786] font-semibold">
                          <span>By: {entry.changedBy || entry.user || 'system'}</span>
                          <span>&bull;</span>
                          <span>{formatDateTime(entry.timestamp || entry.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-[#717786]">
                <Clock className="w-10 h-10 opacity-30 mb-2" />
                <p className="text-xs">No audit trace history available.</p>
              </div>
            )}
          </div>

          {auditHistory.length > 5 && (
            <button
              onClick={() => setExpandedLog(!expandedLog)}
              className="w-full text-center py-2 text-xs font-bold text-[#0059BB] hover:text-[#004493] hover:bg-[#0059BB]/5 rounded-xl border border-[rgba(193,198,215,0.6)] mt-4 transition-all uppercase tracking-wider"
            >
              {expandedLog ? 'View Less' : 'View Full System Logs'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContractDetail
