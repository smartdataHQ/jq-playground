/**
 * Utility functions for loading JSON schemas from various sources
 */

// Cache for loaded schemas to avoid duplicate fetches
const schemaCache: Record<string, object> = {};

/**
 * Resolves all $ref references in a schema
 * @param schema The schema object to process
 * @param baseUrl The base URL to resolve relative references against
 * @returns A promise that resolves to the schema with all references resolved
 */
export async function resolveSchemaReferences(
  schema: Record<string, unknown>,
  baseUrl: string = window.location.origin
): Promise<Record<string, unknown>> {
  // Clone the schema to avoid modifying the original
  const resolvedSchema = { ...schema };
  
  // If the schema has an $id, use it as the base URL for resolving references
  if (typeof resolvedSchema.$id === 'string') {
    try {
      // Extract the base URL from the $id
      const idUrl = new URL(resolvedSchema.$id);
      baseUrl = idUrl.origin + idUrl.pathname.substring(0, idUrl.pathname.lastIndexOf('/') + 1);
      console.log(`Using schema $id as base URL: ${baseUrl}`);
    } catch (error) {
      console.warn(`Invalid $id in schema: ${resolvedSchema.$id}. Using default base URL.`);
    }
  }
  
  // Process the schema recursively
  await processSchemaNode(resolvedSchema, baseUrl);
  
  return resolvedSchema;
}

/**
 * Recursively processes a schema node to resolve $ref references
 * @param node The schema node to process
 * @param baseUrl The base URL to resolve relative references against
 */
async function processSchemaNode(node: any, baseUrl: string): Promise<void> {
  if (typeof node !== 'object' || node === null) {
    return;
  }
  
  // Process arrays
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      await processSchemaNode(node[i], baseUrl);
    }
    return;
  }
  
  // Process $ref
  if ('$ref' in node && typeof node.$ref === 'string') {
    const ref = node.$ref;
    
    // Skip JSON Schema references (they're handled by Monaco editor)
    if (ref.startsWith('http://json-schema.org/') || ref.startsWith('https://json-schema.org/')) {
      return;
    }
    
    try {
      // Resolve the reference URL
      let refUrl: string;
      if (ref.startsWith('http://') || ref.startsWith('https://')) {
        // Absolute URL
        refUrl = ref;
      } else {
        // Relative URL
        refUrl = new URL(ref, baseUrl).toString();
      }
      
      console.log(`Resolving schema reference: ${ref} -> ${refUrl}`);
      
      // Check if the schema is already in the cache
      if (!schemaCache[refUrl]) {
        // Fetch the referenced schema
        schemaCache[refUrl] = await fetchSchemaFromUrl(refUrl);
      }
      
      // Replace the $ref with the actual schema properties
      const refSchema = schemaCache[refUrl] as Record<string, unknown>;
      delete node.$ref;
      
      // Copy all properties from the referenced schema to the current node
      Object.assign(node, refSchema);
      
      // Process the newly added properties
      await processSchemaNode(node, baseUrl);
    } catch (error) {
      console.error(`Error resolving schema reference ${ref}:`, error);
      // Keep the $ref in case of error
    }
    return;
  }
  
  // Process all properties recursively
  for (const key in node) {
    await processSchemaNode(node[key], baseUrl);
  }
}

/**
 * Fetches a JSON schema from a URL
 * @param url The URL to fetch the schema from
 * @returns A promise that resolves to the schema object
 * @throws Error if the fetch fails or the response is not valid JSON
 */
export async function fetchSchemaFromUrl(url: string, useProxy: boolean = false): Promise<object> {
  try {
    const fetchUrl = useProxy 
      ? `https://cors-anywhere.herokuapp.com/${url}` // Public CORS proxy (requires visiting https://cors-anywhere.herokuapp.com/corsdemo first)
      : url;
    
    console.log(`Fetching schema from URL: ${fetchUrl}${useProxy ? ' (using CORS proxy)' : ''}`);
    
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(fetchUrl, {
        signal: controller.signal,
        mode: 'cors', // Explicitly request CORS mode
        headers: {
          'Accept': 'application/json',
          ...(useProxy ? { 'X-Requested-With': 'XMLHttpRequest' } : {}) // Required by some CORS proxies
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Fetch response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log(`Response content type: ${contentType}`);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`Warning: Response is not JSON (${contentType}). Attempting to parse anyway.`);
      }
      
      const schema = await response.json();
      
      console.log('Schema parsed successfully:', schema ? 'valid object' : 'null');
      
      // Basic validation that it's a JSON Schema
      if (typeof schema !== 'object' || schema === null) {
        throw new Error('Invalid schema: not an object');
      }
      
      return schema;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error fetching schema:', error);
    
    // If this was a CORS error and we weren't using a proxy, try again with the proxy
    if (!useProxy && error instanceof TypeError && error.message.includes('CORS')) {
      console.log('CORS error detected, retrying with proxy...');
      return fetchSchemaFromUrl(url, true);
    }
    
    // Provide more detailed error messages based on the type of error
    if (error instanceof TypeError) {
      // Network errors like CORS issues often result in TypeError
      const corsHelp = "This is likely a CORS issue. The server hosting the schema doesn't allow cross-origin requests from your browser. Try using a schema from a CORS-enabled source or download the schema and use the 'Custom' tab.";
      throw new Error(`Network error loading schema: ${error.message}. ${corsHelp}`);
    } else if (error instanceof SyntaxError) {
      // JSON parsing errors
      throw new Error(`Invalid JSON in schema response: ${error.message}. The URL might not be returning a valid JSON schema.`);
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      // Timeout errors
      throw new Error('Schema request timed out after 10 seconds. The server might be slow or unreachable.');
    } else if (error instanceof Error) {
      throw new Error(`Error loading schema: ${error.message}`);
    } else {
      throw new Error('Unknown error loading schema');
    }
  }
}

/**
 * Parses a JSON schema string
 * @param schemaString The JSON schema string to parse
 * @returns The parsed schema object
 * @throws Error if the string is not valid JSON
 */
export function parseSchemaString(schemaString: string): object {
  try {
    const schema = JSON.parse(schemaString);
    
    // Basic validation that it's a JSON Schema
    if (typeof schema !== 'object' || schema === null) {
      throw new Error('Invalid schema: not an object');
    }
    
    return schema;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error parsing schema: ${error.message}`);
    } else {
      throw new Error('Unknown error parsing schema');
    }
  }
}

/**
 * Validates that an object is a valid JSON Schema
 * This is a basic validation that checks for required properties
 * @param schema The schema object to validate
 * @returns true if the schema is valid, false otherwise
 */
export function isValidJsonSchema(schema: unknown): boolean {
  if (typeof schema !== 'object' || schema === null) {
    return false;
  }
  
  // Check for some common JSON Schema properties
  // This is a very basic check and doesn't validate the entire schema
  const schemaObj = schema as Record<string, unknown>;
  
  // Most schemas will have at least one of these properties
  const commonProperties = [
    'type',
    'properties',
    'items',
    'required',
    'additionalProperties',
    '$schema',
    'definitions',
    '$ref'
  ];
  
  return commonProperties.some(prop => prop in schemaObj);
}

/**
 * Utility function to test fetching a schema URL directly from the browser console
 * This function is exposed on the window object for easy access
 * @param url The URL to test
 * @param useProxy Whether to use a CORS proxy (optional, defaults to false)
 * @returns A promise that resolves to the schema object or rejects with an error
 * 
 * Usage from browser console:
 * window.testSchemaUrl('https://example.com/schema.json')
 *   .then(schema => console.log('Schema fetched successfully:', schema))
 *   .catch(error => console.error('Error fetching schema:', error));
 * 
 * To force using a proxy:
 * window.testSchemaUrl('https://example.com/schema.json', true)
 */
export async function testSchemaUrl(url: string, useProxy: boolean = false): Promise<object> {
  console.log(`Testing schema URL: ${url}${useProxy ? ' (using CORS proxy)' : ''}`);
  
  try {
    const schema = await fetchSchemaFromUrl(url, useProxy);
    console.log('Schema fetched successfully:', schema);
    return schema;
  } catch (error) {
    console.error('Error fetching schema:', error);
    throw error;
  }
}

// Expose the test function on the window object for easy access from the browser console
if (typeof window !== 'undefined') {
  (window as any).testSchemaUrl = testSchemaUrl;
}