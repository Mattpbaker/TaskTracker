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
  'enquiry':          '#3b82f6',
  'practice':         '#22c55e',
  'team-company':     '#f97316',
  'self-leadership':  '#e879f9',
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
    name: 'Annual Report',
    slug: 'reports-media',
    colour: '#f59e0b',
    memberSlugs: ['recognition-day', 'annual-report', 'video-qa'],
  },
  {
    id: 'group-modules',
    name: 'Modules',
    slug: 'modules',
    colour: '#3b82f6',
    memberSlugs: ['enquiry', 'practice', 'team-company', 'self-leadership'],
  },
]

export const GROUPED_SLUGS = new Set(CATEGORY_GROUPS.flatMap(g => g.memberSlugs))
