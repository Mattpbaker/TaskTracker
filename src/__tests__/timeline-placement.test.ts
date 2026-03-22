import { assignCardPositions } from '@/lib/timeline'

test('even-indexed cards go above, odd below', () => {
  const tasks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const result = assignCardPositions(tasks)
  expect(result[0].position).toBe('above')
  expect(result[1].position).toBe('below')
  expect(result[2].position).toBe('above')
})

test('single task goes above', () => {
  const result = assignCardPositions([{ id: 'x' }])
  expect(result[0].position).toBe('above')
})

test('empty array returns empty', () => {
  expect(assignCardPositions([])).toEqual([])
})
