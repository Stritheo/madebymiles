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
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#525252',
          accent: '#C87D5C',
        },
        border: {
          light: '#E5E5E5',
        },
      },
      fontFamily: {
        display: ["'DM Serif Display'", 'Georgia', 'serif'],
        body: ["'IBM Plex Sans'", '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
