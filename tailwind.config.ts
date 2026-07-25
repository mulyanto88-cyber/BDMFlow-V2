import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))',     foreground: 'hsl(var(--primary-foreground))'     },
        secondary:   { DEFAULT: 'hsl(var(--secondary))',   foreground: 'hsl(var(--secondary-foreground))'   },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))',       foreground: 'hsl(var(--muted-foreground))'       },
        accent:      { DEFAULT: 'hsl(var(--accent))',      foreground: 'hsl(var(--accent-foreground))'      },
        popover:     { DEFAULT: 'hsl(var(--popover))',     foreground: 'hsl(var(--popover-foreground))'     },
        card:        { DEFAULT: 'hsl(var(--card))',        foreground: 'hsl(var(--card-foreground))'        },
        // Translucent overlays that flip per theme: white-on-dark, black-on-light,
        // slate hairlines on light. Use these instead of bg-white/[0.0x] and
        // border-white/[..], which only read correctly on a dark ground.
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          4: 'var(--surface-4)',
          5: 'var(--surface-5)',
        },
        line: {
          1: 'var(--line-1)',
          2: 'var(--line-2)',
          3: 'var(--line-3)',
          4: 'var(--line-4)',
          5: 'var(--line-5)',
          6: 'var(--line-6)',
        },
        gold: {
          300: '#f3db99',
          400: '#e7b733',
          500: '#c49a1a',
          600: '#9c7b15',
          700: '#755c10',
        },
        navy: {
          500: '#4168b4',
          600: '#1b2a4a',
          700: '#152240',
          800: '#0f1a36',
          900: '#0a122c',
          950: '#050a1f',
        },
      },
      fontFamily: {
        // Inter as the single source of truth for UI text
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        // JetBrains Mono for numbers, ticker, timestamps, codes
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Keep existing scale, add a few useful additions
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem'     }],
        sm:    ['0.875rem', { lineHeight: '1.25rem'  }],
        base:  ['1rem',     { lineHeight: '1.5rem'   }],
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'gold':          '0 0 30px rgba(231, 183, 51, 0.18)',
        'gold-lg':       '0 0 60px rgba(231, 183, 51, 0.25)',
        'glass-sm':      '0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glass-md':      '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        'glass-lg':      '0 16px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.25)',
        'glow-rose':    '0 0 25px rgba(244, 63, 94, 0.25)',
        'glow-primary': '0 0 30px rgba(var(--primary-glow-rgb), 0.28)',
      },
      animation: {
        'fade-in':        'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-ring':     'pulse-ring 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':        'shimmer 1.8s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 4s ease-in-out infinite',
        'float-slow':     'float-slow 6s ease-in-out infinite',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(var(--primary-glow-rgb), 0.5)' },
          '70%': { transform: 'scale(1)', boxShadow: '0 0 0 10px rgba(var(--primary-glow-rgb), 0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(var(--primary-glow-rgb), 0)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
