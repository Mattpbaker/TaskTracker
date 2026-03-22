'use client'
import { useEffect, useRef, useState } from 'react'
import TimelineAxis from './TimelineAxis'
import ZoomControls from './ZoomControls'

const BASE_WIDTH = 900

interface Props {
  accent?: string
  title?: string
  children?: React.ReactNode
}

export default function Timeline({ accent = '#10b981', title = 'All Tasks — Timeline', children }: Props) {
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

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
        <span className="text-[11px] uppercase tracking-widest text-emerald-900 font-semibold">{title}</span>
        <span className="text-[11px] text-emerald-950">Mar 21 → May 14 · 54 days</span>
        <ZoomControls zoom={zoom} onZoom={setZoom} />
      </div>
      {/* Scroll container */}
      <div ref={containerRef} className="flex-1 overflow-x-auto overflow-y-hidden px-5 pb-5 flex items-center">
        <div className="relative" style={{ minWidth: `${innerWidth}px`, width: '100%', paddingTop: '100px', paddingBottom: '100px' }}>
          <TimelineAxis accent={accent} />
          {children}
        </div>
      </div>
    </div>
  )
}
