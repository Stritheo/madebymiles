/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#FAFAF9',
          card: '#FFFFFF',
          dark: '#1A1F2E',
          'dark-hover': '#151A26',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#525252',
          accent: '#C87D5C',
          'accent-hover': '#B36F4F',
        },
        border: {
          light: '#E5E5E5',
          'light-hover': '#D4D4D4',
        },
      },
      fontSize: {
        'xl-plus': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
      },
      fontFamily: {
        display: ["'DM Serif Display'", 'Georgia', 'serif'],
        body: ["'IBM Plex Sans'", '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
