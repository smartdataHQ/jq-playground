# Theme Refactoring Plan

This document outlines the plan for refactoring the application to use abstract theme classes consistently across all components.

## Current State

The application has a well-designed theming system with:
- CSS variables for theme colors
- Tailwind CSS for applying the theme
- React Context for managing theme state
- A theme toggle component for switching between themes

However, the implementation is inconsistent across components:
- Some components (like JsonOutput.tsx) consistently use abstract theme classes
- Some components (like JqEditor.tsx) mostly use abstract theme classes, with some concrete classes
- Some components (like JsonInput.tsx) inconsistently use theme classes, with many concrete color classes

## Mapping Concrete Classes to Abstract Theme Classes

Below is a mapping of concrete color classes to their abstract theme equivalents:

### Background Colors

| Concrete Class | Abstract Theme Class |
|----------------|----------------------|
| bg-gray-900    | bg-theme-bg-primary (dark theme) |
| bg-gray-800    | bg-theme-bg-secondary (dark theme) |
| bg-gray-700    | bg-theme-bg-tertiary (dark theme) |
| bg-white       | bg-theme-bg-primary (light theme) |
| bg-gray-100    | bg-theme-bg-secondary (light theme) |
| bg-gray-200    | bg-theme-bg-tertiary (light theme) |

### Text Colors

| Concrete Class | Abstract Theme Class |
|----------------|----------------------|
| text-white     | text-theme-text-primary (dark theme) |
| text-gray-300  | text-theme-text-secondary (dark theme) |
| text-blue-400  | text-theme-text-accent (dark theme) |
| text-green-400 | text-theme-text-success (dark theme) |
| text-red-400   | text-theme-text-error (dark theme) |
| text-amber-400 | text-theme-text-warning (dark theme) |
| text-gray-900  | text-theme-text-primary (light theme) |
| text-gray-700  | text-theme-text-secondary (light theme) |
| text-blue-600  | text-theme-text-accent (light theme) |
| text-green-600 | text-theme-text-success (light theme) |
| text-red-600   | text-theme-text-error (light theme) |
| text-amber-600 | text-theme-text-warning (light theme) |

### Border Colors

| Concrete Class | Abstract Theme Class |
|----------------|----------------------|
| border-gray-700 | border-theme-border-primary (dark theme) |
| border-gray-600 | border-theme-border-secondary (dark theme) |
| border-blue-500 | border-theme-border-accent (dark theme) |
| border-green-500 | border-theme-border-success (dark theme) |
| border-red-500 | border-theme-border-error (dark theme) |
| border-gray-300 | border-theme-border-primary (light theme) |
| border-gray-400 | border-theme-border-secondary (light theme) |

### Button Colors

| Concrete Class | Abstract Theme Class |
|----------------|----------------------|
| bg-blue-600    | bg-theme-button-primary-bg |
| hover:bg-blue-700 | hover:bg-theme-button-primary-hover |
| text-white     | text-theme-button-primary-text |
| bg-gray-600    | bg-theme-button-secondary-bg |
| hover:bg-gray-700 | hover:bg-theme-button-secondary-hover |
| bg-green-600   | bg-theme-button-success-bg |
| hover:bg-green-700 | hover:bg-theme-button-success-hover |
| bg-red-600     | bg-theme-button-danger-bg |
| hover:bg-red-700 | hover:bg-theme-button-danger-hover |

### Notification Colors

| Concrete Class | Abstract Theme Class |
|----------------|----------------------|
| bg-green-900/20 | bg-theme-notification-success-bg |
| border-green-600 | border-theme-notification-success-border |
| text-green-400 | text-theme-notification-success-text |
| bg-red-900/20  | bg-theme-notification-error-bg |
| border-red-600 | border-theme-notification-error-border |
| text-red-400   | text-theme-notification-error-text |
| bg-amber-900/20 | bg-theme-notification-warning-bg |
| border-amber-600 | border-theme-notification-warning-border |
| text-amber-400 | text-theme-notification-warning-text |
| bg-blue-900/20 | bg-theme-notification-info-bg |
| border-blue-600 | border-theme-notification-info-border |
| text-blue-400  | text-theme-notification-info-text |

## Components to Refactor

Based on the audit, the following components need refactoring:

1. **JsonInput.tsx** - Highest priority, has many concrete color classes
2. **JqEditor.tsx** - Medium priority, has some concrete color classes
3. Any other components that use concrete color classes

## Refactoring Approach

For each component:

1. Identify concrete color classes
2. Replace them with the appropriate abstract theme class from the mapping above
3. Test the component to ensure it looks the same in both light and dark themes
4. Verify that theme switching works correctly

## Testing

After refactoring:

1. Test the application in both light and dark themes
2. Verify that all components look consistent
3. Test theme switching to ensure all components update correctly
4. Check for any visual regressions

## Documentation

Update the documentation to:

1. Emphasize the importance of using abstract theme classes
2. Provide examples of how to use the theming system
3. Include the mapping of concrete classes to abstract theme classes for reference