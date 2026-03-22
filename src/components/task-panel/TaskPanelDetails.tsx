interface AssignmentDetails {
  weighting?: string
  format?: string
  brief?: string
  requirements?: string[]
}

export default function TaskPanelDetails({ details }: { details: AssignmentDetails | null }) {
  if (!details || (!details.weighting && !details.brief)) {
    return (
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold mb-3">
          Assignment Details <span className="normal-case tracking-normal text-emerald-950 font-normal ml-1 border border-border rounded px-1.5 py-0.5">from module handbook</span>
        </p>
        <p className="text-xs text-emerald-950 italic">Details will be added after handbook review.</p>
      </div>
    )
  }
  return (
    <div className="px-5 py-4 border-b border-border">
      <p className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold mb-3">
        Assignment Details <span className="normal-case tracking-normal text-emerald-950 font-normal ml-1 border border-border rounded px-1.5 py-0.5">from module handbook</span>
      </p>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {(details.weighting || details.format) && (
          <div className="grid grid-cols-2 border-b border-border">
            {details.weighting && (
              <div className="p-3 border-r border-border">
                <p className="text-[9px] text-emerald-950 uppercase tracking-wide mb-1">Weighting</p>
                <p className="text-lg font-bold text-cat-social">{details.weighting}</p>
              </div>
            )}
            {details.format && (
              <div className="p-3">
                <p className="text-[9px] text-emerald-950 uppercase tracking-wide mb-1">Format</p>
                <p className="text-sm font-semibold text-emerald-300">{details.format}</p>
              </div>
            )}
          </div>
        )}
        {details.brief && (
          <div className="p-3 border-b border-border">
            <p className="text-[9px] text-emerald-950 uppercase tracking-wide mb-2">Brief</p>
            <p className="text-xs text-emerald-400 leading-relaxed">{details.brief}</p>
          </div>
        )}
        {details.requirements && details.requirements.length > 0 && (
          <div className="p-3">
            <p className="text-[9px] text-emerald-950 uppercase tracking-wide mb-2">Key Requirements</p>
            <ul className="flex flex-col gap-1.5">
              {details.requirements.map((r, i) => (
                <li key={i} className="flex gap-2 text-xs text-emerald-800">
                  <span className="text-cat-social flex-shrink-0">›</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
