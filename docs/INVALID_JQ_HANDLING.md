# Invalid JQ Handling

This document describes how the JQ Playground handles invalid JQ generation by the LLM and provides instructions for testing this functionality.

## Overview

When the LLM generates an invalid JQ query, the system now allows for a back-and-forth conversation with the LLM until a valid JQ query is generated. The user can break this conversation at any iteration.

## Implementation Details

### Client-Side

1. The `JqEditor` component tracks:
   - Whether the generated JQ is valid
   - The conversation history with the LLM

2. The `DesiredOutputModal` component:
   - Displays the validity status of the generated JQ
   - Shows controls for continuing or breaking the conversation when an invalid JQ is generated
   - Displays the conversation history

### Server-Side

1. The `/api/generate-jq` endpoint:
   - Accepts a `previousConversation` parameter in the request body
   - Includes the conversation history in the prompt to the LLM
   - Validates the generated JQ query

## Testing

### Prerequisites

1. Make sure the server is running:
   ```
   cd server && npm run dev
   ```

2. Make sure the client is running:
   ```
   npm run dev
   ```

3. Ensure you have set the `GEMINI_API_KEY` environment variable in the server's `.env` file.

### Test Cases

#### Test Case 1: Valid JQ Generation

1. Open the JQ Playground in your browser
2. Enter some valid JSON in the input editor
3. Click the "Generate JQ" button in the toolbar
4. Enter a desired output JSON that can be achieved with a simple JQ transformation
5. Click "Generate JQ"
6. Verify that:
   - The LLM generates a valid JQ query
   - The query is displayed with a "Valid JQ" badge
   - The query produces the desired output

#### Test Case 2: Invalid JQ Generation and Continuing Conversation

1. Open the JQ Playground in your browser
2. Enter some valid JSON in the input editor
3. Click the "Generate JQ" button in the toolbar
4. Enter a desired output JSON that is complex or requires a transformation that might lead to an invalid JQ query
   - For example, try to create a deeply nested structure or use complex transformations
5. Click "Generate JQ"
6. If the LLM generates an invalid JQ query:
   - Verify that the query is displayed with an "Invalid JQ" badge
   - Verify that "Continue with LLM" and "Break Conversation" buttons are displayed
7. Click "Continue with LLM"
8. Verify that:
   - The system sends the conversation history to the LLM
   - The LLM generates a new JQ query
   - The conversation history is updated
9. Repeat steps 6-8 until a valid JQ query is generated or you decide to break the conversation

#### Test Case 3: Breaking the Conversation

1. Follow steps 1-6 from Test Case 2
2. Click "Break Conversation"
3. Verify that:
   - The conversation is terminated
   - No new request is sent to the LLM
   - The modal remains open, allowing you to see the results

#### Test Case 4: Conversation History Display

1. Follow steps 1-8 from Test Case 2 multiple times
2. Verify that:
   - The conversation history section shows all attempts
   - Each attempt shows:
     - The attempt number
     - The generated JQ query
     - Whether it was valid or invalid
     - Any error messages for invalid attempts
   - The current attempt is highlighted

## Troubleshooting

If you encounter issues:

1. Check the browser console for any JavaScript errors
2. Check the server logs for any backend errors
3. Ensure the GEMINI_API_KEY is correctly set
4. Verify that the server is running and accessible

## Known Limitations

1. The LLM may not always be able to generate a valid JQ query, even after multiple attempts
2. Complex transformations may require manual adjustments to the generated JQ query
3. The conversation history is not persisted between sessions