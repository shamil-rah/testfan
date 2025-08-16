/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-based colors using CSS variables
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primaryHover)',
        'primary-light': 'var(--color-primaryLight)',
        'primary-dark': 'var(--color-primaryDark)',
        
        background: 'var(--color-background)',
        'background-secondary': 'var(--color-backgroundSecondary)',
        'background-tertiary': 'var(--color-backgroundTertiary)',
        
        text: 'var(--color-text)',
        'text-secondary': 'var(--color-textSecondary)',
        'text-muted': 'var(--color-textMuted)',
        'text-inverse': 'var(--color-textInverse)',
        
        border: 'var(--color-border)',
        'border-light': 'var(--color-borderLight)',
        'border-hover': 'var(--color-borderHover)',
        
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        
        'white-alpha-5': 'var(--color-whiteAlpha5)',
        'white-alpha-10': 'var(--color-whiteAlpha10)',
        'white-alpha-20': 'var(--color-whiteAlpha20)',
        'white-alpha-30': 'var(--color-whiteAlpha30)',
        'white-alpha-40': 'var(--color-whiteAlpha40)',
        'black-alpha-50': 'var(--color-blackAlpha50)',
        'black-alpha-80': 'var(--color-blackAlpha80)',
        'black-alpha-90': 'var(--color-blackAlpha90)',
        'black-alpha-95': 'var(--color-blackAlpha95)',
        
        'primary-alpha-10': 'var(--color-primaryAlpha10)',
        'primary-alpha-20': 'var(--color-primaryAlpha20)',
        'primary-alpha-30': 'var(--color-primaryAlpha30)',
        'primary-alpha-50': 'var(--color-primaryAlpha50)',
        'primary-alpha-5': 'var(--color-primaryAlpha5)',
        'primary-alpha-80': 'var(--color-primaryAlpha80)',
        
        'error-alpha-10': 'var(--color-errorAlpha10)',
        'error-alpha-30': 'var(--color-errorAlpha30)',
        
        'success-alpha-30': 'var(--color-successAlpha30)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
};
