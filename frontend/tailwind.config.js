/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neon color palette
        'neon-cyan': '#00ffff',
        'neon-cyan-dark': '#00d9ff',
        'neon-pink': '#ff006e',
        'neon-pink-bright': '#ff1493',
        'neon-purple': '#b537f2',
        'neon-purple-light': '#9d4edd',
        'dark-bg': '#0a0a0f',
        'dark-card': '#161619',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.25)',
        'glow-cyan-lg': '0 0 30px rgba(0, 255, 255, 0.6), 0 0 60px rgba(0, 255, 255, 0.3)',
        'glow-pink': '0 0 20px rgba(255, 0, 110, 0.5), 0 0 40px rgba(255, 0, 110, 0.25)',
        'glow-pink-lg': '0 0 30px rgba(255, 0, 110, 0.6), 0 0 60px rgba(255, 0, 110, 0.3)',
        'glow-purple': '0 0 20px rgba(181, 55, 242, 0.5), 0 0 40px rgba(181, 55, 242, 0.25)',
        'glow-purple-lg': '0 0 30px rgba(181, 55, 242, 0.6), 0 0 60px rgba(181, 55, 242, 0.3)',
      },
      textShadow: {
        'glow-cyan': '0 0 20px rgba(0, 255, 255, 0.5)',
        'glow-pink': '0 0 20px rgba(255, 0, 110, 0.5)',
        'glow-purple': '0 0 20px rgba(181, 55, 242, 0.5)',
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'neon-glow': 'neon-glow 3s ease-in-out infinite',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'neon-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 255, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
