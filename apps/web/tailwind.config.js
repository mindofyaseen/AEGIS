/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0d14',
          card: '#0f1420',
          border: '#1f293d',
          accent: '#00f0ff',
          neon: '#7928ca',
          danger: '#ff0055',
          warning: '#ffaa00',
          success: '#00ffaa'
        }
      }
    },
  },
  plugins: [],
}
