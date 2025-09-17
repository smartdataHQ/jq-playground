# LLM Communication Logging

This document describes the enhanced logging implemented for all communications with the LLM (Gemini) in the JQ Playground server.

## Overview

The server now includes comprehensive logging for all interactions with the LLM, including:

1. The full prompt sent to the LLM
2. The complete response received from the LLM
3. Detailed error information for any failures
4. JQ validation errors
5. Timing information for LLM requests

## Logging Format

All LLM-related logs use a consistent format with clear section markers:

- `=== LLM PROMPT ===`: Marks the beginning of a prompt sent to the LLM
- `=== LLM RESPONSE ===`: Marks the beginning of a response received from the LLM
- `=== LLM ERROR ===`: Marks the beginning of an error in LLM communication
- `=== JQ VALIDATION ERROR ===`: Marks the beginning of a JQ validation error

Each section ends with a corresponding `=== END X ===` marker.

## What's Logged

### For Each LLM Request

1. **Request ID**: A unique identifier for each request
   ```
   Request ID: 1627293847-a1b2c3d4
   ```

2. **Conversation Context**: If continuing a conversation
   ```
   Continuing conversation with 2 previous attempts
   ```

3. **Full Prompt**: The complete prompt sent to the LLM
   ```
   === LLM PROMPT ===
   You are an expert in jq...
   === END LLM PROMPT ===
   ```

4. **Timing Information**: When the request started and how long it took
   ```
   LLM request started at: 2025-07-26T18:30:45.123Z
   LLM request completed in 2500ms
   ```

5. **Full Response**: The complete response from the LLM
   ```
   === LLM RESPONSE ===
   {
     "name": .name,
     "age": .age
   }
   === END LLM RESPONSE ===
   ```

6. **Response Metadata**: Additional information about the response
   ```
   Safety Ratings: [...]
   Finish Reason: STOP
   ```

7. **JQ Validation**: Results of validating the generated JQ query
   ```
   Generated query is valid
   ```
   
   Or if validation fails:
   ```
   === JQ VALIDATION ERROR ===
   Generated query may not be valid: unexpected token: ]
   Invalid JQ query: { name: .name, ] }
   === END JQ VALIDATION ERROR ===
   ```

8. **Error Information**: Detailed information about any errors
   ```
   === LLM ERROR ===
   Error generating JQ query: Error: Failed to connect to API
   Error name: Error
   Error message: Failed to connect to API
   Stack trace: Error: Failed to connect...
   === END LLM ERROR ===
   ```

## Testing the Logging

To test the enhanced logging:

1. Start the server:
   ```
   cd server
   npm run dev
   ```

2. Make a request to the `/api/generate-jq` endpoint:
   ```
   node test-generate-jq.js
   ```

3. Check the server console output for the detailed logging of:
   - The prompt sent to the LLM
   - The response received
   - Timing information
   - Any errors or validation issues

4. To test error logging, you can:
   - Temporarily disable your internet connection
   - Set an invalid API key in the .env file
   - Use the test-jq-error.js script to test validation errors

## Benefits

This enhanced logging provides several benefits:

1. **Debugging**: Easier to identify issues with LLM communication
2. **Monitoring**: Better visibility into LLM performance and response times
3. **Auditing**: Complete record of all prompts and responses for review
4. **Development**: Clearer understanding of how prompt changes affect responses

## Implementation Details

The logging is implemented in the `/api/generate-jq` endpoint in `server.js`. Key components:

- Request ID generation
- Structured section markers for different log types
- Comprehensive error logging with detailed information
- Timing measurements for LLM requests specifically
- Consistent formatting across all log types