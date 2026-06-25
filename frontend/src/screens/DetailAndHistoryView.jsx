import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Pencil,
  Download,
  Printer,
  Calendar,
  DollarSign,
  Package,
  User,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  ZoomIn,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import { getContractById, updateStatus } from '../api/api'
import { mockManagers } from '../mock/managers.mock'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'

function DetailAndHistoryView() {
  const { id } = useParams()
  const navigate = useNavigate()

  // States
  const [contract, setContract] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [fullLogsExpanded, setFullLogsExpanded] = useState(false)

  useEffect(() => {
    loadContract()
  }, [id])

  const loadContract = async () => {
    try {
      setLoading(true)
      const data = await getContractById(id)
      setContract(data.contract)
      setHistory(data.history)
    } catch (e) {
      console.error(e)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleRenew = () => {
    setDialogOpen(true)
  }

  const confirmRenewal = async () => {
    try {
      setUpdating(true)
      setDialogOpen(false)
      await updateStatus(id, 'Renewed')
      showToast('Contract renewed successfully!')
      loadContract()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  const getDaysLeft = () => {
    if (!contract?.renewalDate) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(contract.renewalDate)
    end.setHours(0, 0, 0, 0)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDaysLeftConfig = (days) => {
    if (days < 0) return { text: 'Overdue', color: 'text-error bg-error-container', barColor: 'bg-error' }
    if (days <= 30) return { text: `${days} Days Remaining`, color: 'text-secondary-container bg-secondary-container/10', barColor: 'bg-secondary-container' }
    return { text: `${days} Days Remaining`, color: 'text-tertiary bg-tertiary/10', barColor: 'bg-tertiary' }
  }

  const daysLeft = getDaysLeft()
  const daysConfig = getDaysLeftConfig(daysLeft)

  // Resolve manager metadata dynamically from the joined database record
  const manager = {
    name: contract?.relationshipManager || 'Unassigned',
    email: contract?.relationshipManagerEmail || '',
    phone: contract?.relationshipManagerPhone || '',
    avatar: contract?.relationshipManagerAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80',
    title: contract?.relationshipManagerTitle || 'Relationship Manager'
  }

  const formatCurrency = (val) => {
    return val.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <LoadingSpinner message="Loading contract metadata..." />
  }

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast toast-success shadow-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Dialog for Renewal */}
      <ConfirmDialog
        isOpen={dialogOpen}
        title="Approve Contract Renewal"
        message="Are you sure you want to renew this contract? This action will set the status to 'Renewed' and log this event in the ledger."
        confirmText="Approve"
        onConfirm={confirmRenewal}
        onCancel={() => setDialogOpen(false)}
        severity="info"
      />

      {/* Breadcrumb row */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-outline tracking-widest uppercase font-mono">
            <span className="hover:underline cursor-pointer" onClick={() => navigate('/dashboard')}>Academies</span>
            <span>/</span>
            <span className="text-on-surface-variant font-extrabold">{contract?.academyName}</span>
          </div>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-outline-variant pb-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight font-headline">
              {contract?.academyName}
            </h1>
            <StatusBadge status={contract?.status} />
          </div>
          <p className="text-xs font-bold text-outline uppercase font-mono tracking-wider">
            Contract ID: {contract?.id}
          </p>
        </div>

        {/* Action Button Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/contracts/${contract?.id}/edit`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-outline-variant hover:bg-surface-container text-xs font-bold uppercase tracking-wider rounded-sm text-on-surface-variant cursor-pointer transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-outline-variant hover:bg-surface-container text-xs font-bold uppercase tracking-wider rounded-sm text-on-surface-variant cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>

          <button
            onClick={handleRenew}
            disabled={updating || contract?.status === 'Renewed'}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary hover:bg-secondary/95 disabled:bg-outline-variant text-white text-xs font-bold uppercase tracking-wider rounded-sm cursor-pointer transition-colors shadow-sm"
          >
            Renew Contract
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side Column: Info Cards & Document Panel (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Info Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card 1: Next Renewal */}
            <div className="flat-card p-5 bg-white flex flex-col justify-between h-32">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-outline">Next Renewal Date</span>
                <h4 className="text-base font-bold text-on-surface mt-1 leading-snug font-headline">
                  {new Date(contract?.renewalDate).toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'long', day: '2-digit'
                  })}
                </h4>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold font-mono text-on-surface-variant">
                  <span>{daysConfig.text}</span>
                  <span>12 Months</span>
                </div>
                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full ${daysConfig.barColor}`} style={{ width: daysLeft < 0 ? '100%' : `${Math.min(100, (daysLeft / 365) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Card 2: Contract Value */}
            <div className="flat-card p-5 bg-white flex flex-col justify-between h-32">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-outline">Contract Annual Value</span>
                <h4 className="text-2xl font-extrabold text-on-surface mt-1 font-headline">
                  {formatCurrency(contract?.contractValue)}
                </h4>
              </div>
              <div className="flex">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold font-mono text-[#00666d] bg-[#e6f5f4]">
                  +{contract?.priceRevision}% Revision scheduled
                </span>
              </div>
            </div>

            {/* Card 3: Equipment Categories */}
            <div className="flat-card p-5 bg-white flex flex-col justify-between h-32">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-outline">Equipment Categories</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {contract?.equipmentCategories.slice(0, 3).map((cat, i) => (
                    <span key={i} className="px-2 py-0.5 bg-surface-container border border-outline-variant text-[10px] font-bold uppercase rounded-sm text-on-surface-variant font-mono">
                      {cat}
                    </span>
                  ))}
                  {contract?.equipmentCategories.length > 3 && (
                    <span className="px-2 py-0.5 bg-surface-container-low border border-outline-variant border-dashed text-[10px] font-bold rounded-sm text-outline font-mono">
                      +{contract?.equipmentCategories.length - 3} More
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-outline font-medium">Categories specified in agreement schedule.</span>
            </div>

            {/* Card 4: Relationship Manager */}
            <div className="flat-card p-5 bg-white flex flex-col justify-between h-32">
              <div className="flex items-center gap-3">
                <img
                  src={manager?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80'}
                  alt={contract?.relationshipManager}
                  className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                />
                <div>
                  <h4 className="text-xs font-bold text-on-surface">{contract?.relationshipManager}</h4>
                  <p className="text-[9px] uppercase font-mono text-outline font-bold mt-0.5">{manager?.title || 'RM'}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <a
                  href={`mailto:${manager?.email}`}
                  className="flex-1 py-1.5 rounded-sm border border-outline-variant hover:bg-surface-container text-[10px] font-bold uppercase tracking-wider text-center text-on-surface-variant cursor-pointer transition-colors"
                >
                  Email RM
                </a>
                <a
                  href={`tel:${manager?.phone}`}
                  className="flex-1 py-1.5 rounded-sm border border-outline-variant hover:bg-surface-container text-[10px] font-bold uppercase tracking-wider text-center text-on-surface-variant cursor-pointer transition-colors"
                >
                  Call RM
                </a>
              </div>
            </div>
          </div>

          {/* Document Panel: Embedded MSA Mockup */}
          <div className="flat-card bg-white overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                <FileText className="w-4 h-4 text-outline" />
                <span className="font-mono">{contract?.documentName || 'master_service_agreement.pdf'}</span>
              </div>

              {/* Document Toolbar */}
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-surface-container rounded-sm text-outline hover:text-on-surface transition-colors cursor-pointer" title="Zoom In">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 hover:bg-surface-container rounded-sm text-outline hover:text-on-surface transition-colors cursor-pointer" title="Print Document" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 hover:bg-surface-container rounded-sm text-outline hover:text-on-surface transition-colors cursor-pointer" title="Open In New Window">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* MSA document body */}
            <div className="p-6 md:p-10 text-[11px] sm:text-xs text-on-surface-variant font-mono space-y-4 max-h-[380px] overflow-y-auto leading-relaxed border-t border-outline-variant/30">
              <div className="text-center font-bold text-on-surface mb-6 border-b border-outline-variant pb-4">
                <h4 className="text-sm font-bold tracking-widest uppercase">Oxygen Sports Wholesale Supply Contract</h4>
                <p className="text-[10px] text-outline mt-1 font-normal font-sans">Corporate Office: Gachibowli, Hyderabad, Telangana</p>
              </div>
              
              <p className="font-bold text-on-surface uppercase">Master Service Agreement (MSA)</p>
              
              <p>
                THIS SERVICE AGREEMENT is entered into on this <span className="underline">{contract?.contractStartDate}</span>, 
                BETWEEN <span className="font-bold text-on-surface underline">OXYGEN SPORTS WHOLESALERS</span>, and 
                <span className="font-bold text-on-surface underline"> {contract?.academyName}</span>.
              </p>
              
              <div className="space-y-2 pt-2 text-[11px]">
                <p className="font-bold text-on-surface">1. SCOPE OF EQUIPMENT SUPPLY</p>
                <p>
                  Oxygen Sports agrees to act as the primary supplier of athletic merchandise. Supply schedules cover bulk inventory supplies specifically including: 
                  <span className="italic"> {contract?.equipmentCategories.join(', ')}</span>.
                </p>
                
                <p className="font-bold text-on-surface">2. PRICING SCHEDULE & COST INFLATION ADJUSTMENT</p>
                <p>
                  The initial annual base value of this agreement is evaluated at <span className="font-bold text-on-surface">{formatCurrency(contract?.contractValue)}</span>.
                  During annual contract renewal cycles, cost revisions are applied dynamically. The designated inflation revision coefficient for this account is set at 
                  <span className="font-bold text-on-surface"> {contract?.priceRevision}%</span>.
                </p>

                <p className="font-bold text-on-surface">3. ACCOUNT AUDIT & NOTIFICATION WINDOW</p>
                <p>
                  The contract renewal date is scheduled for <span className="underline font-bold text-on-surface">{contract?.renewalDate}</span>. 
                  Oxygen Sports Relationship Managers are scheduled to trigger alert cycles 30 days prior to expiry.
                </p>
              </div>

              {/* Redacted placeholder box */}
              <div className="border border-dashed border-error/45 bg-error/5 p-4 text-center rounded-[4px] text-error font-sans font-bold leading-normal">
                (Remaining clauses and legal appendices are redacted for preview mode)
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Column: Audit Log timeline sidebar (1/3 width) */}
        <div className="lg:col-span-1 space-y-5">
          <div className="flat-card p-6 bg-white space-y-6">
            <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-outline">
              Ledger Timeline
            </h3>

            {/* Timeline Stream */}
            <div className="relative border-l border-outline-variant pl-4 ml-2 space-y-6">
              {history.slice(0, fullLogsExpanded ? history.length : 3).map((log, index) => {
                const isStatus = log.action === 'STATUS_CHANGE'
                const isNotify = log.action === 'NOTIFICATION_SENT'
                const isCreate = log.action === 'CREATE'
                
                let dotColor = 'bg-primary'
                if (isStatus) dotColor = 'bg-[#00666d]'
                if (isNotify) dotColor = 'bg-secondary'
                if (isCreate) dotColor = 'bg-[#717786]'

                return (
                  <div key={log.id} className="relative">
                    {/* Circle Dot Marker */}
                    <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-white ${dotColor}`}></span>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-on-surface">
                          {log.action === 'STATUS_CHANGE' ? 'Status Transition' :
                           log.action === 'NOTIFICATION_SENT' ? 'Renewal Alert Dispatched' :
                           log.action === 'UPDATE' ? `Details Updated: ${log.fieldChanged}` :
                           'Contract Registered'}
                        </h4>
                        <span className="text-[9px] font-bold text-outline font-mono uppercase tracking-wide shrink-0">
                          {new Date(log.createdAt).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {log.description}
                      </p>

                      <p className="text-[10px] text-outline font-medium font-mono uppercase tracking-widest">
                        Actor: {log.changedBy}
                      </p>
                    </div>
                  </div>
                )
              })}

              {history.length === 0 && (
                <p className="text-xs text-outline py-4">No audit events registered.</p>
              )}
            </div>

            {/* Timeline expander toggle */}
            {history.length > 3 && (
              <button
                onClick={() => setFullLogsExpanded(!fullLogsExpanded)}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-outline-variant hover:bg-surface-container text-xs font-bold uppercase tracking-wider rounded-sm text-on-surface-variant cursor-pointer transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${fullLogsExpanded ? 'rotate-180' : ''}`} />
                {fullLogsExpanded ? 'Hide Logs' : 'View Full System Logs'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetailAndHistoryView
