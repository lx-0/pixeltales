/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('../../packages/shadcn-ui/tailwind.preset.js')],
  plugins: [require('tailwindcss-animate')],
};
