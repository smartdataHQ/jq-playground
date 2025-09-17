// Test script for multiple JSON objects detection and parsing

// Sample input with multiple JSON objects
const multipleJsonObjects = `
{
  "id": 1,
  "name": "First Object"
}
{
  "id": 2,
  "name": "Second Object"
}
{
  "id": 3,
  "name": "Third Object"
}
`;

// Function to detect multiple JSON objects (copied from JsonInput.tsx)
function detectMultipleJsonObjects(jsonString) {
  // Trim whitespace
  const trimmed = jsonString.trim();
  
  // Check if it starts with { and ends with } (potential JSON object)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    // Split by newline and look for multiple objects
    const lines = trimmed.split('\n');
    let openBraces = 0;
    let closeBraces = 0;
    let potentialObjects = 0;
    
    for (const line of lines) {
      // Count open and close braces
      for (const char of line) {
        if (char === '{') openBraces++;
        if (char === '}') closeBraces++;
        
        // If we have matching braces, we might have a complete object
        if (openBraces > 0 && openBraces === closeBraces) {
          potentialObjects++;
          // Reset counters for next object
          openBraces = 0;
          closeBraces = 0;
        }
      }
    }
    
    // If we detected multiple potential objects, return true
    return potentialObjects > 1;
  }
  
  return false;
}

// Function to try parsing multiple JSON objects (copied from JsonInput.tsx)
function tryParseMultipleJsonObjects(jsonString) {
  try {
    // Split the input by lines
    const lines = jsonString.split('\n');
    const objects = [];
    let currentObject = '';
    let openBraces = 0;
    
    for (const line of lines) {
      // Add the current line to our accumulator
      currentObject += line + '\n';
      
      // Count braces to track object boundaries
      for (const char of line) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        
        // If we've completed an object (braces balanced)
        if (openBraces === 0 && currentObject.trim()) {
          try {
            // Try to parse the current object
            const parsed = JSON.parse(currentObject);
            objects.push(parsed);
            // Reset for next object
            currentObject = '';
          } catch {
            // If parsing fails, continue accumulating
          }
        }
      }
    }
    
    // If we found multiple valid objects, return the array
    return objects.length > 1 ? objects : null;
  } catch {
    return null;
  }
}

// Test detection
console.log("Detecting multiple JSON objects:");
const isMultipleObjects = detectMultipleJsonObjects(multipleJsonObjects);
console.log("Result:", isMultipleObjects);

// Test parsing
console.log("\nParsing multiple JSON objects:");
const parsedObjects = tryParseMultipleJsonObjects(multipleJsonObjects);
console.log("Parsed objects:", JSON.stringify(parsedObjects, null, 2));

// Test with invalid input
console.log("\nTesting with invalid input:");
const invalidInput = `
{
  "id": 1,
  "name": "First Object"
}
This is not JSON
{
  "id": 3,
  "name": "Third Object"
}
`;

const parsedInvalidInput = tryParseMultipleJsonObjects(invalidInput);
console.log("Parsed invalid input:", parsedInvalidInput);

// Test with single object
console.log("\nTesting with single object:");
const singleObject = `
{
  "id": 1,
  "name": "Single Object"
}
`;

const parsedSingleObject = tryParseMultipleJsonObjects(singleObject);
console.log("Parsed single object:", parsedSingleObject);

// Test with nested objects
console.log("\nTesting with nested objects:");
const nestedObjects = `
{
  "id": 1,
  "nested": {
    "key": "value"
  }
}
{
  "id": 2,
  "nested": {
    "key": "value2"
  }
}
`;

const parsedNestedObjects = tryParseMultipleJsonObjects(nestedObjects);
console.log("Parsed nested objects:", JSON.stringify(parsedNestedObjects, null, 2));