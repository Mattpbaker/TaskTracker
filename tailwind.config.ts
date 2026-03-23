import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'cat-social':   '#10b981',
        'cat-recog':    '#6366f1',
        'cat-tracking': '#14b8a6',
        'cat-training': '#ec4899',
        'cat-report':   '#f59e0b',
        'cat-video':    '#a3e635',
        'cat-working':  '#8b5cf6',
        background: 'var(--background)',
        surface:    'var(--surface)',
        border:     'var(--border)',
        primary:    'var(--text-primary)',
        secondary:  'var(--text-secondary)',
        muted:      'var(--text-muted)',
      },
    },
  },
  plugins: [],
}
export default config
