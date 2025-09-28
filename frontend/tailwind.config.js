/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Certifique-se que o Tailwind escaneia seus arquivos React
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(1rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDots: { // Animação para as bolinhas de "Iniciando sistema..."
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up-100': 'fadeInUp 0.7s ease-out forwards',
        'fade-in-up-200': 'fadeInUp 0.7s ease-out 0.1s forwards', // Atraso de 0.1s
        'fade-in-up-300': 'fadeInUp 0.7s ease-out 0.2s forwards', // Atraso de 0.2s
        'fade-in-up-400': 'fadeInUp 0.7s ease-out 0.3s forwards', // Atraso de 0.3s
        'pulse-dots': 'pulseDots 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}