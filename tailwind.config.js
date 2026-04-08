/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts}"],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Custom screen sizes for specific display requirements
      'landscape': {'raw': '(min-width: 1920px) and (max-height: 1080px)'},
      'portrait': {'raw': '(max-width: 1080px) and (min-height: 1920px)'},
      '1080p': {'raw': '(min-width: 1920px) and (min-height: 1080px)'},
      'mobile-portrait': {'raw': '(max-width: 1080px) and (min-height: 1920px)'},
    },
    extend: {
      colors: {
        'dmm-green': '#28A745',
        'dmm-green-dark': '#218838',
        'dmm-green-light': '#4CAF50',
        'accent': '#b14545',
        'secondary-color': '#E9EDF0',
        'text-primary': '#212529',
        'text-secondary': '#6c757d',
        'text-white': '#ffffff',
        'border-color': '#dee2e6',
        'border-light': '#f8f9fa',
        'error-color': '#dc3545',
        'success-color': '#28a745',
        'warning-color': '#ffc107',
        'info-color': '#17a2b8',
        'background-light': '#f8f9fa',
        'background-white': '#ffffff',
      },
      spacing: {
        '2xl': '3rem',
        '3xl': '4rem',
      },
      fontSize: {
        '2xs': '0.625rem', // 10px
        'xs': '0.75rem',   // 12px
        'sm': '0.875rem',  // 14px
        'base': '1rem',    // 16px
        'lg': '1.125rem',  // 18px
        'xl': '1.25rem',   // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
        '5xl': '3rem',     // 48px
      },
      fontWeight: {
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
      },
      height: {
        'date-box': '4em',
        'date-box-large': '7em',
        'schedule-box': '7em',
        'schedule-box-condensed': '5em',
      },
      width: {
        'time-display': '7rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'default': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}