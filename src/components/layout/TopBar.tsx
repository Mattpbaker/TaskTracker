import DaysRemainingBadge from './DaysRemainingBadge'
import ThemeToggle from './ThemeToggle'

export default function TopBar() {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <header className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-border flex-shrink-0">
      <div className="w-2.5 h-2.5 rounded-full bg-cat-social shadow-[0_0_8px_#10b981]" />
      <span className="font-bold text-primary tracking-tight">TaskTracker</span>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-muted border border-border rounded px-2 py-1">{today}</span>
        <DaysRemainingBadge />
        <ThemeToggle />
      </div>
    </header>
  )
}
