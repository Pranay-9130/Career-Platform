/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          light: '#60A5FA',
          veryLight: '#EFF6FF',
          bg: '#F8FBFF',
          sky: '#E0F2FE',
          cyan: '#06B6D4',
          border: '#DBEAFE',
          text: '#0F172A',
          muted: '#475569',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(59, 130, 246, 0.05), 0 1px 2px -1px rgba(59, 130, 246, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(59, 130, 246, 0.12), 0 8px 10px -6px rgba(59, 130, 246, 0.08)',
        'modal': '0 20px 30px -10px rgba(15, 23, 42, 0.15), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
