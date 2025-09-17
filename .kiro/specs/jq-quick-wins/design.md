# Design Document

## Overview

Simple enhancements to the existing jq editor using the current architecture. Extend existing components with minimal new code.

## Architecture

Keep the current React component structure. Make small additions to:
- `JqEditor` component - add more patterns and better autocomplete
- `jqProcessor` utility - improve error messages  
- Add simple `QueryHistory` component
- Add basic keyboard shortcuts

## Components and Interfaces

### Extended JqEditor
Add more patterns to the existing quick patterns toolbar:
```typescript
const expandedPatterns = [
  // Current patterns plus:
  { name: 'Has key', pattern: 'has("key")', description: 'Check if object has key' },
  { name: 'Empty', pattern: 'empty', description: 'Filter out empty values' },
  { name: 'Min/Max', pattern: 'min, max', description: 'Get min and max values' },
  { name: 'Add', pattern: 'add', description: 'Sum array of numbers' },
  { name: 'Reverse', pattern: 'reverse', description: 'Reverse array order' },
  { name: 'Contains', pattern: 'contains("text")', description: 'Check if string contains text' },
  { name: 'Split', pattern: 'split(",")', description: 'Split string by delimiter' },
  { name: 'Join', pattern: 'join(",")', description: 'Join array elements' },
  { name: 'To entries', pattern: 'to_entries', description: 'Convert object to key-value pairs' },
  // ... more patterns
];
```

### Simple Query History
```typescript
interface SimpleHistoryItem {
  query: string;
  timestamp: number;
}

// Store in localStorage, show last 10 queries
const queryHistory = {
  save: (query: string) => { /* simple localStorage save */ },
  getRecent: () => { /* get last 10 */ },
  load: (query: string) => { /* set in editor */ }
};
```

### Better Error Messages
Extend the existing error handling in `jqProcessor.ts`:
```typescript
function enhanceErrorMessage(error: string, availableFields: string[]): string {
  // Simple string replacements for common errors
  if (error.includes('Cannot index')) {
    return `Field not found. Available fields: ${availableFields.join(', ')}`;
  }
  if (error.includes('null')) {
    return 'Query returned no results. Check your filter conditions.';
  }
  return error; // fallback to original
}
```

### Basic Keyboard Shortcuts
Add to existing `useKeyboardShortcuts` hook:
```typescript
// Add these shortcuts:
// Ctrl/Cmd+Enter: execute query
// Ctrl/Cmd+/: toggle comment
// Ctrl/Cmd+K: show simple command menu
```

## Error Handling

Keep existing error handling, just improve the messages:
- Parse common jq error patterns
- Suggest available field names when field not found
- Explain when queries return empty results

## Testing Strategy

Minimal testing - just verify:
- New patterns insert correctly
- Error messages are more helpful
- History saves and loads
- Keyboard shortcuts work

## Implementation Notes

- Reuse existing Monaco Editor setup
- Extend current autocomplete with field suggestions
- Use existing localStorage for history
- Keep all styling consistent with current theme
- No new dependencies needed