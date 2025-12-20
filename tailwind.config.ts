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
        regola: ['"Regola Pro"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'Monaco', 'monospace'],
      },
      fontWeight: {
        'book': '300',      // Regola Pro Book
        'normal': '400',    // Regola Pro Regular  
        'medium': '500',    // Regola Pro Medium
        'mono': '500',      // Geist Mono Medium (using JetBrains Mono)
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // 0G Labs Colors
        black: '#000000',
        white: '#FEFEFE',
        'gray-1': '#E5E5E5',
        'purple-shade': '#9200E1',
        'purple-1': '#B75FFF',
        'purple-2': '#CB8AFF',
        'purple-3': '#D5A3FF',
        'purple-4': '#E3C1FF',
        // Light mode gray palette
        gray: {
          50: '#FAFBFC',
          100: '#F4F6F8',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
          950: '#0A0C0E',
        },
        // 0G Labs Primary colors based on purple
        primary: {
          50: '#F3E8FF',
          100: '#E9D5FF',
          200: '#D8B4FE',
          300: '#C084FC',
          400: '#A855F7',
          500: '#9200E1',
          600: '#7A00BD',
          700: '#6B00A3',
          800: '#5B0088',
          900: '#4C0070',
          950: '#2D0042',
        },
        secondary: {
          50: '#F8F7FF',
          100: '#F1EDFF',
          200: '#E6DEFF',
          300: '#D5A3FF',
          400: '#CB8AFF',
          500: '#B75FFF',
          600: '#A855F7',
          700: '#9333EA',
          800: '#7C2D92',
          900: '#5B2170',
          950: '#3B1347',
        },
        accent: {
          50: '#FDF4FF',
          100: '#FAE8FF',
          200: '#F5D0FE',
          300: '#F0ABFC',
          400: '#E879F9',
          500: '#D946EF',
          600: '#C026D3',
          700: '#A21CAF',
          800: '#86198F',
          900: '#701A75',
          950: '#4A044E',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
        // Surface colors for cards and components
        surface: {
          50: '#FFFFFF',
          100: '#FAFBFC',
          200: '#F4F6F8',
          300: '#E9ECEF',
          400: '#DEE2E6',
          500: '#CED4DA',
        },
        // Border colors
        border: {
          light: '#E9ECEF',
          DEFAULT: '#DEE2E6',
          dark: '#ADB5BD',
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
        'glow': '0 0 20px rgba(146, 0, 225, 0.3)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.04)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.06)',
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