// Test script for JSON validation functionality

// Sample inputs
const standardJson = `{
  "id": 1,
  "name": "Standard JSON Object",
  "nested": {
    "key": "value"
  },
  "array": [1, 2, 3]
}`;

const jsonArray = `[
  {
    "id": 1,
    "name": "First Item"
  },
  {
    "id": 2,
    "name": "Second Item"
  }
]`;

const jsonlFormat = `{"id": 1, "name": "First Line"}
{"id": 2, "name": "Second Line"}
{"id": 3, "name": "Third Line"}`;

const invalidJson = `{
  "id": 1,
  "name": "Invalid JSON,
  "missing": "closing quote
}`;

const multipleJsonObjects = `
{
  "id": 1,
  "name": "First Object"
}
{
  "id": 2,
  "name": "Second Object"
}
`;

// Function to detect JSONL format (simplified version of detectAndParseJsonl)
function detectJsonlFormat(jsonString) {
  if (!jsonString || jsonString.trim().length === 0) {
    return false;
  }

  const lines = jsonString.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length < 2) {
    return false;
  }

  let validJsonLines = 0;
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        validJsonLines++;
      }
    } catch {
      // If parsing fails, it's not a valid JSONL line
    }
  }
  
  return validJsonLines >= Math.max(2, lines.length * 0.7);
}

// Function to detect multiple JSON objects
function detectMultipleJsonObjects(jsonString) {
  const trimmed = jsonString.trim();
  
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const lines = trimmed.split('\n');
    let openBraces = 0;
    let closeBraces = 0;
    let potentialObjects = 0;
    
    for (const line of lines) {
      for (const char of line) {
        if (char === '{') openBraces++;
        if (char === '}') closeBraces++;
        
        if (openBraces > 0 && openBraces === closeBraces) {
          potentialObjects++;
          openBraces = 0;
          closeBraces = 0;
        }
      }
    }
    
    return potentialObjects > 1;
  }
  
  return false;
}

// Function to try parsing multiple JSON objects
function tryParseMultipleJsonObjects(jsonString) {
  try {
    const lines = jsonString.split('\n');
    const objects = [];
    let currentObject = '';
    let openBraces = 0;
    
    for (const line of lines) {
      currentObject += line + '\n';
      
      for (const char of line) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        
        if (openBraces === 0 && currentObject.trim()) {
          try {
            const parsed = JSON.parse(currentObject);
            objects.push(parsed);
            currentObject = '';
          } catch {
            // If parsing fails, continue accumulating
          }
        }
      }
    }
    
    return objects.length > 1 ? objects : null;
  } catch {
    return null;
  }
}

// Simplified validation function to test the logic
function validateJson(jsonString) {
  try {
    // First, try to parse as standard JSON
    const parsed = JSON.parse(jsonString);
    console.log("Valid standard JSON:", typeof parsed);
    console.log("Is array:", Array.isArray(parsed));
    return { isValid: true, type: Array.isArray(parsed) ? "array" : "object" };
  } catch (err) {
    // If standard JSON parsing fails, first try to detect and parse multiple JSON objects
    if (detectMultipleJsonObjects(jsonString)) {
      const multipleObjects = tryParseMultipleJsonObjects(jsonString);
      
      if (multipleObjects && multipleObjects.length > 1) {
        console.log("Valid multiple JSON objects:", multipleObjects.length);
        return { isValid: true, type: "multiple-objects", objects: multipleObjects };
      }
    }
    
    // If multiple JSON objects parsing fails, try JSONL format
    const isJsonl = detectJsonlFormat(jsonString);
    
    if (isJsonl) {
      console.log("Valid JSONL format");
      return { isValid: true, type: "jsonl" };
    } else {
      console.log("Invalid JSON:", err.message);
      return { isValid: false, error: err.message };
    }
  }
}

// Test with different inputs
console.log("Testing standard JSON object:");
console.log(validateJson(standardJson));
console.log("\n");

console.log("Testing JSON array:");
console.log(validateJson(jsonArray));
console.log("\n");

console.log("Testing JSONL format:");
console.log(validateJson(jsonlFormat));
console.log("\n");

console.log("Testing invalid JSON:");
console.log(validateJson(invalidJson));
console.log("\n");

console.log("Testing multiple JSON objects:");
console.log(validateJson(multipleJsonObjects));
console.log("\n");