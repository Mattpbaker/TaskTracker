import { createClient } from '@supabase/supabase-js'
import { generateInstances } from '../src/lib/recurrence'
import { COURSE_START, COURSE_END, CATEGORY_COLOURS } from '../src/lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const categories = [
  { name: 'Social Media',        slug: 'social-media',     colour: CATEGORY_COLOURS['social-media'] },
  { name: 'Recognition Day',     slug: 'recognition-day',  colour: CATEGORY_COLOURS['recognition-day'] },
  { name: 'Tracking Systems',    slug: 'tracking-systems', colour: CATEGORY_COLOURS['tracking-systems'] },
  { name: 'Training',            slug: 'training',         colour: CATEGORY_COLOURS['training'] },
  { name: 'Annual Report',       slug: 'annual-report',    colour: CATEGORY_COLOURS['annual-report'] },
  { name: 'Video & Q&A',         slug: 'video-qa',         colour: CATEGORY_COLOURS['video-qa'] },
  { name: 'Working Groups',      slug: 'working-groups',   colour: CATEGORY_COLOURS['working-groups'] },
]

async function seed() {
  console.log('Seeding categories...')
  const { data: cats, error: catErr } = await supabase.from('categories').insert(categories).select()
  if (catErr) throw catErr

  const bySlug = Object.fromEntries(cats.map(c => [c.slug, c.id]))

  console.log('Seeding one-off tasks...')
  await supabase.from('tasks').insert([
    {
      category_id: bySlug['recognition-day'],
      title: 'Team Company Review of Objectives',
      module: 'Self Leadership',
      start_date: '2026-03-23',
      due_date: '2026-03-26',
      progress: 0,
    },
    {
      category_id: bySlug['working-groups'],
      title: 'Storyboard Assignment',
      module: 'Self Leadership',
      start_date: '2026-03-30',
      due_date: '2026-04-03',
      progress: 0,
    },
    {
      category_id: null,
      title: 'All Portfolios Due',
      module: 'All modules',
      due_date: '2026-04-27',
      due_time: '14:00',
      progress: 0,
    },
    {
      category_id: bySlug['annual-report'],
      title: 'Annual Report Submission',
      due_date: '2026-05-08',
      due_time: '14:00',
      progress: 0,
    },
    {
      category_id: bySlug['video-qa'],
      title: 'Annual Report Video',
      due_date: '2026-05-11',
      due_time: '12:00',
      progress: 0,
    },
    {
      category_id: bySlug['video-qa'],
      title: 'Annual Report Q&A',
      due_date: '2026-05-14',
      due_time: '09:30',
      progress: 0,
    },
  ])

  console.log('Seeding recurring templates and instances...')
  const recurringDefs = [
    { title: 'LinkedIn Post',          slug: 'social-media',     rule: 'weekly:any' },
    { title: 'Team Website Update',    slug: 'social-media',     rule: 'weekly:any' },
    { title: 'Check Tracking Systems', slug: 'tracking-systems', rule: 'weekly:any' },
    { title: 'Training Session',       slug: 'training',         rule: 'weekly:tuesday,thursday' },
  ]

  for (const def of recurringDefs) {
    const { data: tmpl, error: tmplErr } = await supabase.from('tasks').insert({
      category_id:    bySlug[def.slug],
      title:          def.title,
      due_date:       '2026-03-21',
      is_recurring:   true,
      is_template:    true,
      recurrence_rule: def.rule,
      progress:       0,
    }).select().single()
    if (tmplErr) throw tmplErr

    const dates = generateInstances(def.rule, COURSE_START, COURSE_END)
    const instances = dates.map(d => ({
      category_id:    bySlug[def.slug],
      title:          def.title,
      due_date:       d.toISOString().slice(0, 10),
      is_recurring:   true,
      is_template:    false,
      parent_task_id: tmpl.id,
      progress:       0,
    }))
    const { error: instErr } = await supabase.from('tasks').insert(instances)
    if (instErr) throw instErr
    console.log(`  ${def.title}: ${instances.length} instances`)
  }

  console.log('Seed complete.')
}

seed().catch(console.error)
