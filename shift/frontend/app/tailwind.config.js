/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        shift: {
          bg: 'var(--shift-bg)',
          card: 'var(--shift-card)',
          day: 'var(--shift-day-bg)',
          border: 'var(--shift-border)',
          accent: 'var(--shift-accent)',
          muted: 'var(--shift-muted)',
        },
      },
      maxWidth: {
        calendar: '1440px',
      },
    },
  },
  plugins: [],
};
