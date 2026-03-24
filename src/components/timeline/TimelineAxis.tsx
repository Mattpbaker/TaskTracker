import { dateToPercent } from '@/lib/timeline'
export { dateToPercent }

export function todayPercent(): number {
  const today = new Date().toISOString().slice(0, 10)
  return dateToPercent(today)
}

const TICK_DATES = [
  { label: '21 Mar', date: '2026-03-21' },
  { label: '7 Apr',  date: '2026-04-07' },
  { label: '24 Apr', date: '2026-04-24' },
  { label: '9 May',  date: '2026-05-09' },
  { label: '14 May', date: '2026-05-14' },
]

interface Props { accent?: string }

export default function TimelineAxis({ accent = '#10b981' }: Props) {
  const todayPct = todayPercent()
  return (
    <div className="relative mx-5 my-0" style={{ height: '2px', background: 'var(--border)' }}>
      {/* Accent overlay on the axis */}
      <div
        className="absolute inset-0 opacity-60"
        style={{ background: `linear-gradient(to right, transparent 0%, ${accent} 20%, ${accent} 80%, transparent 100%)` }}
      />

      {/* Today marker — full-height indicator rendered by the parent, but axis label here */}
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
        style={{ left: `${todayPct}%` }}
      >
        {/* Tall line rendered by absolute positioning in the containing block */}
        <div className="w-px h-10 -translate-y-5" style={{ background: `${accent}90` }} />
        <div
          className="mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide whitespace-nowrap"
          style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}40` }}
        >
          Today
        </div>
      </div>

      {/* Tick marks */}
      {TICK_DATES.map(tick => (
        <div
          key={tick.date}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${dateToPercent(tick.date)}%` }}
        >
          <div className="w-px h-3 bg-border" />
          <span className="text-[9px] text-muted mt-1.5 whitespace-nowrap">{tick.label}</span>
        </div>
      ))}
    </div>
  )
}
