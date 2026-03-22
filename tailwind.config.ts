import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cat-social':   '#10b981',
        'cat-recog':    '#6366f1',
        'cat-tracking': '#14b8a6',
        'cat-training': '#ec4899',
        'cat-report':   '#f59e0b',
        'cat-video':    '#a3e635',
        'cat-working':  '#8b5cf6',
        background:     '#0a0f0a',
        surface:        '#0f1a0f',
        border:         '#1a2e1a',
      },
    },
  },
  plugins: [],
}
export default config
