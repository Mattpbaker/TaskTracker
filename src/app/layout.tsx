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
      <head>
        {/* Runs synchronously before first paint to apply dark class — must be sync, no defer/async */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
