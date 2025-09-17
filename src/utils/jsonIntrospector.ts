// JSON introspection utility to extract paths for autocomplete
export function introspectJson(obj: any, prefix = '', maxDepth = 5, currentDepth = 0): string[] {
  if (currentDepth >= maxDepth || obj === null || obj === undefined) {
    return [];
  }
  
  const paths: string[] = [];
  
  if (Array.isArray(obj)) {
    // For arrays, introspect the first few elements
    const sampleSize = Math.min(3, obj.length);
    const seenPaths = new Set<string>();
    
    for (let i = 0; i < sampleSize; i++) {
      if (obj[i] !== null && typeof obj[i] === 'object') {
        const subPaths = introspectJson(obj[i], '', maxDepth, currentDepth + 1);
        subPaths.forEach(path => {
          if (!seenPaths.has(path)) {
            seenPaths.add(path);
            paths.push(path);
          }
        });
      }
    }
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const fullPath = prefix ? `${prefix}.${key}` : `.${key}`;
      paths.push(fullPath);
      
      // Recursively introspect nested objects
      if (obj[key] !== null && typeof obj[key] === 'object') {
        const nestedPaths = introspectJson(obj[key], fullPath, maxDepth, currentDepth + 1);
        paths.push(...nestedPaths);
      }
    });
  }
  
  // Remove duplicates and sort
  const uniquePaths = Array.from(new Set(paths));
  return uniquePaths.sort();
}