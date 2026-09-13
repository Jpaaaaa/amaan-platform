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
          bg: '#ECEEF1',
          card: '#FFFFFF',
          border: '#E5E7EB',
        },
        brand: {
          DEFAULT: '#4F46E5',
          muted: '#EEF2FF',
          mid: '#4338CA',
          deep: '#3730A3',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F9FAFB',
          variant: '#F9FAFB',
        },
        label: {
          DEFAULT: '#111827',
          2: '#6B7280',
          3: '#9CA3AF',
          4: '#D1D5DB',
        },
        primary: {
          DEFAULT: '#4F46E5',
          container: '#EEF2FF',
          on: '#FFFFFF',
          'on-container': '#3730A3',
        },
        accent: {
          DEFAULT: '#4F46E5',
          muted: '#EEF2FF',
        },
        success: {
          DEFAULT: '#059669',
          muted: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#D97706',
          muted: '#FFFBEB',
        },
        danger: {
          DEFAULT: '#DC2626',
          muted: '#FEF2F2',
        },
        'on-surface': {
          DEFAULT: '#111827',
          variant: '#6B7280',
        },
      },
      borderRadius: {
        card: '20px',
        sheet: '20px',
        input: '12px',
        island: '28px',
      },
      boxShadow: {
        premium: '0 8px 24px rgba(17,24,39,0.06)',
        island: '0 4px 20px rgba(17,24,39,0.05)',
        sheet: '0 -4px 12px rgba(17,24,39,0.08)',
        drawer: '-8px 0 32px rgba(17,24,39,0.10)',
        sm: '0 1px 2px rgba(17,24,39,0.06)',
        lg: '0 25px 50px -12px rgba(17,24,39,0.12)',
        elevation: '0 1px 2px rgba(17,24,39,0.05)',
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
