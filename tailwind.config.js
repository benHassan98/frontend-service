/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}",'./node_modules/preline/dist/*.js','node_modules/flowbite-react/lib/esm/**/*.js'],
  theme: {
    extend: {},
  },
  plugins: [
    require('preline/plugin'),
     require('flowbite/plugin')
  ],
}

