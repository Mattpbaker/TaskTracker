export function assignCardPositions<T extends { id: string }>(
  tasks: T[]
): Array<T & { position: 'above' | 'below' }> {
  return tasks.map((task, i) => ({ ...task, position: i % 2 === 0 ? 'above' : 'below' as const }))
}
