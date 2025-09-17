require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jq = require('node-jq');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main jq processing endpoint
app.post('/api/jq', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { query, data } = req.body;
    
    // Validate input
    if (!query) {
      return res.status(400).json({
        error: 'Query is required',
        code: 'MISSING_QUERY'
      });
    }
    
    if (data === undefined || data === null) {
      return res.status(400).json({
        error: 'Data is required',
        code: 'MISSING_DATA'
      });
    }
    
    console.log(`Processing jq query: ${query}`);
    console.log(`Data type: ${typeof data}`);
    
    // Handle empty or whitespace-only queries
    if (!query.trim()) {
      return res.json({
        result: data,
        executionTime: Date.now() - startTime
      });
    }
    
    // Process with node-jq
    const result = await jq.run(query, data, { input: 'json' });
    
    const executionTime = Date.now() - startTime;
    console.log(`Query completed in ${executionTime}ms`);
    
    res.json({
      result,
      executionTime,
      query,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('jq processing error:', error);
    
    // Parse jq error messages for better user experience
    let errorMessage = error.message || 'Unknown jq error';
    let errorCode = 'JQ_ERROR';
    let errorDetails = {
      type: 'unknown',
      position: null,
      query: req.body.query,
      rawMessage: errorMessage
    };
    
    // Check for specific error types
    if (errorMessage.includes('ENOENT') || errorMessage.includes('command not found')) {
      errorMessage = 'jq command-line tool not found. Please install jq on the server.';
      errorCode = 'JQ_NOT_FOUND';
      errorDetails.type = 'environment';
    } else if (errorMessage.includes('spawn')) {
      errorMessage = 'Failed to spawn jq process. Please ensure jq is installed and accessible.';
      errorCode = 'JQ_SPAWN_ERROR';
      errorDetails.type = 'environment';
    } else {
      // Extract error type and position information
      
      // Syntax errors
      if (errorMessage.includes('syntax error')) {
        errorDetails.type = 'syntax';
        
        // Extract the query with error
        const queryMatch = errorMessage.match(/at <top-level>, line \d+:\n(.*?)(?:\njq:|$)/s);
        if (queryMatch && queryMatch[1]) {
          const errorQuery = queryMatch[1].trim();
          
          // Determine position based on error message
          if (errorMessage.includes('unexpected end of file')) {
            // Error at the end of the query
            errorDetails.position = {
              start: errorQuery.length,
              end: errorQuery.length + 1
            };
          } else if (errorMessage.includes('unterminated')) {
            // Unterminated statement
            if (errorMessage.includes("'if'")) {
              const ifIndex = errorQuery.indexOf('if');
              errorDetails.position = {
                start: ifIndex,
                end: errorQuery.length
              };
            } else {
              // Other unterminated statements
              errorDetails.position = {
                start: 0,
                end: errorQuery.length
              };
            }
          } else {
            // For other syntax errors, highlight the whole query
            errorDetails.position = {
              start: 0,
              end: errorQuery.length
            };
          }
        }
      } 
      // Type errors
      else if (errorMessage.includes('cannot be')) {
        errorDetails.type = 'type';
        
        // Try to extract the problematic part
        const typeMatch = errorMessage.match(/string \("([^"]+)"\) and (\w+)/);
        if (typeMatch) {
          const searchTerm = typeMatch[1];
          const queryIndex = req.body.query.indexOf(searchTerm);
          if (queryIndex !== -1) {
            errorDetails.position = {
              start: queryIndex,
              end: queryIndex + searchTerm.length
            };
          }
        } else {
          // If we can't extract specific position, highlight the whole query
          errorDetails.position = {
            start: 0,
            end: req.body.query.length
          };
        }
      }
      
      // Clean up jq error messages for display
      errorMessage = errorMessage
        .replace(/^jq: error: /, '')
        .replace(/^compile error: /, '')
        .replace(/\(while parsing.*?\)/, '')
        .replace(/^Error: /, '')
        .replace(/at <top-level>, line \d+:\n.*?(?:\njq:|$)/s, '')
        .trim();
    }
    
    res.status(400).json({
      error: errorMessage,
      code: errorCode,
      errorDetails: errorDetails,
      executionTime,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Endpoint to generate JQ query using Gemini AI
app.post('/api/generate-jq', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { inputJson, desiredOutput, extraPrompt, previousConversation } = req.body;
    
    // Validate input
    if (!inputJson) {
      return res.status(400).json({
        error: 'Input JSON is required',
        code: 'MISSING_INPUT_JSON'
      });
    }
    
    if (!desiredOutput) {
      return res.status(400).json({
        error: 'Desired output JSON is required',
        code: 'MISSING_DESIRED_OUTPUT'
      });
    }
    
    // Check if Gemini API is configured
    if (!genAI) {
      return res.status(500).json({
        error: 'Gemini API is not configured. Please set the GEMINI_API_KEY environment variable.',
        code: 'GEMINI_NOT_CONFIGURED'
      });
    }
    
    console.log('Generating JQ query with Gemini AI');
    console.log(`Request ID: ${Date.now()}-${Math.random().toString(36).substring(2, 10)}`);
    
    // Build the conversation history part of the prompt if available
    let conversationHistoryPrompt = '';
    if (previousConversation && Array.isArray(previousConversation) && previousConversation.length > 0) {
      console.log(`Continuing conversation with ${previousConversation.length} previous attempts`);
      
      conversationHistoryPrompt = `
Previous attempts to generate a JQ query that failed for this task:

${previousConversation.map((attempt, index) => `
Attempt ${index + 1}:
\`\`\`
${attempt.generatedJq}
\`\`\`
${attempt.isValid ? 'This query was valid but did not meet requirements.' : `This query was invalid with error: ${attempt.error || 'Unknown error'}`}
`).join('\n')}

Please generate a new JQ query that addresses the issues with the previous attempts. Try a different approach if necessary.
`;
    }
    
    // Format the prompt for Gemini
    const prompt = `
You are an expert in jq, a powerful command-line JSON processor.
You methodically examine the input JSON and the desired output JSON, then generate a jq query that transforms the input into the output by reasoning through the transformation script and the input and the output.
Validate the jq query you generate by running it against the input JSON to ensure it produces the desired output JSON.

Input JSON:
\`\`\`json
${inputJson}
\`\`\`

Desired Output JSON:
\`\`\`json
${desiredOutput}
\`\`\`

${extraPrompt ? `Additional instructions: ${extraPrompt}\n\n` : ''}
${conversationHistoryPrompt}

Please provide ONLY the jq query without any explanation or markdown formatting. 
The query should be a pure JQ script that follows standard jq syntax.
It should be as simple and efficient as possible.
Do not include any explanatory text, comments, or non-jq syntax.
`;
    
    // Log the full prompt sent to the LLM
    console.log('\n=== LLM PROMPT ===');
    console.log(prompt);
    console.log('=== END LLM PROMPT ===\n');
    
    // Call Gemini API with timing
    const llmStartTime = Date.now();
    console.log(`LLM request started at: ${new Date(llmStartTime).toISOString()}`);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(prompt);
    
    const llmEndTime = Date.now();
    const llmExecutionTime = llmEndTime - llmStartTime;
    console.log(`LLM request completed in ${llmExecutionTime}ms`);
    
    // Validate the response from Gemini
    if (!result || !result.response) {
      throw new Error('Empty or invalid response from Gemini API');
    }
    
    const response = result.response;
    
    // Ensure the response has a text method
    if (!response.text || typeof response.text !== 'function') {
      throw new Error('Invalid response format from Gemini API');
    }
    
    // Get the generated text and validate it
    const generatedText = response.text();
    if (!generatedText || typeof generatedText !== 'string') {
      throw new Error('Empty or invalid text in Gemini API response');
    }
    
    // Log the full response from the LLM
    console.log('\n=== LLM RESPONSE ===');
    console.log(generatedText);
    console.log('=== END LLM RESPONSE ===\n');
    
    // Log additional response metadata if available
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.safetyRatings) {
        console.log('Safety Ratings:', JSON.stringify(candidate.safetyRatings, null, 2));
      }
      if (candidate.finishReason) {
        console.log('Finish Reason:', candidate.finishReason);
      }
    }
    
    // Store the full LLM response to return to the client
    const llmResponse = generatedText;
    
    // Extract the JQ query from the response
    // Remove any markdown code blocks, backticks, or explanations
    let jqQuery;
    try {
      jqQuery = generatedText
        // Remove markdown code blocks
        .replace(/```jq\s*/g, '')
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        // Remove backticks
        .replace(/`/g, '')
        // Remove common explanatory text patterns
        .replace(/^jq query:?\s*/i, '')
        .replace(/^here'?s? (?:the|a) (?:jq)? query:?\s*/i, '')
        .replace(/^the (?:jq)? query (?:is|would be):?\s*/i, '')
        // Remove any HTML tags that might be present
        .replace(/<[^>]*>/g, '')
        // Remove any leading/trailing whitespace, quotes or special characters
        .trim()
        .replace(/^["']|["']$/g, '');
      
      // Validate that we have a non-empty query after extraction
      if (!jqQuery || !jqQuery.trim()) {
        throw new Error('Failed to extract a valid JQ query from the Gemini response');
      }
      
      // Format the JQ query for better readability
      // jqQuery = formatJqQuery(jqQuery);
      
    } catch (extractError) {
      console.error('Error extracting JQ query:', extractError);
      throw new Error('Failed to process the Gemini response: ' + 
        (extractError.message || 'Could not extract JQ query'));
    }
    
    // Function to format JQ query with proper indentation
    function formatJqQuery(query) {
      // Don't try to format empty queries
      if (!query || !query.trim()) {
        return query;
      }
      
      try {
        // Replace multiple spaces with a single space
        let formatted = query.replace(/\s+/g, ' ');
        
        // Add line breaks and indentation for better readability
        
        // Add line breaks after pipes
        formatted = formatted.replace(/\s*\|\s*/g, '\n| ');
        
        // Add line breaks and indentation for object construction
        formatted = formatted.replace(/\{\s*/g, '{\n  ');
        formatted = formatted.replace(/\s*\}/g, '\n}');
        formatted = formatted.replace(/;\s*/g, ';\n  ');
        
        // Add line breaks and indentation for array construction
        formatted = formatted.replace(/\[\s*/g, '[\n  ');
        formatted = formatted.replace(/\s*\]/g, '\n]');
        formatted = formatted.replace(/,\s*/g, ',\n  ');
        
        // Add line breaks for if/then/else statements
        formatted = formatted.replace(/\s*if\s+/g, '\nif ');
        formatted = formatted.replace(/\s*then\s+/g, '\n  then ');
        formatted = formatted.replace(/\s*else\s+/g, '\n  else ');
        formatted = formatted.replace(/\s*end/g, '\nend');
        
        // Clean up any double line breaks
        formatted = formatted.replace(/\n\s*\n/g, '\n');
        
        // Trim leading/trailing whitespace
        formatted = formatted.trim();
        
        console.log('Formatted JQ query:', formatted);
        return formatted;
      } catch (formatError) {
        // If formatting fails, return the original query
        console.error('Error formatting JQ query:', formatError);
        return query;
      }
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`Query generation completed in ${executionTime}ms`);
    
    // Validate the generated query by trying to run it
    let warning = null;
    try {
      // Parse the input JSON to ensure it's valid before passing to jq
      const parsedInput = JSON.parse(inputJson);
      
      // Run the query to validate it
      await jq.run(jqQuery, parsedInput, { input: 'json' });
      console.log('Generated query is valid');
    } catch (validationError) {
      console.warn('\n=== JQ VALIDATION ERROR ===');
      console.warn('Generated query may not be valid:', validationError.message);
      console.warn('Invalid JQ query:', jqQuery);
      console.warn('=== END JQ VALIDATION ERROR ===\n');
      
      // Include the specific error message in the warning
      warning = `The generated query is invalid: ${validationError.message}`;
    }
    
    // Return the result, including a warning if validation failed
    try {
      return res.json({
        jqQuery,
        llmResponse,
        executionTime,
        warning,
        timestamp: new Date().toISOString()
      });
    } catch (jsonError) {
      console.error('Error creating JSON response:', jsonError);
      throw new Error('Failed to create JSON response with the generated query');
    }
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Enhanced error logging for LLM communication
    console.error('\n=== LLM ERROR ===');
    console.error('Error generating JQ query:', error);
    
    // Log detailed error information
    if (error.name) console.error('Error name:', error.name);
    if (error.message) console.error('Error message:', error.message);
    if (error.stack) console.error('Stack trace:', error.stack);
    
    // Log additional error details if available
    if (error.response) {
      console.error('API Response:', error.response);
    }
    if (error.status) {
      console.error('Status code:', error.status);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    console.error('=== END LLM ERROR ===\n');
    
    try {
      // Sanitize error message to ensure it doesn't break JSON formatting
      let errorMessage = 'Failed to generate JQ query';
      if (error && typeof error.message === 'string') {
        // Limit error message length and remove any characters that might break JSON
        errorMessage += ': ' + error.message.substring(0, 500).replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      } else if (error && typeof error.toString === 'function') {
        errorMessage += ': ' + error.toString().substring(0, 500).replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      }
      
      // Send a properly formatted JSON response
      res.status(500).json({
        error: errorMessage,
        code: 'GENERATION_ERROR',
        executionTime,
        timestamp: new Date().toISOString()
      });
    } catch (jsonError) {
      // If JSON serialization fails, send a simple error response
      console.error('Error creating JSON response:', jsonError);
      res.status(500).send('Internal server error while generating JQ query');
    }
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 jq Playground Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/jq`);
});