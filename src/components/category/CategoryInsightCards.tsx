import type { CategoryInsights } from '@/types/app'

export default function CategoryInsightCards({ insights, colour }: { insights: CategoryInsights; colour: string }) {
  const cards = [
    { label: 'Total Tasks',          value: insights.total,             colour },
    { label: 'In Progress',          value: insights.inProgress,        colour: '#6366f1' },
    { label: 'Completed',            value: insights.completed,         colour: '#a3e635' },
    { label: 'Overdue',              value: insights.overdue,           colour: '#ef4444' },
    { label: 'Days Until Final Due', value: `${insights.daysUntilFinalDue}d`, colour },
  ]
  return (
    <div className="flex gap-2.5 px-6 py-3 border-b border-border">
      {cards.map(card => (
        <div key={card.label} className="flex-1 bg-surface border border-border rounded-lg px-3 py-2.5">
          <div className="text-xl font-bold" style={{ color: card.colour }}>{card.value}</div>
          <div className="text-[9px] uppercase tracking-wide text-emerald-950">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
