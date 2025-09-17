const http = require('http');
const jq = require('node-jq');

// Test data
const inputJson = JSON.stringify({
  name: "John Doe",
  age: 30,
  address: {
    street: "123 Main St",
    city: "Anytown",
    zip: "12345"
  },
  hobbies: ["reading", "coding", "hiking"]
});

// Desired output for the test
const desiredOutput = JSON.stringify({
  fullName: "John Doe",
  contactInfo: {
    city: "Anytown",
    zipCode: "12345"
  },
  interests: ["reading", "coding", "hiking"]
});

function testGenerateJq() {
  console.log('Testing JQ generation with LLM...');
  console.log('Input JSON:', inputJson);
  console.log('Desired Output:', desiredOutput);
  
  const data = JSON.stringify({
    inputJson,
    desiredOutput
  });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/generate-jq',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  const req = http.request(options, (res) => {
    console.log('Response status:', res.statusCode);
    
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(responseData);
        console.log('Response body:', JSON.stringify(result, null, 2));
        
        if (res.statusCode === 200) {
          // Success case
          if (result.jqQuery) {
            console.log('Generated JQ query:', result.jqQuery);
            console.log('Execution time:', result.executionTime, 'ms');
            
            // Check if there's a warning
            if (result.warning) {
              console.log('Warning:', result.warning);
            } else {
              console.log('Query is valid (no warnings)');
            }
            
            // Validate that the query is a pure JQ script
            validateJqQuery(result.jqQuery, JSON.parse(inputJson), JSON.parse(desiredOutput));
          } else {
            console.log('No JQ query in response');
            console.log('Test FAILED ❌');
          }
        } else if (res.statusCode === 500 && result.code === 'GEMINI_NOT_CONFIGURED') {
          // Expected error if Gemini API is not configured
          console.log('Gemini API not configured. This is expected if GEMINI_API_KEY is not set.');
          console.log('Error message:', result.error);
          console.log('Test PASSED ✅ (API key not configured)');
        } else {
          // Unexpected error
          console.log('Unexpected error:', result.error);
          console.log('Error code:', result.code);
          console.log('Test FAILED ❌');
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        console.log('Test FAILED ❌');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error making request:', error);
    console.log('Make sure the server is running on port 3001');
    console.log('Test FAILED ❌');
  });
  
  req.write(data);
  req.end();
}

// Function to validate the JQ query
async function validateJqQuery(jqQuery, inputData, desiredOutput) {
  console.log('\nValidating JQ query as a pure JQ script...');
  
  // Check for common non-JQ elements
  const nonJqPatterns = [
    { pattern: /console\.log/i, description: 'JavaScript console.log' },
    { pattern: /function\s*\(/, description: 'JavaScript function' },
    { pattern: /import\s+/, description: 'import statement' },
    { pattern: /require\s*\(/, description: 'require statement' },
    { pattern: /\/\//, description: 'JavaScript-style comments' },
    { pattern: /\/\*[\s\S]*?\*\//, description: 'Multi-line comments' },
    { pattern: /print\s*\(/, description: 'print statement' }
  ];
  
  let isPureJq = true;
  
  // Check for non-JQ elements
  for (const { pattern, description } of nonJqPatterns) {
    if (pattern.test(jqQuery)) {
      console.log(`❌ Query contains non-JQ element: ${description}`);
      isPureJq = false;
    }
  }
  
  if (isPureJq) {
    console.log('✅ Query appears to be a pure JQ script (no non-JQ elements detected)');
  }
  
  // Run the query against the input data
  try {
    console.log('Running the generated query against the input data...');
    const result = await jq.run(jqQuery, inputData, { input: 'json' });
    console.log('Query execution successful');
    
    // Parse the result if it's a string
    const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
    console.log('Result:', JSON.stringify(parsedResult, null, 2));
    
    // Compare with desired output
    const isEqual = JSON.stringify(parsedResult) === JSON.stringify(desiredOutput);
    
    if (isEqual) {
      console.log('✅ The query produces the exact desired output');
      console.log('Test PASSED ✅');
    } else {
      console.log('❌ The query does not produce the exact desired output');
      console.log('Expected:', JSON.stringify(desiredOutput, null, 2));
      console.log('Actual:', JSON.stringify(parsedResult, null, 2));
      console.log('Test FAILED ❌');
    }
  } catch (error) {
    console.error('❌ Error executing the query:', error.message);
    console.log('Test FAILED ❌');
  }
}

// Run the test
testGenerateJq();

console.log('\nNote: This test requires the server to be running.');
console.log('Start the server with: cd server && npm run dev');
console.log('If you have set the GEMINI_API_KEY environment variable, the test will attempt to generate a JQ query.');
console.log('If not, it will expect an error response indicating that the API key is not configured.');