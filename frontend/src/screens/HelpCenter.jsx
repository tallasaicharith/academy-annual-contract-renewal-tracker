import { useState } from 'react'
import { 
  HelpCircle, 
  BookOpen, 
  FileText, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Mail, 
  MessageSquare, 
  AlertCircle, 
  Sparkles,
  Clock
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function HelpCenter() {
  const { user } = useAuth()
  
  // States
  const [toastMessage, setToastMessage] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)
  const [ticketForm, setTicketForm] = useState({
    category: 'Contract Data Modification',
    urgency: 'Medium',
    subject: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [myTickets, setMyTickets] = useState(() => {
    const saved = localStorage.getItem('oxygen_support_tickets')
    return saved ? JSON.parse(saved) : []
  })

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // FAQs Data
  const faqs = [
    {
      q: "How does the system calculate contract status?",
      a: "The status of each contract is automatically determined by comparing its renewal date to the current system date. If the renewal date has passed, the status is set to 'Expired'. If the renewal date is within the alert threshold (default 30 days, customizable in Settings), it shifts to 'Expiring Soon'. All other active, future-dated contracts are marked as 'Active'."
    },
    {
      q: "Can I customize the renewal alert threshold?",
      a: "Yes! If you are an administrator, you can change the system-wide default threshold under Settings -> System Configuration. If you are an employee/relationship manager, you can override this threshold for your own notifications under Settings -> My Profile. This custom threshold determines when contracts are categorized as 'Expiring Soon'."
    },
    {
      q: "How does site-wide currency digit grouping work?",
      a: "The system uses the Indian digit grouping format (en-IN) for all rupee formatting. Rather than the standard Western grouping (e.g., ₹1,000,000), it formats using Lakhs and Crores (e.g., ₹10,000,000 becomes ₹1,00,00,000). The Indian Rupee symbol (₹) is displayed next to all values."
    },
    {
      q: "What is the 'Price Revision Suggestion' multiplier?",
      a: "During renewal entry, the system suggests a revised contract amount based on a default price multiplier (e.g., 5.0% inflation adjustment). Administrators can customize this system-wide multiplier in the Settings panel. When creating or editing a contract, the suggested renewal amount is shown beneath the value input."
    },
    {
      q: "How do role privileges differ between Admin and Employee?",
      a: "Administrators have unrestricted access to all data, settings, database seeding, user registration, and system configurations. Employees (Relationship Managers) can only view and update contracts explicitly assigned to them. Additionally, employees cannot reassign their contracts to other managers; the relationship manager field remains locked to their account."
    }
  ]

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  // Support Ticket Submit Handler
  const handleTicketSubmit = (e) => {
    e.preventDefault()
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) return

    setIsSubmitting(true)
    
    // Simulate API delay
    setTimeout(() => {
      const ticketId = `OS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      const newTicket = {
        id: ticketId,
        category: ticketForm.category,
        urgency: ticketForm.urgency,
        subject: ticketForm.subject,
        description: ticketForm.description,
        status: 'Open',
        createdAt: new Date().toISOString()
      }

      const updatedTickets = [newTicket, ...myTickets]
      setMyTickets(updatedTickets)
      localStorage.setItem('oxygen_support_tickets', JSON.stringify(updatedTickets))
      
      showToast(`Support ticket ${ticketId} logged successfully!`)
      setTicketForm({
        category: 'Contract Data Modification',
        urgency: 'Medium',
        subject: '',
        description: ''
      })
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="space-y-6 animate-fadeIn relative pb-10">
      
      {/* Toast notifications */}
      {toastMessage && (
        <div className="toast toast-success shadow-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header breadcrumb & info */}
      <div className="space-y-1 border-b border-outline-variant pb-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-outline tracking-widest uppercase font-mono">
          <span>Oxygen Sports</span>
          <span>/</span>
          <span className="text-on-surface-variant font-extrabold">Help Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight font-headline">
          Help Center & Support
        </h1>
        <p className="text-on-surface-variant text-xs font-medium">
          Access product guides, standard operating procedures, or log support tickets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: FAQ and SOP */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Interactive FAQ Accordions */}
          <div className="flat-card p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
              <HelpCircle className="w-4 h-4 text-primary" /> Frequently Asked Questions
            </h3>
            
            <div className="space-y-2">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div 
                    key={index}
                    className="border border-outline-variant rounded-sm overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-3.5 bg-surface hover:bg-surface-container-low text-left font-medium text-xs sm:text-sm text-on-surface transition-colors focus:outline-none"
                    >
                      <span className="font-semibold tracking-tight">{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-primary shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-outline shrink-0 ml-2" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-3.5 bg-white border-t border-outline-variant text-[13px] text-on-surface-variant leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section: Standard Operating Procedures (SOP) */}
          <div className="flat-card p-6 bg-white space-y-5">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
              <BookOpen className="w-4 h-4 text-primary" /> Standard Operating Procedure (SOP)
            </h3>

            <div className="relative border-l border-outline-variant pl-5 ml-2.5 space-y-6">
              
              {/* Step 1 */}
              <div className="relative">
                <span className="absolute -left-8 top-1 w-5 h-5 rounded-full bg-primary/10 border border-primary text-primary flex items-center justify-center font-mono text-[10px] font-bold">1</span>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">Contract Ingestion & Form Entry</h4>
                <p className="text-[13px] text-on-surface-variant mt-1 leading-relaxed">
                  Upon receiving a new annual academy contract, navigate to <span className="font-semibold">New Contract Entry</span>. Fill out all required fields. For employees, the relationship manager defaults to you. Ensure start and renewal dates are accurate.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <span className="absolute -left-8 top-1 w-5 h-5 rounded-full bg-primary/10 border border-primary text-primary flex items-center justify-center font-mono text-[10px] font-bold">2</span>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">Automated Status Tracking</h4>
                <p className="text-[13px] text-on-surface-variant mt-1 leading-relaxed">
                  The SQLite backend updates status flags synchronously on every request based on calendar checks. Verify that expiring contracts appear in the <span className="font-semibold text-secondary">Expiring Soon</span> category on the dashboard and lists.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <span className="absolute -left-8 top-1 w-5 h-5 rounded-full bg-primary/10 border border-primary text-primary flex items-center justify-center font-mono text-[10px] font-bold">3</span>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">Renewal & Price Revision Multiplier</h4>
                <p className="text-[13px] text-on-surface-variant mt-1 leading-relaxed">
                  Initiate negotiations at least 30 days prior to renewal. Click the contract row to access details, review audit logs, and update the contract status to <span className="font-semibold text-primary">Renewed</span>, adjusting the value using the price revision suggestion.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Support form & logged tickets list */}
        <div className="space-y-6">
          
          {/* Submit Support Ticket Form */}
          <form onSubmit={handleTicketSubmit} className="flat-card p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
              <Mail className="w-4 h-4 text-primary" /> Log Support Ticket
            </h3>
            
            {/* Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
                Issue Category
              </label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                className="flat-input w-full px-3 py-2 border-outline-variant bg-white"
              >
                <option>Contract Data Modification</option>
                <option>System Bug / Visual Glitch</option>
                <option>User Role & Permissions</option>
                <option>Feature Request / Suggestion</option>
                <option>Other</option>
              </select>
            </div>

            {/* Urgency */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
                Urgency Level
              </label>
              <select
                value={ticketForm.urgency}
                onChange={(e) => setTicketForm(prev => ({ ...prev, urgency: e.target.value }))}
                className="flat-input w-full px-3 py-2 border-outline-variant bg-white"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
                Subject line
              </label>
              <input
                type="text"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                className="flat-input w-full px-3 py-2 border-outline-variant"
                placeholder="e.g. Cannot edit category under settings"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">
                Detailed Description
              </label>
              <textarea
                rows="4"
                value={ticketForm.description}
                onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                className="flat-input w-full px-3 py-2 border-outline-variant"
                placeholder="Describe your issue or feature request in detail..."
                required
              ></textarea>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flat-button w-full py-2.5 bg-primary hover:bg-primary/95 disabled:bg-outline-variant text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Logging Ticket...' : 'Submit Support Ticket'}
            </button>
          </form>

          {/* List of my logged tickets */}
          <div className="flat-card p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
              <MessageSquare className="w-4 h-4 text-primary" /> Recent Support Tickets ({myTickets.length})
            </h3>

            {myTickets.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-outline-variant rounded-sm">
                <AlertCircle className="w-8 h-8 text-outline mx-auto mb-2" />
                <p className="text-xs text-on-surface-variant">You have not logged any support tickets yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {myTickets.map((ticket, index) => (
                  <div key={index} className="p-3 bg-surface border border-outline-variant rounded-sm text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-primary">{ticket.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        ticket.urgency === 'Critical' ? 'bg-error-container text-error border-error/20' : 
                        ticket.urgency === 'High' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                        'bg-outline-variant/30 text-outline border-outline-variant/50'
                      }`}>
                        {ticket.urgency}
                      </span>
                    </div>
                    <h4 className="font-bold text-on-surface truncate">{ticket.subject}</h4>
                    <p className="text-on-surface-variant text-[11px] line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-outline font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-primary">
                        Status: {ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  )
}
