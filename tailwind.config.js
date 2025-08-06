/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',         // tous les fichiers dans /app/
    './components/**/*.{js,ts,jsx,tsx}',  // tous les composants
    './styles/**/*.{css,scss}',           // tous tes fichiers CSS globaux
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}