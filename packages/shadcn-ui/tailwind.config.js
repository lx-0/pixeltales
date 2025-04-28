/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    // Match any component library files
    '../../packages/**/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('./tailwind.preset.js')],
  plugins: [require('tailwindcss-animate')],
};
