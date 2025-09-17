const API_BASE_URL = 'http://localhost:3001';

// Define an interface for the error details
export interface JqErrorDetails {
  type: 'syntax' | 'type' | 'environment' | 'unknown';
  position: { start: number; end: number } | null;
  query: string;
  rawMessage: string;
}

// Define a custom error class that includes error details
export class JqError extends Error {
  details: JqErrorDetails;
  
  constructor(message: string, details: JqErrorDetails) {
    super(message);
    this.name = 'JqError';
    this.details = details;
  }
}

export async function processJq(jsonInput: string, jqQuery: string): Promise<unknown> {
  console.log('🚀 processJq called with:', { 
    jsonInputLength: jsonInput.length, 
    jqQuery,
    timestamp: new Date().toISOString()
  });

  try {
    // Parse JSON input to validate it
    console.log('📝 Parsing JSON input...');
    const data = JSON.parse(jsonInput);
    console.log('✅ JSON parsed successfully, type:', typeof data);
    console.log('📊 Data keys:', Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data || {}));
    
    // Handle empty or whitespace-only queries
    if (!jqQuery.trim()) {
      console.log('⚠️ Empty query, returning original data');
      return data;
    }
    
    // Call backend API
    console.log('🌐 Calling backend API...');
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE_URL}/api/jq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: jqQuery,
        data: data
      })
    });
    
    const endTime = Date.now();
    console.log(`🌐 API call completed in ${endTime - startTime}ms`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API error response:', errorData);
      
      // Check if the error response includes detailed error information
      if (errorData.errorDetails) {
        throw new JqError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          errorData.errorDetails
        );
      } else {
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    const result = await response.json();
    console.log('✅ API response received:', {
      executionTime: result.executionTime,
      resultType: typeof result.result
    });
    console.log('📤 Raw result:', result.result);
    
    // Parse JSON strings when possible (common with jq object constructions like {name, email})
    let processedResult = result.result;
    
    if (typeof result.result === 'string') {
      try {
        const trimmed = result.result.trim();
        
        // Handle single JSON object or array
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          const parsed = JSON.parse(result.result);
          console.log('🔄 Parsed single JSON result:', parsed);
          processedResult = parsed;
        }
        // Handle multiple JSON objects/arrays separated by newlines (common with jq)
        else if (trimmed.includes('\n') && (trimmed.includes('{') || trimmed.includes('['))) {
          const lines = trimmed.split('\n').filter(line => line.trim());
          const parsedLines = [];
          let allParsed = true;
          
          for (const line of lines) {
            const lineTrimmed = line.trim();
            if ((lineTrimmed.startsWith('{') && lineTrimmed.endsWith('}')) || 
                (lineTrimmed.startsWith('[') && lineTrimmed.endsWith(']'))) {
              try {
                parsedLines.push(JSON.parse(lineTrimmed));
              } catch {
                allParsed = false;
                break;
              }
            } else {
              allParsed = false;
              break;
            }
          }
          
          if (allParsed && parsedLines.length > 0) {
            console.log('🔄 Parsed multiple JSON results:', parsedLines);
            processedResult = parsedLines.length === 1 ? parsedLines[0] : parsedLines;
          }
        }
      } catch (parseError) {
        // If parsing fails, keep the original string
        console.log('⚠️ Could not parse result as JSON, keeping as string');
      }
    }
    
    console.log('📤 Final processed result:', processedResult);
    return processedResult;
    
  } catch (error) {
    console.error('❌ processJq error occurred:');
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error constructor:', error?.constructor?.name);
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Handle network errors
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('fetch')) {
      errorMessage = 'Unable to connect to jq server. Please ensure the backend server is running on port 3001.';
    } else if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Network error: Cannot reach jq processing server. Please check if the server is running.';
    }
    
    console.error('📝 Final error message:', errorMessage);
    throw new Error(errorMessage);
  }
}