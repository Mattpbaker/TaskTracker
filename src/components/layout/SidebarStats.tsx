import type { SidebarStats } from '@/types/app'

const STATS: { key: keyof SidebarStats; label: string; colour: string }[] = [
  { key: 'recurringActive', label: 'Recurring',      colour: '#14b8a6' },
  { key: 'dueThisWeek',     label: 'Due this week',  colour: '#f59e0b' },
  { key: 'upcoming',        label: 'Upcoming',        colour: '#6ee7b7' },
  { key: 'overdue',         label: 'Overdue',         colour: '#ef4444' },
  { key: 'inProgress',      label: 'In progress',     colour: '#6366f1' },
  { key: 'completed',       label: 'Completed',       colour: '#a3e635' },
]

export default function SidebarStats({ stats }: { stats: SidebarStats }) {
  return (
    <div className="mb-5">
      <p className="text-[9px] uppercase tracking-widest text-emerald-950 font-semibold px-1 mb-2">Overview</p>
      {STATS.map(({ key, label, colour }) => (
        <div key={key} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-surface">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colour }} />
            <span className="text-xs text-emerald-800">{label}</span>
          </div>
          <span className="text-sm font-bold" style={{ color: colour }}>{stats[key]}</span>
        </div>
      ))}
    </div>
  )
}
