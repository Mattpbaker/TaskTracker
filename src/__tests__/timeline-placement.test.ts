import { assignCardPositions } from '@/lib/timeline'

// Tasks a and b are close together (~4 days apart) so b collides with a in
// above-0 and falls to below-0. Task c is far enough away to fit in above-0.
// SEARCH_ORDER: above-0, below-0, above-1 → results: above, below, above.
const WIDTH = 900

test('even-indexed cards go above, odd below', () => {
  const tasks = [
    { id: 'a', dueDate: '2026-03-28' }, // pct ≈ 13% — fills above-0
    { id: 'b', dueDate: '2026-04-01' }, // pct ≈ 20% — collides above-0, fills below-0
    { id: 'c', dueDate: '2026-04-18' }, // pct ≈ 52% — fits above-0 (a's end ≈ 21%)
  ]
  const result = assignCardPositions(tasks, WIDTH)
  expect(result[0].position).toBe('above')
  expect(result[1].position).toBe('below')
  expect(result[2].position).toBe('above')
})

test('single task goes above', () => {
  const result = assignCardPositions([{ id: 'x', dueDate: '2026-04-01' }], WIDTH)
  expect(result[0].position).toBe('above')
})

test('empty array returns empty', () => {
  expect(assignCardPositions([], WIDTH)).toEqual([])
})
