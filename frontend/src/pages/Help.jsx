import { useState } from 'react'
import {
  HelpCircle,
  Search,
  BookOpen,
  Mail,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  FileCheck
} from 'lucide-react'

function Help() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
  const [supportSubmitted, setSupportSubmitted] = useState(false)
  const [supportLoading, setSupportLoading] = useState(false)
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const faqs = [
    {
      q: 'What is the Academy Contract Renewal Tracker?',
      a: 'An enterprise web portal developed for Oxygen Sports to manage, track, and analyze annual equipment supply contracts with sports academies. It ensures that no high-value contract lapses by sending proactive notifications for upcoming renewals.'
    },
    {
      q: 'How is the "Days Left" and expiry state calculated?',
      a: "The backend contains a synchronous SQLite-driven date check. It compares the current calendar date with the contract's renewal date: if it is less than 0 days, the status is set to 'Expired'; if it is 0-30 days, it is flagged as 'Expiring Soon'; otherwise, it remains 'Active' or 'Renewed'."
    },
    {
      q: 'What is the "Price Revision %" field used for?',
      a: 'During annual contract renewals, a revision percentage (e.g. 5.5%) can be set to account for material cost inflation. The analytics dashboard and reports page use this percentage to project your upcoming annual renewal revenue forecasts.'
    },
    {
      q: 'How do I download contract reports in Excel/CSV format?',
      a: 'You can export data in two ways: click "Export CSV" on the main Dashboard to export currently filtered records, or navigate to the "Analytics" page and click "Export CSV Report" to download a full system audit sheet.'
    },
    {
      q: 'Where do I find the contract audit trail history?',
      a: 'Every create, delete, and status change is logged in the SQLite `audit_logs` table. To view it, open any contract from the "Contracts" table. The full modification history is detailed on the right-hand panel of the contract detail screen.'
    }
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSupportSubmit = (e) => {
    e.preventDefault()
    setSupportLoading(true)
    // Simulate API request delay
    setTimeout(() => {
      setSupportLoading(false)
      setSupportSubmitted(true)
    }, 1500)
  }

  const resetSupport = () => {
    setSupportForm({ name: '', email: '', subject: '', message: '' })
    setSupportSubmitted(false)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-widest uppercase">
          <span>OXYGEN SPORTS</span>
          <span>/</span>
          <span className="text-gray-500">HELP CENTER</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Help & Support Portal
        </h1>
        <p className="text-gray-500 text-sm">
          Access product guides, search FAQs, and request support.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: FAQ & Search (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* FAQ Search Bar */}
          <div className="glass-card p-4 bg-white/40">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search help topics or keywords (e.g. price, csv, audit)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl neon-input text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* FAQs List */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#0059BB]" />
              Frequently Asked Questions
            </h2>
            
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No matching help topics found.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaq === idx
                  return (
                    <div
                      key={idx}
                      className="border border-gray-100 rounded-xl bg-white/20 hover:bg-white/40 transition-colors overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left font-semibold text-gray-800 text-xs sm:text-sm cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="p-4 pt-0 text-xs sm:text-sm text-gray-600 border-t border-gray-50 bg-gray-50/30 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Guides Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="glass-card p-5 bg-white/40 border-white/50 flex gap-4">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Adding Contracts</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Navigate to the Entry form, enter the Academy Name, categories, current contract value, and renewal dates.
                </p>
              </div>
            </div>
            
            <div className="glass-card p-5 bg-white/40 border-white/50 flex gap-4">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-[#0C4F44]/10 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-[#0C4F44]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Proactive Renewals</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Locate expiring contracts in your dashboard list, check their expiry timeline, and click 'Renew' to extend.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Support Form (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 bg-gradient-to-br from-white/80 to-white/40 border-white/50 sticky top-6">
            {!supportSubmitted ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#0059BB]" />
                    Support Desk
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Submit a support ticket and our engineering team will get back to you.
                  </p>
                </div>
                
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Your Name</label>
                    <input
                      type="text"
                      value={supportForm.name}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Student 1"
                      className="w-full px-3 py-2 text-xs rounded-lg neon-input text-gray-900"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={supportForm.email}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. tech@oxygensports.com"
                      className="w-full px-3 py-2 text-xs rounded-lg neon-input text-gray-900"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Subject</label>
                    <input
                      type="text"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g. Price Revision Calculation"
                      className="w-full px-3 py-2 text-xs rounded-lg neon-input text-gray-900"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Message Description</label>
                    <textarea
                      value={supportForm.message}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Explain your technical query in detail..."
                      className="w-full px-3 py-2 text-xs rounded-lg neon-input text-gray-900 h-24 resize-none"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={supportLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0059BB] hover:bg-[#004493] disabled:bg-gray-300 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md shadow-blue-500/10"
                  >
                    {supportLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Ticket
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 space-y-5 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-md font-bold text-gray-900">Support Ticket Created</h3>
                  <p className="text-[11px] text-gray-500 mt-1 uppercase font-bold tracking-wider">Ticket #OX-9204</p>
                  <p className="text-xs text-gray-500 mt-2 px-2 leading-relaxed">
                    Thank you! Your ticket has been logged in our queue. An administrator will respond via email shortly.
                  </p>
                </div>
                
                <div className="p-3 border border-emerald-500/10 bg-emerald-500/5 rounded-xl text-[10px] text-emerald-800 flex gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span className="text-left">Simulated successfully! Perfect for showcasing form responses.</span>
                </div>
                
                <button
                  onClick={resetSupport}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Submit Another
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Help
