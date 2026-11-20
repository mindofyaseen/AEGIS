/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aegis: {
          bg: '#0A0C10',
          bgSecondary: '#0F1218',
          panel: '#141822',
          panelHover: '#1A202E',
          panelElevated: '#1A202E',
          raised: '#202738',
          border: 'rgba(255, 255, 255, 0.08)',
          borderLight: 'rgba(255, 255, 255, 0.14)',
          textPrimary: '#F1F4F9',
          textSecondary: '#94A0B8',
          textMuted: '#5E6B82',
          accentBlue: '#0284C7',
          accentCyan: '#0EA5E9',
          aiViolet: '#818CF8',
          success: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'panel': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        'panel-elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.2)'
      }
    },
  },
  plugins: [],
}
