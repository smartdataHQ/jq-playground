import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Tooltip } from './Tooltip';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip content={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} position="bottom">
      <button
        onClick={toggleTheme}
        className={`p-1.5 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded transition-colors ${className}`}
        aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-theme-text-warning" />
        ) : (
          <Moon className="w-4 h-4 text-theme-text-accent" />
        )}
      </button>
    </Tooltip>
  );
};