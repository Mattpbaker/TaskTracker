export default function DashboardSkeleton() {
  const WEEK_COUNT = 8
  const cardCounts = [2, 3, 1, 2, 1, 1, 2, 1]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header bar skeleton */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
        <div className="h-3 w-24 bg-border rounded animate-pulse" />
        <div className="h-3 w-36 bg-border rounded animate-pulse" />
        <div className="ml-auto h-7 w-52 bg-border rounded-lg animate-pulse" />
      </div>
      {/* Weekly columns skeleton */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex h-full gap-2" style={{ minWidth: `${WEEK_COUNT * 220}px` }}>
          {cardCounts.map((count, i) => (
            <div
              key={i}
              className="flex-1 min-w-[200px] rounded-xl border border-border overflow-hidden"
            >
              <div className="px-3 pt-3 pb-2 border-b border-border">
                <div className="h-2.5 w-12 bg-border rounded animate-pulse mb-2" />
                <div className="h-2 w-20 bg-border rounded animate-pulse mb-2" />
                <div className="h-0.5 bg-border rounded-full" />
              </div>
              <div className="p-2 space-y-1.5">
                {Array.from({ length: count }).map((_, j) => (
                  <div key={j} className="rounded-lg p-2.5 border border-border bg-surface">
                    <div className="h-2.5 bg-border rounded animate-pulse mb-2 w-4/5" />
                    <div className="h-2 bg-border rounded animate-pulse mb-2 w-2/5" />
                    <div className="h-0.5 bg-border rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
