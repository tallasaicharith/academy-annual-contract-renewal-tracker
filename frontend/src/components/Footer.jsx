function Footer() {
  const analysts = [
    { name: 'Alex Rivers', src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80' },
    { name: 'Sarah Jenkins', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80' },
    { name: 'Marcus Thorne', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80' }
  ]

  return (
    <footer className="py-4 px-6 border-t border-outline-variant bg-white flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
      {/* Copyright & Links */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-on-surface-variant">
        <span>&copy; 2026 Oxygen Sports Management</span>
        <div className="flex items-center gap-3">
          <a href="#" className="hover:text-primary transition-colors hover:underline">Privacy Policy</a>
          <span className="text-outline-variant">•</span>
          <a href="#" className="hover:text-primary transition-colors hover:underline">Terms of Service</a>
          <span className="text-outline-variant">•</span>
          <a href="#" className="hover:text-primary transition-colors hover:underline">Support Portal</a>
        </div>
      </div>

      {/* Active Analysts Stack */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-outline">Active Analysts:</span>
        <div className="flex items-center -space-x-2">
          {analysts.map((a, i) => (
            <img
              key={i}
              src={a.src}
              alt={a.name}
              title={a.name}
              className="w-5.5 h-5.5 rounded-full border border-white object-cover"
            />
          ))}
          <div className="w-5.5 h-5.5 rounded-full border border-white bg-surface-container flex items-center justify-center text-[8px] font-bold text-on-surface-variant">
            +3
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
