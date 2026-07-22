import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
     "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map Tailwind colors to CSS variables
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent': 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'border-primary': 'var(--border)',
        'border-hover': 'var(--border-hover)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
           '0%': { transform: 'translateX(0)' },
           '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
           '0%': { transform: 'translateX(-50%)' },
           '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        marquee: 'marquee 40s linear infinite',
        'marquee-reverse': 'marquee-reverse 40s linear infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
