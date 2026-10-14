import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // DESIGN.md §3 tokens
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        surface: 'var(--surface)',
        panel: {
          DEFAULT: 'var(--panel)',
          sunk: 'var(--panel-sunk)',
        },
        line: 'var(--line)',
        cobalt: {
          DEFAULT: 'var(--cobalt)',
          soft: 'var(--cobalt-soft)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          soft: 'var(--amber-soft)',
        },
        green: 'var(--green)',
        red: 'var(--red)',
        cat: {
          mfg: 'var(--cat-mfg)',
          news: 'var(--cat-news)',
          products: 'var(--cat-products)',
          wholesale: 'var(--cat-wholesale)',
          d2c: 'var(--cat-d2c)',
          tech: 'var(--cat-tech)',
        },

        // Legacy / Compatibility aliases
        background: 'var(--surface)',
        primary: {
          50: 'var(--cobalt-soft)',
          100: '#E0EBFF',
          200: '#C7D9FE',
          300: '#A4BFFD',
          400: '#7599FB',
          500: 'var(--cobalt)',
          600: '#2338B3',
          700: '#1D2E94',
          800: '#172473',
          900: '#101A52',
          DEFAULT: 'var(--cobalt)',
        },
      },
      borderRadius: {
        card: '10px',
        panel: '10px',
        btn: '8px',
        input: '8px',
        pill: '999px',
        chip: '999px',
      },
      boxShadow: {
        floating: '0 8px 24px -8px rgb(20 33 61 / 0.18), 0 2px 6px -2px rgb(20 33 61 / 0.08)',
        soft: '0 1px 3px rgba(20, 33, 61, 0.04)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        feed: '640px',
        rail: '320px',
        nav: '240px',
        app: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
