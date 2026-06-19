import { X } from 'lucide-react'

function Chip({ selected = [], options = [], onChange }) {
  const handleRemove = (categoryToRemove) => {
    const updated = selected.filter(item => item !== categoryToRemove)
    onChange && onChange(updated)
  }

  const handleAdd = (categoryToAdd) => {
    if (selected.includes(categoryToAdd)) return
    const updated = [...selected, categoryToAdd]
    onChange && onChange(updated)
  }

  const availableOptions = options.filter(opt => !selected.includes(opt))

  return (
    <div className="space-y-2">
      {/* Selected Chips */}
      <div className="flex flex-wrap gap-1.5 min-h-[32px] p-1 border border-outline-variant rounded-sm bg-surface-container-low">
        {selected.length === 0 ? (
          <span className="text-outline text-xs p-1">No categories selected. Click options below to add.</span>
        ) : (
          selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-sm text-xs font-semibold"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
                aria-label={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Available Chips to Add */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-outline uppercase font-mono tracking-wider">Available Categories:</label>
        <div className="flex flex-wrap gap-1.5">
          {availableOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleAdd(opt)}
              className="px-2 py-1 bg-white hover:bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs rounded-sm transition-all cursor-pointer font-medium"
            >
              + {opt}
            </button>
          ))}
          {availableOptions.length === 0 && (
            <span className="text-outline text-xs italic">All categories selected</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chip
