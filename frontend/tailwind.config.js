/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kivo: {
          50: '#EEF4FF', 100: '#DCE7FD', 200: '#B9CFFB', 300: '#8AAEF8',
          400: '#5B8BF4', 500: '#2E63EE', 600: '#1B4FD6', 700: '#153FAE',
          800: '#0F3186', 900: '#0B2563',
        },
        stronger: '#2563EB',
        fitter: '#16A34A',
        faster: '#F59E0B',
        champs: '#8B5CF6',
        ink: '#0F1B2D',
        mist: '#F4F6FB',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        card: '0 8px 30px rgba(15,27,45,0.08)',
        pop: '0 12px 40px rgba(27,79,214,0.22)',
      },
    },
  },
  plugins: [],
};
