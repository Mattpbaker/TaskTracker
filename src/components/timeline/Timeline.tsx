'use client'
import { useEffect, useRef, useState } from 'react'
import type { Task } from '@/types/app'
import { assignCardPositions, CARD_HALF_WIDTH_PX } from '@/lib/timeline'
import TimelineAxis from './TimelineAxis'
import TimelineCard from './TimelineCard'
import ZoomControls from './ZoomControls'

const BASE_WIDTH = 900
const LANE_HEIGHT = 90

interface Props {
  tasks?: Task[]
  categoryColourMap?: Record<string, string>
  accent?: string
  title?: string
  extra?: React.ReactNode
}

export default function Timeline({ tasks = [], categoryColourMap = {}, accent = '#10b981', title = 'All Tasks — Timeline', extra }: Props) {
  const [zoom, setZoom] = useState(100)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setZoom(z => Math.min(300, Math.max(60, z + (e.deltaY < 0 ? 10 : -10))))
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const innerWidth = (BASE_WIDTH * zoom) / 100
  const positioned = assignCardPositions(tasks, innerWidth)
  const maxLane = positioned.length > 0 ? Math.max(...positioned.map(p => p.lane)) : 0
  // Extra 40px per lane for card height + padding; base 120px for axis labels
  const vertPad = 120 + maxLane * LANE_HEIGHT

  // Suppress unused import warning — CARD_HALF_WIDTH_PX is imported to keep timeline.ts in sync
  void CARD_HALF_WIDTH_PX

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
        <span className="text-[11px] uppercase tracking-widest text-muted font-semibold">{title}</span>
        <span className="text-[11px] text-muted">Mar 21 → May 14 · 54 days</span>
        <ZoomControls zoom={zoom} onZoom={setZoom} />
        {extra}
      </div>
      <div ref={containerRef} className="flex-1 overflow-x-auto overflow-y-hidden px-5 pb-5 flex items-center">
        <div
          className="relative"
          style={{
            minWidth: `${innerWidth}px`,
            width: '100%',
            paddingTop: `${vertPad}px`,
            paddingBottom: `${vertPad}px`,
          }}
        >
          <TimelineAxis accent={accent} />
          {positioned.map(({ position, lane, ...task }) => (
            <TimelineCard
              key={task.id}
              task={task as Task}
              position={position}
              lane={lane}
              colour={categoryColourMap[task.categoryId ?? ''] ?? accent}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
