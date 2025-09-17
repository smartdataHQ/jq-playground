import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { enforceTheme } from '../utils/monacoTheme';

// Define theme types
type ThemeType = 'dark' | 'light';

// Define the context interface
interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem('jq-playground-theme');
    return (savedTheme as ThemeType) || 'dark';
  });

  // Update the document class when theme changes
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('jq-playground-theme', theme);
    
    // Re-render Monaco editors with the new theme
    enforceTheme();
  }, [theme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};