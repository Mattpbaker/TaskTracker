export const COURSE_START = new Date('2026-03-21T00:00:00.000Z')
export const COURSE_END   = new Date('2026-05-14T23:59:59.999Z')

export const CATEGORY_COLOURS: Record<string, string> = {
  'social-media':     '#10b981',
  'recognition-day':  '#6366f1',
  'tracking-systems': '#14b8a6',
  'training':         '#ec4899',
  'annual-report':    '#f59e0b',
  'video-qa':         '#a3e635',
  'working-groups':   '#8b5cf6',
}

export interface CategoryGroup {
  id: string
  name: string
  slug: string
  colour: string
  memberSlugs: string[]
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'group-reports-media',
    name: 'Reports & Media',
    slug: 'reports-media',
    colour: '#f59e0b',
    memberSlugs: ['recognition-day', 'annual-report', 'video-qa'],
  },
]

export const GROUPED_SLUGS = new Set(CATEGORY_GROUPS.flatMap(g => g.memberSlugs))
