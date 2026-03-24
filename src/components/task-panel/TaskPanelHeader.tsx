interface Props {
  title: string
  category: string | null
  module: string | null
  colour: string
  onClose: () => void
}

export default function TaskPanelHeader({ title, category, module: mod, colour, onClose }: Props) {
  return (
    <div className="flex items-start gap-3 p-5 border-b border-border">
      <div className="w-0.5 h-10 rounded-full flex-shrink-0 mt-0.5" style={{ background: colour }} />
      <div className="flex-1">
        <h2 className="text-base font-bold text-primary leading-tight mb-2">{title}</h2>
        <div className="flex gap-2 flex-wrap">
          {category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${colour}20`, color: colour }}>
              {category}
            </span>
          )}
          {mod && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300">
              {mod}
            </span>
          )}
        </div>
      </div>
      <button onClick={onClose} className="text-muted hover:text-primary text-lg leading-none pt-0.5">✕</button>
    </div>
  )
}
