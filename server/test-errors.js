const jq = require('node-jq');

// Test data
const testData = {
  name: "John Doe",
  age: 30,
  address: {
    street: "123 Main St",
    city: "Anytown",
    zip: "12345"
  },
  hobbies: ["reading", "coding", "hiking"]
};

// Test queries with errors
const testQueries = [
  '.name + 5',                // Type error
  '.address.street[',         // Syntax error - unclosed bracket
  '.hobbies | map(.length',   // Syntax error - unclosed parenthesis
  '.unknown | .property',     // Reference to non-existent property
  'if .age > 25 then .name'   // Incomplete if statement
];

// Run each query and log the error
async function testErrors() {
  for (const query of testQueries) {
    try {
      console.log(`\nTesting query: ${query}`);
      const result = await jq.run(query, testData, { input: 'json' });
      console.log('Result:', result);
    } catch (error) {
      console.log('Error type:', typeof error);
      console.log('Error message:', error.message);
      console.log('Error object:', JSON.stringify(error, null, 2));
      
      // Try to extract position information
      const match = error.message.match(/at line (\d+), column (\d+)/);
      if (match) {
        console.log(`Position information found: line ${match[1]}, column ${match[2]}`);
      } else {
        console.log('No position information found in error message');
      }
    }
  }
}

testErrors().catch(console.error);