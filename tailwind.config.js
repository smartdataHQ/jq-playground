/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme colors
        theme: {
          // Background colors
          bg: {
            primary: 'var(--color-bg-primary)',
            secondary: 'var(--color-bg-secondary)',
            tertiary: 'var(--color-bg-tertiary)',
          },
          // Text colors
          text: {
            primary: 'var(--color-text-primary)',
            secondary: 'var(--color-text-secondary)',
            accent: 'var(--color-text-accent)',
            success: 'var(--color-text-success)',
            error: 'var(--color-text-error)',
            warning: 'var(--color-text-warning)',
          },
          // Border colors
          border: {
            primary: 'var(--color-border-primary)',
            secondary: 'var(--color-border-secondary)',
            accent: 'var(--color-border-accent)',
            success: 'var(--color-border-success)',
            error: 'var(--color-border-error)',
          },
          // Button colors
          button: {
            primary: {
              bg: 'var(--color-button-primary-bg)',
              hover: 'var(--color-button-primary-hover)',
              text: 'var(--color-button-primary-text)',
            },
            secondary: {
              bg: 'var(--color-button-secondary-bg)',
              hover: 'var(--color-button-secondary-hover)',
              text: 'var(--color-button-secondary-text)',
            },
            success: {
              bg: 'var(--color-button-success-bg)',
              hover: 'var(--color-button-success-hover)',
              text: 'var(--color-button-success-text)',
            },
            danger: {
              bg: 'var(--color-button-danger-bg)',
              hover: 'var(--color-button-danger-hover)',
              text: 'var(--color-button-danger-text)',
            },
            disabled: {
              bg: 'var(--color-button-disabled-bg)',
              text: 'var(--color-button-disabled-text)',
            },
          },
          // Notification colors
          notification: {
            success: {
              bg: 'var(--color-notification-success-bg)',
              border: 'var(--color-notification-success-border)',
              text: 'var(--color-notification-success-text)',
            },
            error: {
              bg: 'var(--color-notification-error-bg)',
              border: 'var(--color-notification-error-border)',
              text: 'var(--color-notification-error-text)',
            },
            warning: {
              bg: 'var(--color-notification-warning-bg)',
              border: 'var(--color-notification-warning-border)',
              text: 'var(--color-notification-warning-text)',
            },
            info: {
              bg: 'var(--color-notification-info-bg)',
              border: 'var(--color-notification-info-border)',
              text: 'var(--color-notification-info-text)',
            },
          },
        },
      },
    },
  },
  plugins: [],
};
