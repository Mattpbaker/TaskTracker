interface Props { position: 'above' | 'below'; colour: string }

export default function TimelineStem({ position, colour }: Props) {
  return (
    <div
      className="w-px h-5 flex-shrink-0"
      style={{
        background: position === 'above'
          ? `linear-gradient(to top, ${colour}60, transparent)`
          : `linear-gradient(to bottom, ${colour}60, transparent)`,
      }}
    />
  )
}
