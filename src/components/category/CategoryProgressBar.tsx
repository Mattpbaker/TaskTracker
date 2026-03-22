export default function CategoryProgressBar({ progress, colour }: { progress: number; colour: string }) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 border-b border-border">
      <span className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold whitespace-nowrap">Category progress</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${colour}, ${colour}cc)` }} />
      </div>
      <span className="text-sm font-bold whitespace-nowrap" style={{ color: colour }}>{progress}%</span>
    </div>
  )
}
