export default {
  plugins: [],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
      dropShadow: {
  'white': '-2px 2px 4px rgba(255, 255, 255, 0.8)',
  'black': '-2px 2px 4px rgba(0, 0, 0, 0.8)',
      },
    },
  },
};
