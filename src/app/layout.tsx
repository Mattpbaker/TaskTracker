import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

// Runs synchronously before first paint — reads localStorage or system preference
const themeScript = `(function(){try{var t=localStorage.getItem('tt-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`

export const metadata: Metadata = {
  title: 'TaskTracker',
  description: 'University task tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      {/* dangerouslySetInnerHTML script must be direct child of <html>, before <body>,
          with NO async/defer — it must run synchronously before paint */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <body>{children}</body>
    </html>
  )
}
