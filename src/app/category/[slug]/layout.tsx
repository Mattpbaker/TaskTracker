import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function CategoryLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('categories').select('*').eq('slug', slug).single()
  if (!data) notFound()
  return <>{children}</>
}
