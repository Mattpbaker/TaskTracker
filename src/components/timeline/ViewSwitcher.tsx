'use client'

export type ViewMode = 'weekly' | 'horizontal' | 'swimlane' | 'vertical' | 'calendar'

const VIEWS: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: 'weekly',     label: 'Weekly',   icon: '⊞' },
  { mode: 'horizontal', label: 'Timeline', icon: '⟶' },
  { mode: 'swimlane',   label: 'Swimlane', icon: '⊟' },
  { mode: 'vertical',   label: 'Vertical', icon: '⇕' },
  { mode: 'calendar',   label: 'Calendar', icon: '▦' },
]

export default function ViewSwitcher({
  current,
  onChange,
}: {
  current: ViewMode
  onChange: (v: ViewMode) => void
}) {
  return (
    <div className="flex items-center gap-0.5 ml-auto bg-surface border border-border rounded-lg p-0.5">
      {VIEWS.map(v => (
        <button
          key={v.mode}
          onClick={() => onChange(v.mode)}
          title={v.label}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium transition-all ${
            current === v.mode
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-900'
              : 'text-emerald-900 hover:text-emerald-700 hover:bg-emerald-950/30 border border-transparent'
          }`}
        >
          <span>{v.icon}</span>
          <span className="hidden sm:inline">{v.label}</span>
        </button>
      ))}
    </div>
  )
}
