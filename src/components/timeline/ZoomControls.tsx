'use client'
interface Props { zoom: number; onZoom: (z: number) => void }

export default function ZoomControls({ zoom, onZoom }: Props) {
  const clamp = (v: number) => Math.min(300, Math.max(60, v))
  return (
    <div className="flex items-center gap-2 ml-auto">
      <button
        onClick={() => onZoom(clamp(zoom - 10))}
        className="w-6 h-6 flex items-center justify-center bg-surface border border-border rounded text-emerald-800 hover:border-cat-social hover:text-cat-social text-sm"
      >−</button>
      <input
        type="range" min={60} max={300} value={zoom}
        onChange={e => onZoom(parseInt(e.target.value))}
        className="w-24 accent-cat-social"
      />
      <button
        onClick={() => onZoom(clamp(zoom + 10))}
        className="w-6 h-6 flex items-center justify-center bg-surface border border-border rounded text-emerald-800 hover:border-cat-social hover:text-cat-social text-sm"
      >+</button>
      <span className="text-[11px] text-emerald-950 w-9 text-center">{zoom}%</span>
    </div>
  )
}
