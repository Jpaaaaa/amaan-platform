/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        obsidian: {
          bg: '#f0f4fa',
          card: 'rgba(255,255,255,0.94)',
          border: 'rgba(15,23,42,0.08)',
        },
        brand: {
          DEFAULT: '#0d92ff',
          mid: '#0a6ecf',
          deep: '#054a9e',
        },
        surface: {
          DEFAULT: '#ffffff',
          variant: '#e8eef5',
        },
        label: {
          DEFAULT: '#0f172a',
          2: '#475569',
          3: '#64748b',
          4: '#94a3b8',
        },
        primary: {
          DEFAULT: '#0d92ff',
          container: '#d2e9ff',
          on: '#ffffff',
          'on-container': '#001d3d',
        },
        accent: {
          DEFAULT: '#4f46e5',
          muted: 'rgba(99,102,241,0.12)',
        },
        'on-surface': {
          DEFAULT: '#0c1520',
          variant: '#5c6b7d',
        },
      },
      borderRadius: {
        card: '24px',
        sheet: '20px',
        input: '12px',
      },
      boxShadow: {
        premium:
          '0 12px 40px -12px rgba(15,23,42,0.1), 0 0 0 1px rgba(15,23,42,0.08)',
        sm: '0 1px 2px rgba(15,23,42,0.06)',
        lg: '0 25px 50px -12px rgba(15,23,42,0.12)',
        elevation: '0 4px 12px rgba(15,23,42,0.1)',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease',
        'modal-enter': 'modal-enter 0.28s cubic-bezier(0.34,1.15,0.64,1)',
        spin: 'spin 0.65s linear infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'modal-enter': {
          from: { opacity: '0', transform: 'scale(0.94) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
