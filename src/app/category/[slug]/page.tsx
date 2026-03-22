export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <p className="p-8 text-emerald-300">Category: {slug} — coming soon</p>
}
