interface Props { position: 'above' | 'below'; colour: string; lane: number }

const LANE_HEIGHT = 90

export default function TimelineStem({ position, colour, lane }: Props) {
  const height = 20 + lane * LANE_HEIGHT
  return (
    <div
      className="w-px flex-shrink-0"
      style={{
        height: `${height}px`,
        background: position === 'above'
          ? `linear-gradient(to bottom, transparent, ${colour}80)`
          : `linear-gradient(to top, transparent, ${colour}80)`,
      }}
    />
  )
}
