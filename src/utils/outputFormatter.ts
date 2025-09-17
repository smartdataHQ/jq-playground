/**
 * Formats jq output for display, handling different types appropriately
 */
export function formatJqOutput(result: unknown): string {
  // Handle null and undefined
  if (result === null) return 'null';
  if (result === undefined) return 'undefined';
  
  // Handle primitive types that don't need JSON stringification
  if (typeof result === 'string') {
    // If it's a simple string, display it without quotes
    return result;
  }
  
  if (typeof result === 'number' || typeof result === 'boolean') {
    return String(result);
  }
  
  // Handle arrays of simple values
  if (Array.isArray(result)) {
    // Check if all items are simple values (strings, numbers, booleans)
    const allSimple = result.every(item => 
      typeof item === 'string' || 
      typeof item === 'number' || 
      typeof item === 'boolean' ||
      item === null
    );
    
    if (allSimple) {
      // Display simple arrays as newline-separated values
      return result.map(item => {
        if (typeof item === 'string') return item;
        if (item === null) return 'null';
        return String(item);
      }).join('\n');
    }
  }
  
  // For complex objects, arrays with objects, etc., use JSON formatting
  try {
    return JSON.stringify(result, null, 2);
  } catch (error) {
    // Fallback to string representation
    return String(result);
  }
}

/**
 * Determines if the output should be treated as JSON for syntax highlighting
 */
export function isJsonOutput(result: unknown): boolean {
  // Simple primitives are not JSON
  if (typeof result === 'string' || 
      typeof result === 'number' || 
      typeof result === 'boolean' ||
      result === null ||
      result === undefined) {
    return false;
  }
  
  // Arrays of simple values are not JSON
  if (Array.isArray(result)) {
    const allSimple = result.every(item => 
      typeof item === 'string' || 
      typeof item === 'number' || 
      typeof item === 'boolean' ||
      item === null
    );
    
    if (allSimple) return false;
  }
  
  // Everything else should be treated as JSON
  return true;
}