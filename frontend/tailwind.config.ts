import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        primary: {
          50: '#EEF4FF',
          100: '#E0EBFF',
          200: '#C7D9FE',
          300: '#A4BFFD',
          400: '#7599FB',
          500: '#1A5CFF', // Main brand primary blue
          600: '#0043F0',
          700: '#0033C7',
          800: '#032CA0',
          900: '#0B297E',
          DEFAULT: '#1A5CFF',
        },
        slate: {
          850: '#151E2E',
        },
      },
      borderRadius: {
        card: '14px',
        cardLg: '16px',
        chip: '9999px',
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0, 0, 0, 0.04)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        hover: '0 10px 25px -3px rgba(0, 0, 0, 0.08)',
        modal: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      maxWidth: {
        feed: '680px',
      },
    },
  },
  plugins: [],
};

export default config;
