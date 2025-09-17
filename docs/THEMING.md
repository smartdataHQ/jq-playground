# JQ Playground Theming System

This document explains the theming system implemented in the JQ Playground application, how it works, and how to extend it in the future.

## Overview

The JQ Playground application uses a flexible theming system that allows for easy switching between light and dark themes without changing the markup of components. The system is built using:

1. CSS variables for theme colors
2. Tailwind CSS for applying the theme
3. React Context for managing theme state
4. A theme toggle component for switching between themes

## How It Works

### CSS Variables

The theme colors are defined as CSS variables in `src/styles/theme.css`. There are two sets of variables:

1. Default variables (dark theme) defined on the `:root` selector
2. Light theme variables defined on the `.theme-light` selector

When the theme is switched, the `.theme-light` class is added to or removed from the `documentElement` (the `<html>` tag), which causes the CSS variables to switch between their dark and light values.

### Tailwind Configuration

The Tailwind configuration in `tailwind.config.js` extends the default theme with custom colors that reference the CSS variables. This allows us to use abstract class names like `bg-theme-bg-primary` instead of concrete colors like `bg-gray-900`.

### Theme Context

The theme state is managed by a React Context in `src/context/ThemeContext.tsx`. This context provides:

1. The current theme (`'dark'` or `'light'`)
2. A function to toggle between themes

The theme preference is stored in `localStorage` so it persists across page reloads.

### Theme Toggle Component

The `ThemeToggle` component in `src/components/ThemeToggle.tsx` provides a button for switching between themes. It uses the `useTheme` hook from the Theme Context to access the current theme and toggle function.

## Theme Structure

The theme is organized into several categories:

### Background Colors
- `--color-bg-primary`: Primary background color (main content)
- `--color-bg-secondary`: Secondary background color (headers, footers)
- `--color-bg-tertiary`: Tertiary background color (hover states, highlights)

### Text Colors
- `--color-text-primary`: Primary text color (main content)
- `--color-text-secondary`: Secondary text color (less important text)
- `--color-text-accent`: Accent text color (links, highlights)
- `--color-text-success`: Success text color
- `--color-text-error`: Error text color
- `--color-text-warning`: Warning text color

### Border Colors
- `--color-border-primary`: Primary border color
- `--color-border-secondary`: Secondary border color
- `--color-border-accent`: Accent border color
- `--color-border-success`: Success border color
- `--color-border-error`: Error border color

### Button Colors
- `--color-button-primary-bg`: Primary button background
- `--color-button-primary-hover`: Primary button hover background
- `--color-button-primary-text`: Primary button text

- `--color-button-secondary-bg`: Secondary button background
- `--color-button-secondary-hover`: Secondary button hover background
- `--color-button-secondary-text`: Secondary button text

- `--color-button-success-bg`: Success button background
- `--color-button-success-hover`: Success button hover background
- `--color-button-success-text`: Success button text

- `--color-button-danger-bg`: Danger button background
- `--color-button-danger-hover`: Danger button hover background
- `--color-button-danger-text`: Danger button text

- `--color-button-disabled-bg`: Disabled button background
- `--color-button-disabled-text`: Disabled button text

### Notification Colors
- `--color-notification-success-bg`: Success notification background
- `--color-notification-success-border`: Success notification border
- `--color-notification-success-text`: Success notification text

- `--color-notification-error-bg`: Error notification background
- `--color-notification-error-border`: Error notification border
- `--color-notification-error-text`: Error notification text

- `--color-notification-warning-bg`: Warning notification background
- `--color-notification-warning-border`: Warning notification border
- `--color-notification-warning-text`: Warning notification text

- `--color-notification-info-bg`: Info notification background
- `--color-notification-info-border`: Info notification border
- `--color-notification-info-text`: Info notification text

## Usage

### Using Theme Classes in Components

To use the theme in components, use the abstract class names defined in the Tailwind configuration:

```jsx
// Instead of this:
<div className="bg-gray-900 text-white">...</div>

// Use this:
<div className="bg-theme-bg-primary text-theme-text-primary">...</div>
```

### Accessing Theme in JavaScript

To access the current theme in JavaScript, use the `useTheme` hook:

```jsx
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

## Extending the Theme

### Adding New Theme Variables

To add new theme variables:

1. Add the variables to both theme definitions in `src/styles/theme.css`:

```css
:root {
  /* Existing variables */
  
  /* New variables */
  --color-new-variable: #value;
}

.theme-light {
  /* Existing variables */
  
  /* New variables */
  --color-new-variable: #different-value;
}
```

2. Add the new variables to the Tailwind configuration in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      theme: {
        // Existing categories
        
        // New category or extend existing
        newCategory: {
          variable: 'var(--color-new-variable)',
        },
      },
    },
  },
},
```

### Adding New Themes

To add a new theme beyond light and dark:

1. Add a new class selector in `src/styles/theme.css`:

```css
.theme-new {
  /* Define all variables for the new theme */
}
```

2. Update the Theme Context to support the new theme:

```tsx
// Update ThemeType
type ThemeType = 'dark' | 'light' | 'new';

// Update theme toggle logic
const toggleTheme = () => {
  setTheme(prevTheme => {
    if (prevTheme === 'dark') return 'light';
    if (prevTheme === 'light') return 'new';
    return 'dark';
  });
};

// Update useEffect to apply the correct class
useEffect(() => {
  document.documentElement.classList.remove('theme-light', 'theme-new');
  if (theme === 'light') {
    document.documentElement.classList.add('theme-light');
  } else if (theme === 'new') {
    document.documentElement.classList.add('theme-new');
  }
  
  localStorage.setItem('jq-playground-theme', theme);
}, [theme]);
```

3. Update the ThemeToggle component to show the appropriate icon for the new theme.

## Best Practices

1. **Always use abstract theme classes** instead of concrete color classes to ensure theme compatibility.
2. **Keep theme variables organized** by category to make them easier to manage.
3. **Test all themes** when making changes to ensure everything looks correct in all themes.
4. **Consider accessibility** when choosing colors for themes, ensuring sufficient contrast for readability.
5. **Use semantic color names** in your theme variables (e.g., `primary`, `secondary`, `accent`) rather than descriptive color names (e.g., `blue`, `red`, `green`).

## Troubleshooting

### Theme Not Switching

If the theme is not switching when the toggle button is clicked:

1. Check that the ThemeProvider is properly set up in `src/main.tsx`
2. Verify that the theme toggle button is calling the `toggleTheme` function
3. Check the browser console for any errors

### Colors Not Updating

If colors are not updating when the theme changes:

1. Make sure you're using the abstract theme classes (e.g., `bg-theme-bg-primary`) instead of concrete color classes (e.g., `bg-gray-900`)
2. Check that the CSS variables are properly defined in `src/styles/theme.css`
3. Verify that the Tailwind configuration is correctly referencing the CSS variables