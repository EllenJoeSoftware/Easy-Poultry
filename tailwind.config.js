/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': 'calc(var(--radius) + 4px)',
        '3xl': 'calc(var(--radius) + 12px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        /* Brand colour scales */
        moss: {
          50:  '#EEF5F1',
          100: '#D4E6DB',
          200: '#A9CDB8',
          300: '#7DB395',
          400: '#4F9272',
          500: '#2E6F50',
          600: '#174D35',
          700: '#123E2B',
          800: '#0D2E20',
          900: '#081E15',
        },
        fresh: {
          50:  '#F2F7EC',
          100: '#E0EDD3',
          200: '#C3DBAA',
          300: '#A3C784',
          400: '#8AB86B',
          500: '#78A95B',
          600: '#5F8A47',
          700: '#4A6D37',
        },
        terracotta: {
          50:  '#FCEEEA',
          100: '#F8D9CF',
          200: '#F1B59E',
          300: '#EB916D',
          400: '#E07A5F',
          500: '#C9603F',
          600: '#A84A30',
          700: '#843722',
          800: '#5F2618',
          900: '#3D170E',
        },
        yolk: {
          50:  '#FDF6E7',
          100: '#FAE8C1',
          200: '#F4D28A',
          300: '#EEBB5C',
          400: '#E6A33B',
          500: '#C8861F',
          600: '#9F6A17',
          700: '#7D5312',
          800: '#5C3D0D',
        },
        cream: {
          DEFAULT: '#F3F5EF',
          deep: '#E6EADF',
        },
        ink: {
          DEFAULT: '#16201B',
          soft: '#243830',
        },
        sage: {
          DEFAULT: '#A3B18A',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(27,27,31,0.04), 0 8px 24px -10px rgba(27,27,31,0.08)',
        'lift': '0 1px 2px rgba(27,27,31,0.05), 0 18px 40px -12px rgba(27,27,31,0.16)',
        'glow-moss': '0 0 0 4px rgba(58,90,64,0.12)',
        'glow-terracotta': '0 0 0 4px rgba(224,122,95,0.18)',
      },
      backgroundImage: {
        'cream-gradient': 'linear-gradient(180deg, #F3F5EF 0%, #E6EADF 100%)',
        'moss-gradient': 'linear-gradient(135deg, #174D35 0%, #0D2E20 100%)',
        'fresh-gradient': 'linear-gradient(135deg, #78A95B 0%, #4A6D37 100%)',
        'terracotta-gradient': 'linear-gradient(135deg, #E07A5F 0%, #A84A30 100%)',
        'amber-gradient': 'linear-gradient(135deg, #E6A33B 0%, #C8861F 100%)',
        'sunrise': 'linear-gradient(135deg, #F4B860 0%, #E07A5F 100%)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'float': {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
