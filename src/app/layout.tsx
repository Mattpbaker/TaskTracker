import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TaskTracker',
  description: 'University task tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
