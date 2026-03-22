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
    <div className="relative h-0.5 mx-5 my-0" style={{
      background: `linear-gradient(to right, #1a2e1a, ${accent} 10%, ${accent} 90%, #1a2e1a)`
    }}>
      {/* Today marker */}
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
        style={{ left: `${todayPct}%` }}
      >
        <div className="w-px h-10 -translate-y-5" style={{ background: `${accent}80` }} />
        <span className="text-[9px] uppercase tracking-wide mt-1" style={{ color: accent }}>Today</span>
      </div>
      {/* Ticks */}
      {TICK_DATES.map(tick => (
        <div
          key={tick.date}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${dateToPercent(tick.date)}%` }}
        >
          <div className="w-px h-3 bg-border" />
          <span className="text-[9px] text-emerald-950 mt-1.5 whitespace-nowrap">{tick.label}</span>
        </div>
      ))}
    </div>
  )
}
