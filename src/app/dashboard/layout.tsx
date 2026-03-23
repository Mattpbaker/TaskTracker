import { getDashboardData } from '@/lib/queries/dashboard'
import AppShell from '@/components/layout/AppShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { stats, categories, taskCounts } = await getDashboardData()
  return (
    <AppShell stats={stats} categories={categories} taskCounts={taskCounts}>
      {children}
    </AppShell>
  )
}
