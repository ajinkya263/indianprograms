import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#070510',
        saffron: '#E8970A',
        'saffron-light': '#F5B642',
        'saffron-dark': '#C67D08',
        'dark-card': '#0F0D1A',
        'dark-border': '#1A1726',
        'dark-surface': '#12101E',
        // Festive accent colors
        'rang-red': '#D94F4F',
        'rang-pink': '#E85D75',
        'rang-purple': '#9B59B6',
        'rang-teal': '#1ABC9C',
        'rang-gold': '#F4C430',
        'peacock': '#2E8B8B',
        'mehendi': '#6B8E23',
        'india-saffron': '#FF9933',
        'india-white': '#FFFFFF',
        'india-green': '#138808',
        'india-navy': '#000080',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
