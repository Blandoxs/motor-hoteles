export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
        accent: { DEFAULT: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
        success: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: { mono: ['JetBrains Mono', 'monospace'], sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}