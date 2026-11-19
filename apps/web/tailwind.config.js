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
          bg: '#090D15',
          bgSecondary: '#0E1520',
          panel: '#121C29',
          panelElevated: '#172335',
          border: '#263549',
          borderLight: '#354863',
          textPrimary: '#EFF5FF',
          textSecondary: '#91A2B9',
          textMuted: '#5E7088',
          accentBlue: '#4E9EFF',
          accentCyan: '#53C8DE',
          aiViolet: '#A98BFF',
          success: '#36C995',
          warning: '#EBAE58',
          critical: '#F06E77'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'panel-elevated': '0 10px 30px -5px rgba(0, 0, 0, 0.7)',
        'glow-cyan': '0 0 20px -3px rgba(83, 200, 222, 0.25)',
        'glow-critical': '0 0 20px -3px rgba(240, 110, 119, 0.3)',
        'glow-ai': '0 0 20px -3px rgba(169, 139, 255, 0.25)',
        'glow-success': '0 0 20px -3px rgba(54, 201, 149, 0.25)'
      }
    },
  },
  plugins: [],
}
