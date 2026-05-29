/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── NetLayer lime brand ──
        brand: {
          DEFAULT: '#c8f135',
          hover: '#d4f857',
          dark: '#a8d420',
          50: '#fafee6',
          100: '#f3fcc2',
          200: '#e9fa8c',
          300: '#daf24e',
          400: '#c8f135',
          500: '#a8d420',
          600: '#84ab16',
          700: '#638115',
          800: '#4f6618',
          900: '#43561a',
        },
        // ── Layered dark "ink" surfaces ──
        ink: {
          0: '#080909',
          1: '#0d0e0d',
          2: '#111311',
          3: '#161816',
          4: '#1c1e1c',
          5: '#222422',
          6: '#272927',
          7: '#2e302e',
          8: '#353735',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        brand: '0 0 24px rgba(200, 241, 53, 0.18)',
        'brand-lg': '0 0 48px rgba(200, 241, 53, 0.28)',
        card: '0 8px 32px rgba(0, 0, 0, 0.6)',
        'card-lg': '0 30px 80px -20px rgba(0, 0, 0, 0.7)',
      },
      borderRadius: {
        '2.5xl': '20px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-16px) translateX(8px)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.6' },
          '33%': { transform: 'translate(40px, -30px) scale(1.1)', opacity: '0.8' },
          '66%': { transform: 'translate(-30px, 20px) scale(0.95)', opacity: '0.5' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(200, 241, 53, 0.4)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 0 6px rgba(200, 241, 53, 0)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'border-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        marquee: 'marquee 38s linear infinite',
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        'spin-slow': 'spin-slow 60s linear infinite',
        'spin-reverse': 'spin-slow 90s linear infinite reverse',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 3s linear infinite',
        'border-flow': 'border-flow 6s ease infinite',
      },
    },
  },
  plugins: [],
}
