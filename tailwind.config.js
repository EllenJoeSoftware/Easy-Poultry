/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
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
          50:  '#F2F6F2',
          100: '#DCE6DD',
          200: '#B8CCBA',
          300: '#94B197',
          400: '#6F9374',
          500: '#4F7458',
          600: '#3A5A40',
          700: '#2C4632',
          800: '#1F3324',
          900: '#112016',
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
          50:  '#FEF7E8',
          100: '#FCEAC0',
          200: '#F9D688',
          300: '#F4B860',
          400: '#ED9F3A',
          500: '#D7841E',
          600: '#AE6816',
        },
        cream: {
          DEFAULT: '#FAF7F2',
          deep: '#F2EBDC',
        },
        ink: {
          DEFAULT: '#1B1B1F',
          soft: '#2D3142',
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
        'cream-gradient': 'linear-gradient(180deg, #FAF7F2 0%, #F2EBDC 100%)',
        'moss-gradient': 'linear-gradient(135deg, #3A5A40 0%, #1F3324 100%)',
        'terracotta-gradient': 'linear-gradient(135deg, #E07A5F 0%, #A84A30 100%)',
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
