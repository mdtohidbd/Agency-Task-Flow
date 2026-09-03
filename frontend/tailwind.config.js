/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface': '#fcf9f8',
        'surface-dim': '#fafaf8',
        'surface-bright': '#fcf9f8',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f6f3f2',
        'surface-container': '#f5f4f1',
        'surface-container-high': '#eae7e7',
        'surface-container-highest': '#e5e2e1',
        'on-surface': '#1c1b1b',
        'on-surface-variant': '#434654',
        'inverse-surface': '#313030',
        'inverse-on-surface': '#f3f0ef',
        'outline': '#e3e1db',
        'outline-variant': '#c3c5d6',
        'outline-strong': '#c9c7bf',
        'surface-tint': '#2154d1',
        'primary': '#0044c1',
        'on-primary': '#ffffff',
        'primary-container': '#2f5edb',
        'on-primary-container': '#e2e6ff',
        'primary-fixed': '#dce1ff',
        'primary-fixed-dim': '#b5c4ff',
        'inverse-primary': '#b5c4ff',
        'ink-blue-container': '#eaeefc',
        'secondary': '#5e5e5c',
        'on-secondary': '#ffffff',
        'secondary-container': '#e1dfdc',
        'on-secondary-container': '#636360',
        'secondary-fixed': '#e4e2de',
        'secondary-fixed-dim': '#c7c6c3',
        'tertiary': '#893600',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#b04700',
        'on-tertiary-container': '#ffe1d5',
        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'danger': '#c94f4f',
        'warning': '#d98c2b',
        'success': '#3e9c5b',
        'background': '#ffffff',
        'on-background': '#1c1b1b',
        'surface-variant': '#e5e2e1',
        // Sepia Palette variables
        'sepia-bg': '#fcf7e8',
        'sepia-surface': '#f6eed6',
        'sepia-outline': '#e0d5ba',
        'sepia-ink': '#382f25',
        'sepia-pencil': '#756858'
      },
      fontFamily: {
        'headline-lg': ['Patrick Hand', 'cursive', 'sans-serif'],
        'headline-md': ['Patrick Hand', 'cursive', 'sans-serif'],
        'body-lg': ['Patrick Hand', 'cursive', 'sans-serif'],
        'body-md': ['Patrick Hand', 'cursive', 'sans-serif'],
        'label-sm': ['Patrick Hand', 'cursive', 'sans-serif']
      },
      fontSize: {
        'headline-lg': ['26px', { lineHeight: '32px', fontWeight: '400' }],
        'headline-md': ['20px', { lineHeight: '26px', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '400' }]
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px'
      },
      spacing: {
        unit: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        'margin-mobile': '20px',
        'margin-desktop': '32px',
        gutter: '1px'
      },
      boxShadow: {
        'minimal-lift': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'sheet-lift': '0 -2px 10px rgba(0, 0, 0, 0.08)',
        'drawer-lift': '2px 0 12px rgba(0, 0, 0, 0.08)'
      }
    }
  },
  plugins: []
};
