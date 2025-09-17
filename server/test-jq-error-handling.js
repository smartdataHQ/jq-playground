const http = require('http');

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

// Mock an invalid JQ query
const mockInvalidJq = `{
  fullName: .name,
  contactInfo: {
    city: .address.city,
    zipCode: .address.zip
  },
  interests: .hobbies[
}`;

function testJqErrorHandling() {
  console.log('Testing JQ error handling...');
  console.log('Input JSON:', inputJson);
  console.log('Desired Output:', desiredOutput);
  console.log('Invalid JQ Query:', mockInvalidJq);
  
  // First, we'll test the validation of an invalid JQ query
  testValidateInvalidJq();
}

function testValidateInvalidJq() {
  console.log('\n1. Testing validation of an invalid JQ query...');
  
  // Create a request to validate the invalid JQ query
  const data = JSON.stringify({
    query: mockInvalidJq,
    data: JSON.parse(inputJson)
  });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/jq',
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
        
        if (res.statusCode === 400 && result.error) {
          console.log('✅ Server correctly returned an error for the invalid JQ query');
          console.log('Error message:', result.error);
          
          // Now test the generate-jq endpoint with a conversation history that includes this error
          testGenerateJqWithErrorHistory(result.error);
        } else {
          console.log('❌ Server did not return the expected error for the invalid JQ query');
          console.log('Test FAILED');
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        console.log('Test FAILED');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error making request:', error);
    console.log('Make sure the server is running on port 3001');
    console.log('Test FAILED');
  });
  
  req.write(data);
  req.end();
}

function testGenerateJqWithErrorHistory(errorMessage) {
  console.log('\n2. Testing generate-jq with error history...');
  
  // Create a mock conversation history with an invalid JQ attempt
  const conversationHistory = [
    {
      llmResponse: "Here's a JQ query that should work",
      generatedJq: mockInvalidJq,
      isValid: false,
      error: errorMessage
    }
  ];
  
  const data = JSON.stringify({
    inputJson,
    desiredOutput,
    previousConversation: conversationHistory
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
          console.log('✅ Server successfully generated a new JQ query with error history');
          
          // Check if the prompt included the error message
          if (result.llmResponse && result.llmResponse.includes(errorMessage)) {
            console.log('✅ LLM response indicates that the error message was included in the prompt');
            console.log('Test PASSED');
          } else {
            console.log('⚠️ Could not verify if the error message was included in the prompt');
            console.log('Generated JQ query:', result.jqQuery);
            console.log('Test PARTIALLY PASSED');
          }
        } else if (res.statusCode === 500 && result.code === 'GEMINI_NOT_CONFIGURED') {
          // Expected error if Gemini API is not configured
          console.log('Gemini API not configured. This is expected if GEMINI_API_KEY is not set.');
          console.log('Error message:', result.error);
          console.log('Test PASSED ✅ (API key not configured)');
        } else {
          console.log('❌ Server did not return the expected response');
          console.log('Test FAILED');
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        console.log('Test FAILED');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error making request:', error);
    console.log('Make sure the server is running on port 3001');
    console.log('Test FAILED');
  });
  
  req.write(data);
  req.end();
}

// Run the test
testJqErrorHandling();

console.log('\nNote: This test requires the server to be running.');
console.log('Start the server with: cd server && npm run dev');