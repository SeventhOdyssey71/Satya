import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        russo: ['var(--font-russo)', 'sans-serif'],
        albert: ['var(--font-albert)', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Apple-inspired clean gray palette
        gray: {
          50: '#fafafa',
          100: '#f5f5f7',
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#a1a1a6',
          500: '#86868b',
          600: '#6e6e73',
          700: '#515154',
          800: '#3a3a3c',
          900: '#1d1d1f',
          950: '#000000',
        },
        // Legacy support - map to new gray scale
        primary: {
          50: '#fafafa',
          100: '#f5f5f7',
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#a1a1a6',
          500: '#86868b',
          600: '#6e6e73',
          700: '#515154',
          800: '#3a3a3c',
          900: '#1d1d1f',
          950: '#000000',
        },
        secondary: {
          50: '#fafafa',
          100: '#f5f5f7',
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#a1a1a6',
          500: '#86868b',
          600: '#6e6e73',
          700: '#515154',
          800: '#3a3a3c',
          900: '#1d1d1f',
          950: '#000000',
        },
        accent: {
          50: '#fafafa',
          100: '#f5f5f7',
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#a1a1a6',
          500: '#86868b',
          600: '#6e6e73',
          700: '#515154',
          800: '#3a3a3c',
          900: '#1d1d1f',
          950: '#000000',
        },
        success: {
          50: '#fafafa',
          100: '#f5f5f7',
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#a1a1a6',
          500: '#86868b',
          600: '#6e6e73',
          700: '#515154',
          800: '#3a3a3c',
          900: '#1d1d1f',
          950: '#000000',
        },
        warning: {
          50: '#fafafa',
          100: '#f5f5f7',
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#a1a1a6',
          500: '#86868b',
          600: '#6e6e73',
          700: '#515154',
          800: '#3a3a3c',
          900: '#1d1d1f',
          950: '#000000',
        },
        danger: {
          50: '#fafafa',
          100: '#f5f5f7',
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#a1a1a6',
          500: '#86868b',
          600: '#6e6e73',
          700: '#515154',
          800: '#3a3a3c',
          900: '#1d1d1f',
          950: '#000000',
        },
        // Surface colors for cards and components
        surface: {
          50: '#ffffff',
          100: '#fafafa',
          200: '#f5f5f7',
          300: '#e8e8ed',
          400: '#d2d2d7',
          500: '#a1a1a6',
        },
        // Border colors
        border: {
          light: '#e8e8ed',
          DEFAULT: '#d2d2d7',
          dark: '#a1a1a6',
        }
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'large': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 20px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'lg': '0 4px 16px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [],
}
export default config