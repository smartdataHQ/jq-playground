const http = require('http');

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

// Test query with syntax error
const testQuery = '.name + ['; // Unclosed bracket syntax error

function testJqError() {
  console.log('Sending request to JQ server...');
  
  const data = JSON.stringify({
    query: testQuery,
    data: testData
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
        
        // Check if error details are included
        if (result.errorDetails) {
          console.log('Error details found:');
          console.log('- Type:', result.errorDetails.type);
          console.log('- Position:', result.errorDetails.position);
          console.log('- Raw message:', result.errorDetails.rawMessage);
        } else {
          console.log('No error details found in response');
        }
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error making request:', error);
  });
  
  req.write(data);
  req.end();
}

testJqError();