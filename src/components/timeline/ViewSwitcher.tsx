'use client'

export type ViewMode = 'weekly' | 'vertical'

const VIEWS: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: 'weekly',   label: 'Weekly',   icon: '⊞' },
  { mode: 'vertical', label: 'Vertical', icon: '⇕' },
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
              ? 'bg-background text-primary border border-border shadow-sm'
              : 'text-muted hover:text-secondary hover:bg-surface border border-transparent'
          }`}
        >
          <span>{v.icon}</span>
          <span className="hidden sm:inline">{v.label}</span>
        </button>
      ))}
    </div>
  )
}
