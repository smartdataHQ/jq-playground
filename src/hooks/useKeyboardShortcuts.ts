import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onSaveAs?: () => void;
  onOpen?: () => void;
  onToggleLongArrayMode?: () => void;
  onNextArrayItem?: () => void;
  onPrevArrayItem?: () => void;
  onShowAllItems?: () => void;
  onExtractArray?: () => void; // New handler for extracting array from single key
  onShowHelp?: () => void; // Handler for showing help panel
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the event target is an input, textarea, or contentEditable element
      const target = event.target as HTMLElement;
      
      // Enhanced detection for Monaco editor
      const isMonacoEditor = 
        target.classList?.contains('monaco-editor') || 
        target.closest('.monaco-editor') ||
        // Check for Monaco editor components
        target.classList?.contains('monaco-editor-background') ||
        target.closest('.monaco-editor-background') ||
        // Check for contenteditable divs inside Monaco
        (target.getAttribute('role') === 'textbox' && target.closest('[data-mode-id]')) ||
        // Check for any Monaco editor component
        document.activeElement?.closest('.monaco-editor');
      
      // Simple check for editable elements
      const isEditableTarget = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable;
      
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isModifierPressed = event.metaKey || event.ctrlKey;
      
      // Handle Cmd/Ctrl shortcuts - these are common enough that we'll keep them
      // but only prevent default if not in an editable field
      if (isModifierPressed) {
        switch (event.key.toLowerCase()) {
          case 's':
            // Allow browser save in text inputs
            if (!isEditableTarget) {
              event.preventDefault();
              if (event.shiftKey) {
                // Cmd/Ctrl + Shift + S = Save As (open version history)
                handlers.onSaveAs?.();
              } else {
                // Cmd/Ctrl + S = Quick Save
                handlers.onSave?.();
              }
            }
            break;
          
          case 'o':
            if (event.shiftKey && !isEditableTarget) {
              // Cmd/Ctrl + Shift + O = Open version history
              event.preventDefault();
              handlers.onOpen?.();
            }
            break;
        }
        return;
      }
      
      // Array navigation with Shift+Arrow keys - these should work even in editors
      // as they don't conflict with common editor operations
      if (event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'arrowright':
            // Shift + Right Arrow = Next array item
            // Always handle this shortcut, even in editors
            event.preventDefault();
            event.stopPropagation(); // Stop event propagation to ensure Monaco editor doesn't handle it
            handlers.onNextArrayItem?.();
            return;
            
          case 'arrowleft':
            // Shift + Left Arrow = Previous array item
            // Always handle this shortcut, even in editors
            event.preventDefault();
            event.stopPropagation(); // Stop event propagation to ensure Monaco editor doesn't handle it
            handlers.onPrevArrayItem?.();
            return;
        }
      }
      
      // Special case for Monaco editor - ensure row navigation shortcuts work
      if (isMonacoEditor && event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'arrowright':
          case 'arrowleft':
            // Already handled above, but this ensures the Monaco editor detection is used
            break;
        }
      }
      
      // For single-key shortcuts, only process them if we're not in an editable field
      // to avoid interfering with typing
      if (isEditableTarget) {
        return;
      }
      
      // Handle Alt+key shortcuts for better accessibility and to avoid accidental triggering
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'l':
            // Alt+L = Toggle long array mode
            event.preventDefault();
            handlers.onToggleLongArrayMode?.();
            break;
            
          case 'a':
            // Alt+A = Show all items
            event.preventDefault();
            handlers.onShowAllItems?.();
            break;
            
          case 'e':
            // Alt+E = Extract array from single key
            event.preventDefault();
            handlers.onExtractArray?.();
            break;
            
          case 'h':
            // Alt+H = Show help panel (more intuitive than '?')
            event.preventDefault();
            handlers.onShowHelp?.();
            break;
        }
        return;
      }
      
      // Keep '?' as an alternative shortcut for help (common convention)
      if (event.key === '?') {
        event.preventDefault();
        handlers.onShowHelp?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}