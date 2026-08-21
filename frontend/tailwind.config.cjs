module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F9F1',
          100: '#DCF1DF',
          200: '#B8E3C0',
          300: '#8ACD98',
          400: '#57B36D',
          500: '#2F9E52',
          600: '#15803D',
          700: '#166534',
          800: '#14532D',
          900: '#14532D',
        },
        warm: {
          50: '#F7F7F5',
          100: '#EDEDE9',
          200: '#DCDCD6',
          300: '#C2C2BA',
          400: '#9B9B92',
          500: '#7A7A71',
          600: '#5B5B54',
          700: '#454540',
          800: '#2E2E2A',
          900: '#1C1C1A',
        },
        accent: {
          50: '#FBF2EE',
          100: '#F6E2D8',
          200: '#EDC6B3',
          300: '#E0A184',
          400: '#D17D59',
          500: '#C25E37',
          600: '#A8482A',
          700: '#8C3A22',
        },
      },
      fontFamily: {
        display: ['"Sora"', '"Manrope"', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(28,28,26,0.05)',
        'sm': '0 1px 3px rgba(28,28,26,0.06), 0 1px 2px rgba(28,28,26,0.04)',
        'md': '0 4px 12px rgba(28,28,26,0.06), 0 2px 4px rgba(22,128,61,0.05)',
        'lg': '0 12px 28px rgba(28,28,26,0.08), 0 4px 10px rgba(22,128,61,0.06)',
        'xl': '0 20px 44px rgba(28,28,26,0.12), 0 8px 16px rgba(22,128,61,0.08)',
        'brand-sm': '0 2px 8px rgba(22,128,61,0.15)',
        'brand-md': '0 4px 16px rgba(22,128,61,0.2)',
      },
      animation: {
        'fade-in': 'fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in-up': 'fade-in-up 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slide-down 160ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 160ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-soft': 'pulse-soft 2000ms ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
