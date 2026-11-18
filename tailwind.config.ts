import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#090B12',
        panel: '#10131D',
        surface: '#171B29',
        accent: '#8B7CFF',
        accent2: '#A78BFA',
        ink: '#F5F5FA',
        mute: '#9CA3B8',
        line: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '0.5rem', lg: '0.75rem', xl: '1rem' },
      boxShadow: {
        soft: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        lift: '0 12px 40px -16px rgba(139,124,255,0.35)',
      },
    },
  },
  plugins: [],
};
export default config;
