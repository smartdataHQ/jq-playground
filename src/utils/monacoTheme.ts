/**
 * Consistent Monaco Editor theme setup for all editors
 */

// Dark theme colors
export const DARK_THEME_COLORS = {
  'editor.background': '#111827',
  'editor.foreground': '#F3F4F6',
  'editorLineNumber.foreground': '#6B7280',
  'editorLineNumber.activeForeground': '#9CA3AF',
  'editor.selectionBackground': '#374151',
  'editor.inactiveSelectionBackground': '#1F2937',
  'editorCursor.foreground': '#F3F4F6',
  'editor.findMatchBackground': '#3B82F6',
  'editor.findMatchHighlightBackground': '#1E40AF'
};

// Light theme colors
export const LIGHT_THEME_COLORS = {
  'editor.background': '#F9FAFB',
  'editor.foreground': '#111827',
  'editorLineNumber.foreground': '#9CA3AF',
  'editorLineNumber.activeForeground': '#6B7280',
  'editor.selectionBackground': '#E5E7EB',
  'editor.inactiveSelectionBackground': '#F3F4F6',
  'editorCursor.foreground': '#111827',
  'editor.findMatchBackground': '#DBEAFE',
  'editor.findMatchHighlightBackground': '#EFF6FF'
};

// Get current theme from document
function getCurrentTheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';
}

export function setupJsonTheme(monaco: any) {
  // Define dark theme
  monaco.editor.defineTheme('json-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '9CDCFE' },
      { token: 'string.value.json', foreground: 'CE9178' },
      { token: 'number.json', foreground: 'B5CEA8' },
      { token: 'keyword.json', foreground: '569CD6' }
    ],
    colors: DARK_THEME_COLORS
  });
  
  // Define light theme
  monaco.editor.defineTheme('json-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '0451A5' },
      { token: 'string.value.json', foreground: 'A31515' },
      { token: 'number.json', foreground: '098658' },
      { token: 'keyword.json', foreground: '0000FF' }
    ],
    colors: LIGHT_THEME_COLORS
  });
  
  // Set theme based on current app theme
  const theme = getCurrentTheme();
  monaco.editor.setTheme(`json-${theme}`);
}

export function setupJqTheme(monaco: any) {
  // Define dark theme
  monaco.editor.defineTheme('jq-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'field', foreground: '9CDCFE' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'pipe', foreground: 'DCDCAA', fontStyle: 'bold' },
      { token: 'array-access', foreground: 'F44747' }
    ],
    colors: DARK_THEME_COLORS
  });
  
  // Define light theme
  monaco.editor.defineTheme('jq-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'field', foreground: '0451A5' },
      { token: 'keyword', foreground: 'AF00DB' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'operator', foreground: '000000' },
      { token: 'pipe', foreground: '795E26', fontStyle: 'bold' },
      { token: 'array-access', foreground: 'DD0000' }
    ],
    colors: LIGHT_THEME_COLORS
  });
  
  // Set theme based on current app theme
  const theme = getCurrentTheme();
  monaco.editor.setTheme(`jq-${theme}`);
}

export function setupOutputTheme(monaco: any) {
  // Define dark theme
  monaco.editor.defineTheme('output-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: 'DDA0DD' },
      { token: 'string.value.json', foreground: '98FB98' },
      { token: 'number.json', foreground: 'F0E68C' },
      { token: 'keyword.json', foreground: '87CEEB' },
      // Plain text tokens
      { token: '', foreground: 'F3F4F6' }
    ],
    colors: DARK_THEME_COLORS
  });
  
  // Define light theme
  monaco.editor.defineTheme('output-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '7B2F7D' },
      { token: 'string.value.json', foreground: '008000' },
      { token: 'number.json', foreground: '8B7500' },
      { token: 'keyword.json', foreground: '0000FF' },
      // Plain text tokens
      { token: '', foreground: '000000' }
    ],
    colors: LIGHT_THEME_COLORS
  });
  
  // Set theme based on current app theme
  const theme = getCurrentTheme();
  monaco.editor.setTheme(`output-${theme}`);
}

// Global theme enforcement
// This function is called when the theme changes to ensure all Monaco editors are updated
export function enforceTheme(themeName?: string) {
  if (window.monaco) {
    const theme = getCurrentTheme();
    
    // If a specific theme is requested, use it, otherwise use the current app theme
    if (themeName) {
      // Extract the base name without the theme suffix
      const baseThemeName = themeName.replace(/-dark$|-light$/, '');
      window.monaco.editor.setTheme(`${baseThemeName}-${theme}`);
    } else {
      // Apply theme to all editors
      const editors = window.monaco.editor.getEditors();
      for (const editor of editors) {
        const model = editor.getModel();
        if (model) {
          const language = model.getLanguageId();
          if (language === 'json') {
            window.monaco.editor.setTheme(`json-${theme}`);
          } else if (language === 'jq') {
            window.monaco.editor.setTheme(`jq-${theme}`);
          } else {
            window.monaco.editor.setTheme(`output-${theme}`);
          }
        }
      }
    }
  }
}