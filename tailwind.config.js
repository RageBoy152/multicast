/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        "Quantico": ["Quantico", "sans-serif"],
        "Orbitron": ["Orbitron", "sans-serif"]
      },
      colors: {
        body: "#191D26",
        primary: "#15161B",
        secondary: "#434B5E",
        accent: "#2F419C",
        text: "#C4CAD1",
        "text-shade": "#aeb6c0"
      }
    },
    fontSize: {
      xxs: '0.7rem',
      xs: '0.8rem',
      sm: '1.1rem',
      base: '1.2rem',
      l: '1.3rem',
      xl: '1.5rem',
      xxl: '2rem'
    }
  },
  plugins: [],
}

