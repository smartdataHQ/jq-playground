import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import { FileText, Wand2, Minimize2, Upload, LayoutGrid, ArrowLeft, ArrowRight, RotateCcw, Code2, Eye, FileJson, Settings, FileCode } from 'lucide-react';
import { setupJsonTheme } from '../utils/monacoTheme';
import { DraggableJsonViewer } from './DraggableJsonViewer';
import { processJq } from '../utils/jqProcessor';
import { Tooltip } from './Tooltip';
import * as yaml from 'js-yaml';
import { fetchSchemaFromUrl, parseSchemaString, isValidJsonSchema } from '../utils/schemaLoader';
import { getSchemaByName, getAvailableSchemas, getSampleData, loadSchemaByName } from '../utils/sampleSchemas';
import { SchemaModal } from './SchemaModal';

// Define a type for JSON paths to fix ESLint warnings
interface JsonPathType {
  path: string;
  jqSelector: string;
  type: string;
  value?: unknown;
}

// Constants for Row Mode
const LARGE_ARRAY_THRESHOLD = 10; // Auto-enable Row Mode for arrays larger than this (reduced for testing)
const VERY_LARGE_ARRAY_THRESHOLD = 100; // Show warning for very large arrays (reduced for testing)

// Constants for file size thresholds
const LARGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Constants for JSONL detection
const MIN_JSONL_LINES = 2; // Minimum number of lines to consider as JSONL
const JSONL_SAMPLE_LINES = 10; // Number of lines to sample for JSONL detection

interface JsonInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidityChange: (isValid: boolean) => void;
  pathCount?: number;
  onJsonPathsGenerated?: (paths: JsonPathType[]) => void;
  viewMode?: 'editor' | 'viewer';
  onViewModeChange?: (mode: 'editor' | 'viewer') => void;
  jqQuery?: string; // Add jqQuery prop to receive the current jq query
  onRowDataChange?: (rowData: string | null) => void; // Add callback for row data changes
  
  // New props for consolidated header
  onSave?: () => void; // Callback for Save button
  onVersionHistory?: () => void; // Callback for History button
  onHelp?: () => void; // Callback for Help button
  onSampleChange?: (sample: string) => void; // Callback for Sample selector
  sampleOptions?: { [key: string]: string }; // Sample options for dropdown
  selectedSample?: string; // Currently selected sample
  
  // JSON Schema validation
  jsonSchema?: object | null; // The JSON schema object for validation and autocomplete
}

export interface JsonInputRef {
  formatJson: () => void;
  minifyJson: () => void;
  triggerFileUpload: () => void;
  setViewMode: (mode: 'editor' | 'viewer') => void;
  getViewMode: () => 'editor' | 'viewer';
  toggleRowMode: () => void;
  nextArrayItem: () => void;
  prevArrayItem: () => void;
  showAllItems: () => void;
  jumpToIndex: (index: number) => void;
  isRowModeEnabled: () => boolean;
  getCurrentIndex: () => number;
  getTotalItems: () => number;
  /**
   * Extracts an array from a JSON object with a single key and enables Row Mode.
   * This is useful when the actual data you want to work with is nested under a single key.
   * For example, converts {"data": [1, 2, 3]} to [1, 2, 3] and enables Row Mode.
   * @returns boolean - true if extraction was successful, false otherwise
   */
  extractArrayFromSingleKey: () => boolean;
}

/**
 * Tries to convert YAML to JSON
 * @param content The content to convert
 * @returns An object with the converted content, a flag indicating if conversion happened, and any error message
 */
const tryConvertYamlToJson = (content: string): { content: string; converted: boolean; error?: string } => {
  // Try to parse as JSON first
  let isValidJson = false;
  try {
    JSON.parse(content);
    isValidJson = true;
  } catch {
    // Not valid JSON, might be YAML
  }
  
  // If not valid JSON, try to parse as YAML
  if (!isValidJson) {
    try {
      // Try to parse as YAML
      const parsedYaml = yaml.load(content);
      
      // If successful and result is an object or array, convert to JSON
      if (parsedYaml !== null && typeof parsedYaml === 'object') {
        // Convert YAML to JSON with pretty formatting
        const jsonContent = JSON.stringify(parsedYaml, null, 2);
        return { content: jsonContent, converted: true };
      } else if (parsedYaml === null) {
        return { content, converted: false, error: "YAML parsed as null" };
      } else {
        return { content, converted: false, error: `YAML parsed as ${typeof parsedYaml}, expected object or array` };
      }
    } catch (yamlError) {
      // Not valid YAML either, leave as is
      console.log('Not valid YAML:', yamlError);
      const errorMessage = yamlError instanceof Error ? yamlError.message : 'Unknown YAML parsing error';
      return { content, converted: false, error: `YAML parsing failed: ${errorMessage}` };
    }
  }
  
  // Return original content if it's already valid JSON
  return { content, converted: false };
};

const JsonInput = forwardRef<JsonInputRef, JsonInputProps>(({ 
  value, 
  onChange, 
  onValidityChange, 
  pathCount = 0,
  onJsonPathsGenerated,
  viewMode: externalViewMode,
  onViewModeChange,
  jqQuery = '', // Default to empty string if not provided
  onRowDataChange,
  // New props for consolidated header
  onSave,
  onVersionHistory,
  onHelp,
  onSampleChange,
  sampleOptions = {},
  selectedSample,
  // JSON Schema validation
  jsonSchema
}, ref) => {
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lineCount, setLineCount] = useState(1);
  const [internalViewMode, setInternalViewMode] = useState<'editor' | 'viewer'>('editor');
  const [arrayLength, setArrayLength] = useState(0);
  const [isJsonlFormat, setIsJsonlFormat] = useState(false);
  const [rowModeEnabled, setRowModeEnabled] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [parsedJson, setParsedJson] = useState<unknown>(null);
  const [originalJson, setOriginalJson] = useState('');
  const [displayedJson, setDisplayedJson] = useState('');
  const [yamlConversionNotice, setYamlConversionNotice] = useState(false);
  // Tracks if the current JSON is an object with a single key containing an array
  // Used to show/hide the "Extract Array" button
  const [hasSingleKeyArray, setHasSingleKeyArray] = useState(false);
  // State to track if the action menu is open
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  // State to track if a drag is over the dropzone
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Schema-related state
  const [schemaValidationEnabled, setSchemaValidationEnabled] = useState(false);
  const [customSchema, setCustomSchema] = useState<object | null>(null);
  const [schemaSource, setSchemaSource] = useState<'none' | 'predefined' | 'url' | 'custom'>('none');
  const [selectedPredefinedSchema, setSelectedPredefinedSchema] = useState<string | null>(null);
  const [schemaUrl, setSchemaUrl] = useState('');
  const [schemaText, setSchemaText] = useState('');
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  
  const editorRef = useRef<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  
  // Use external viewMode if provided, otherwise use internal state
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  
  // Function to update viewMode that respects both internal state and external control
  const updateViewMode = (mode: 'editor' | 'viewer') => {
    if (externalViewMode === undefined) {
      setInternalViewMode(mode);
    }
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };
  
  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Handle file drop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        // Use the existing file upload handler
        const input = fileInputRef.current;
        if (input) {
          // Create a DataTransfer object
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          
          // Set the files property of the input element
          input.files = dataTransfer.files;
          
          // Trigger the change event
          const event = new Event('change', { bubbles: true });
          input.dispatchEvent(event);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  // Handle click outside to close the action menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to detect and parse JSONL format
  const detectAndParseJsonl = (jsonString: string): { isJsonl: boolean; length: number } => {
    // If string is empty or too short, it's not JSONL
    if (!jsonString || jsonString.trim().length === 0) {
      return { isJsonl: false, length: 0 };
    }

    // Split by lines and filter out empty lines
    const lines = jsonString.split('\n').filter(line => line.trim().length > 0);
    
    // If there are fewer than MIN_JSONL_LINES lines, it's not JSONL
    if (lines.length < MIN_JSONL_LINES) {
      return { isJsonl: false, length: 0 };
    }

    // Sample the first JSONL_SAMPLE_LINES lines (or all if fewer)
    const sampleSize = Math.min(lines.length, JSONL_SAMPLE_LINES);
    const sampleLines = lines.slice(0, sampleSize);
    
    // Try to parse each line as JSON
    let validJsonLines = 0;
    for (const line of sampleLines) {
      try {
        const parsed = JSON.parse(line);
        // Each line should be an object or primitive, not an array
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          validJsonLines++;
        }
      } catch {
        // If any line fails to parse, it's not a valid JSONL line
      }
    }
    
    // If most of the sample lines are valid JSON objects, consider it JSONL
    const isJsonl = validJsonLines >= Math.max(2, sampleSize * 0.7); // At least 70% of lines should be valid JSON
    
    if (isJsonl) {
      // Count valid lines
      let validLines = 0;
      for (const line of lines) {
        try {
          JSON.parse(line);
          validLines++;
        } catch {
          // Skip invalid lines
        }
      }
      return { isJsonl, length: validLines };
    }
    
    return { isJsonl: false, length: 0 };
  };

  // Helper function to detect if a string might contain multiple JSON objects
  const detectMultipleJsonObjects = (jsonString: string): boolean => {
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
  };
  
  // Helper function to try parsing multiple JSON objects
  const tryParseMultipleJsonObjects = (jsonString: string): unknown[] | null => {
    try {
      // Split the input by lines
      const lines = jsonString.split('\n');
      const objects: unknown[] = [];
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
  };

  const validateJson = (jsonString: string) => {
    // Reset JSONL format state
    setIsJsonlFormat(false);
    // Reset single key array state
    setHasSingleKeyArray(false);
    
    try {
      // First, try to parse as standard JSON
      const parsed = JSON.parse(jsonString);
      setIsValid(true);
      setErrorMessage('');
      onValidityChange(true);
      
      // Store the parsed JSON and original JSON string
      setParsedJson(parsed);
      setOriginalJson(jsonString);
      
      // Check if it's an object with a single key containing an array
      // This is used to determine whether to show the "Extract Array" button
      // For example, if the JSON is {"data": [1, 2, 3]}, we want to show a button
      // that allows the user to extract the array [1, 2, 3] and enable Row Mode
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        if (keys.length === 1 && Array.isArray(parsed[keys[0]]) && parsed[keys[0]].length > 0) {
          setHasSingleKeyArray(true);
        }
      }
      
      // Check if the parsed JSON is an array
      if (Array.isArray(parsed)) {
        setArrayLength(parsed.length);
        
        // Auto-enable Row Mode for large arrays
        if (parsed.length > LARGE_ARRAY_THRESHOLD && !rowModeEnabled) {
          setRowModeEnabled(true);
          setCurrentRowIndex(0);
          updateDisplayedJson(parsed, 0);
        } else if (rowModeEnabled) {
          // If Row Mode is already enabled, update the displayed JSON
          updateDisplayedJson(parsed, currentRowIndex);
        } else {
          // If Row Mode is not enabled, display the full JSON
          setDisplayedJson(jsonString);
        }
        
        // Show warning for very large arrays
        if (parsed.length > VERY_LARGE_ARRAY_THRESHOLD) {
          setErrorMessage(`Warning: This array contains ${parsed.length.toLocaleString()} items. Consider using Row Mode for better performance.`);
        }
      } else {
        // Reset array-related state if not an array
        setArrayLength(0);
        setRowModeEnabled(false);
        setDisplayedJson(jsonString);
        
        // If Row Mode was enabled but the JSON is no longer an array, disable it
        if (rowModeEnabled) {
          setRowModeEnabled(false);
        }
      }
    } catch (err) {
      // If standard JSON parsing fails, first try to detect and parse multiple JSON objects
      if (detectMultipleJsonObjects(jsonString)) {
        const multipleObjects = tryParseMultipleJsonObjects(jsonString);
        
        if (multipleObjects && multipleObjects.length > 1) {
          // Successfully parsed multiple JSON objects, treat as array
          const arrayJson = JSON.stringify(multipleObjects, null, 2);
          
          // Update the value with the array version
          onChange(arrayJson);
          
          // Set valid state
          setIsValid(true);
          setErrorMessage('');
          onValidityChange(true);
          
          // Store the parsed JSON and original JSON string
          setParsedJson(multipleObjects);
          setOriginalJson(arrayJson);
          
          // Set array-related state
          setArrayLength(multipleObjects.length);
          
          // Auto-enable Row Mode for large arrays
          if (multipleObjects.length > LARGE_ARRAY_THRESHOLD && !rowModeEnabled) {
            setRowModeEnabled(true);
            setCurrentRowIndex(0);
            updateDisplayedJson(multipleObjects, 0);
          } else if (rowModeEnabled) {
            // If Row Mode is already enabled, update the displayed JSON
            updateDisplayedJson(multipleObjects, currentRowIndex);
          } else {
            // If Row Mode is not enabled, display the full JSON
            setDisplayedJson(arrayJson);
          }
          
          // Show warning for very large arrays
          if (multipleObjects.length > VERY_LARGE_ARRAY_THRESHOLD) {
            setErrorMessage(`Warning: This array contains ${multipleObjects.length.toLocaleString()} items. Consider using Row Mode for better performance.`);
          }
          
          return; // Exit early since we've handled the input
        }
      }
      
      // If multiple JSON objects parsing fails, try JSONL format
      const { isJsonl, length } = detectAndParseJsonl(jsonString);
      
      if (isJsonl && length > 0) {
        // It's valid JSONL
        setIsValid(true);
        setErrorMessage('');
        onValidityChange(true);
        
        // Set JSONL-specific state
        setIsJsonlFormat(true);
        
        // Treat JSONL like an array for array length
        setArrayLength(length);
        
        // Store the original JSON string
        setOriginalJson(jsonString);
        setDisplayedJson(jsonString);
        
        // Auto-enable Row Mode for large JSONL files
        if (length > LARGE_ARRAY_THRESHOLD && !rowModeEnabled) {
          setRowModeEnabled(true);
          setCurrentRowIndex(0);
          // For JSONL, we'll handle the display differently
          // This will be implemented in a separate function
        }
      } else {
        // Neither valid JSON nor valid JSONL nor multiple JSON objects
        setIsValid(false);
        const errorMsg = err instanceof Error ? err.message : 'Invalid JSON';
        setErrorMessage(errorMsg);
        onValidityChange(false);
        
        // Reset array-related state on error
        setArrayLength(0);
        setRowModeEnabled(false);
        setParsedJson(null);
        setOriginalJson('');
        setDisplayedJson('');
      }
    }
  };
  
  // Function to update the displayed JSON based on the current row index
  const updateDisplayedJson = (parsed: unknown, index: number) => {
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure index is within bounds
      const safeIndex = Math.max(0, Math.min(index, parsed.length - 1));
      
      // Extract the current item and format it
      try {
        const currentItem = parsed[safeIndex];
        const formattedItem = JSON.stringify(currentItem, null, 2);
        setDisplayedJson(formattedItem);
        
        // Notify parent component about row data change if callback is provided
        if (onRowDataChange) {
          onRowDataChange(formattedItem);
        }
      } catch (err) {
        console.error('Error formatting JSON item:', err);
        const fallbackItem = JSON.stringify(parsed[safeIndex]);
        setDisplayedJson(fallbackItem);
        
        // Notify parent component about row data change if callback is provided
        if (onRowDataChange) {
          onRowDataChange(fallbackItem);
        }
      }
    } else {
      // If not an array or empty array, display the original JSON
      setDisplayedJson(JSON.stringify(parsed, null, 2));
      
      // Reset row data in parent component if callback is provided
      if (onRowDataChange) {
        onRowDataChange(null);
      }
    }
  };

  useEffect(() => {
    validateJson(value);
    setLineCount(value.split('\n').length);
  }, [value]);
  
  // Function to load schema from URL
  const loadSchemaFromUrl = async (url: string) => {
    if (!url.trim()) {
      setSchemaError('URL cannot be empty');
      return;
    }
    
    setIsLoadingSchema(true);
    setSchemaError(null);
    
    try {
      // The fetchSchemaFromUrl function now has automatic CORS proxy fallback
      const schema = await fetchSchemaFromUrl(url);
      setCustomSchema(schema);
      setSchemaValidationEnabled(true);
      setSchemaSource('url');
      setSchemaUrl(url); // Save the URL in state so it's remembered when the modal is reopened
      applySchemaToEditor(schema);
      console.log('JsonInput: Schema loaded successfully from URL:', url);
    } catch (error) {
      console.error('JsonInput: Error loading schema from URL:', error);
      setSchemaError(error instanceof Error ? error.message : 'Failed to load schema');
      setCustomSchema(null);
      setSchemaValidationEnabled(false);
    } finally {
      setIsLoadingSchema(false);
    }
  };
  
  // Function to load schema from text input
  const loadSchemaFromText = (text: string) => {
    if (!text.trim()) {
      setSchemaError('Schema cannot be empty');
      return;
    }
    
    setSchemaError(null);
    
    try {
      const schema = parseSchemaString(text);
      if (!isValidJsonSchema(schema)) {
        setSchemaError('Invalid JSON Schema format');
        return;
      }
      
      setCustomSchema(schema);
      setSchemaValidationEnabled(true);
      setSchemaSource('custom');
      applySchemaToEditor(schema);
    } catch (error) {
      setSchemaError(error instanceof Error ? error.message : 'Failed to parse schema');
      setCustomSchema(null);
      setSchemaValidationEnabled(false);
    }
  };
  
  // Function to load predefined schema
  const loadPredefinedSchema = async (schemaName: string) => {
    setSchemaError(null);
    setIsLoadingSchema(true);
  
    try {
      // First try to get the schema synchronously
      let schema = getSchemaByName(schemaName);
    
      // If schema is null but it might be a schema from public/schema directory
      if (!schema) {
        console.log(`Attempting to load schema ${schemaName} asynchronously`);
      
        // Try to load it asynchronously
        schema = await loadSchemaByName(schemaName);
      
        if (!schema) {
          setSchemaError(`Schema "${schemaName}" not found`);
          setIsLoadingSchema(false);
          return;
        }
      }
    
      setCustomSchema(schema);
      setSelectedPredefinedSchema(schemaName);
      setSchemaValidationEnabled(true);
      setSchemaSource('predefined');
      applySchemaToEditor(schema);
    } catch (error) {
      console.error(`Error loading schema ${schemaName}:`, error);
      setSchemaError(error instanceof Error ? error.message : `Failed to load schema "${schemaName}"`);
    } finally {
      setIsLoadingSchema(false);
    }
  };
  
  // Function to apply schema to the editor
  const applySchemaToEditor = (schema: object | null) => {
    console.log('JsonInput: Applying schema to editor:', schema ? 'valid schema object' : 'null schema');
    
    if (!editorRef.current) {
      console.warn('JsonInput: Editor reference is not available');
      return;
    }
    
    const monaco = window.monaco;
    if (!monaco || !monaco.languages || !monaco.languages.json) {
      console.error('JsonInput: Monaco editor or languages.json not available');
      return;
    }
    
    try {
      const diagnosticsOptions = {
        validate: true,
        allowComments: false,
        schemas: [],
        enableSchemaRequest: true
      };
      
      if (schema && schemaValidationEnabled) {
        console.log('JsonInput: Schema validation is enabled, adding schema to diagnostics options');
        
        // Extract the $id from the schema if available, otherwise use a default URI
        const schemaObj = schema as Record<string, any>;
        const schemaId = schemaObj.$id || `${window.location.origin}/schema-for-this-json.json`;
        
        console.log(`JsonInput: Using schema URI: ${schemaId}`);
        
        diagnosticsOptions.schemas = [
          {
            uri: schemaId,
            fileMatch: ["*"],
            schema: schema
          }
        ];
      } else {
        console.log('JsonInput: Schema validation is disabled or schema is null');
      }
      
      console.log('JsonInput: Setting diagnostics options on Monaco editor');
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions(diagnosticsOptions);
      console.log('JsonInput: Schema successfully applied to editor');
    } catch (error) {
      console.error('JsonInput: Error applying schema to editor:', error);
    }
  };
  
  // Effect to apply schema when validation is toggled
  useEffect(() => {
    applySchemaToEditor(customSchema);
  }, [schemaValidationEnabled]);
  
  // Initialize with jsonSchema prop if provided (for backward compatibility)
  useEffect(() => {
    if (jsonSchema) {
      setCustomSchema(jsonSchema);
      setSchemaValidationEnabled(true);
      setSchemaSource('predefined');
    }
  }, [jsonSchema]);

  // Define a more specific type for the editor
  const handleEditorDidMount = (editor: unknown, monaco: unknown) => {
    editorRef.current = editor;

    // Configure JSON validation
    if (monaco && typeof monaco === 'object' && 'languages' in monaco && 
        monaco.languages && typeof monaco.languages === 'object' && 
        'json' in monaco.languages && monaco.languages.json) {
      
      // Create the diagnostics options
      const diagnosticsOptions = {
        validate: true,
        allowComments: false,
        schemas: [],
        enableSchemaRequest: true
      };
      
      // Add schema if provided
      if (jsonSchema) {
        diagnosticsOptions.schemas = [
          {
            uri: "http://myserver/schema-for-this-json.json", // A unique URI for this schema
            fileMatch: ["*"], // Apply to all JSON documents in the editor
            schema: jsonSchema // The actual schema object
          }
        ];
      }
      
      // Apply the configuration
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions(diagnosticsOptions);
    }

    // Setup consistent JSON theme
    setupJsonTheme(monaco);

    // Detect YAML and convert to JSON on paste, then auto-format
    if (editor && typeof editor === 'object' && 'onDidPaste' in editor && 
        typeof editor.onDidPaste === 'function' && 
        'getAction' in editor && typeof editor.getAction === 'function' &&
        'getValue' in editor && typeof editor.getValue === 'function' &&
        'setValue' in editor && typeof editor.setValue === 'function') {
      editor.onDidPaste(() => {
        setTimeout(() => {
          // Get the current content after paste
          const content = editor.getValue();
          
          // Try to convert YAML to JSON using our reusable function
          const { content: convertedContent, converted, error } = tryConvertYamlToJson(content);
          
          if (converted) {
            // Update editor content with the converted JSON
            editor.setValue(convertedContent);
            
            // Show notification that YAML was converted
            setYamlConversionNotice(true);
            
            // Hide notification after 5 seconds
            setTimeout(() => {
              setYamlConversionNotice(false);
            }, 5000);
            
            console.log('Converted YAML to JSON');
          } else if (error) {
            // If there was an error during conversion, show it to the user
            setIsValid(false);
            setErrorMessage(`Failed to convert content: ${error}`);
            onValidityChange(false);
            
            console.error('YAML conversion error:', error);
          }
          
          // Format the document (whether it was converted or not)
          const formatAction = editor.getAction('editor.action.formatDocument');
          if (formatAction && typeof formatAction.run === 'function') {
            formatAction.run();
          }
        }, 100);
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setIsValid(false);
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      onValidityChange(false);
      return;
    }
    
    // For smaller files, use the standard approach
    if (file.size < LARGE_FILE_SIZE) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        // Try to convert YAML to JSON if needed
        const { content: convertedContent, converted, error } = tryConvertYamlToJson(content);
        
        if (converted) {
          // Show notification that YAML was converted
          setYamlConversionNotice(true);
          
          // Hide notification after 5 seconds
          setTimeout(() => {
            setYamlConversionNotice(false);
          }, 5000);
          
          console.log('Converted YAML to JSON from file upload');
          
          // Update with the converted JSON
          onChange(convertedContent);
          
          // Auto-format the uploaded JSON
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.getAction('editor.action.formatDocument').run();
            }
          }, 100);
        } else if (error) {
          // If there was an error during conversion, show it to the user
          setIsValid(false);
          setErrorMessage(`Failed to convert file content: ${error}`);
          onValidityChange(false);
          
          console.error('YAML conversion error during file upload:', error);
          
          // Still update with the original content so user can see and fix it
          onChange(content);
        } else {
          // No conversion happened (already JSON or not convertible)
          onChange(convertedContent);
          
          // Auto-format the uploaded JSON
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.getAction('editor.action.formatDocument').run();
            }
          }, 100);
        }
      };
      reader.readAsText(file);
      return;
    }
    
    // For large files, use chunked processing
    setIsValid(true);
    setErrorMessage('');
    onValidityChange(true);
    
    // Show a warning for large files
    const warningMessage = `Processing large file (${(file.size / (1024 * 1024)).toFixed(2)}MB). This may take a moment...`;
    setErrorMessage(warningMessage);
    
    // Use streaming approach for large files
    const chunkSize = 1024 * 1024; // 1MB chunks
    let offset = 0;
    let fileContent = '';
    
    const readNextChunk = () => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const chunk = e.target?.result as string;
        fileContent += chunk;
        
        offset += chunkSize;
        
        // Update progress message
        const progress = Math.min(100, Math.round((offset / file.size) * 100));
        setErrorMessage(`Processing large file: ${progress}% complete...`);
        
        if (offset < file.size) {
          // Continue reading
          setTimeout(readNextChunk, 10); // Small delay to allow UI updates
        } else {
          // Finished reading
          setErrorMessage('');
          
          // Try to convert YAML to JSON if needed
          const { content: convertedContent, converted, error } = tryConvertYamlToJson(fileContent);
          
          if (converted) {
            // Show notification that YAML was converted
            setYamlConversionNotice(true);
            
            // Hide notification after 5 seconds
            setTimeout(() => {
              setYamlConversionNotice(false);
            }, 5000);
            
            console.log('Converted YAML to JSON from large file upload');
            
            // Update with the converted JSON
            onChange(convertedContent);
            
            // Auto-format the uploaded JSON (only for moderately large files)
            if (file.size < LARGE_FILE_SIZE * 2) {
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.getAction('editor.action.formatDocument').run();
                }
              }, 100);
            }
          } else if (error) {
            // If there was an error during conversion, show it to the user
            setIsValid(false);
            setErrorMessage(`Failed to convert large file content: ${error}`);
            onValidityChange(false);
            
            console.error('YAML conversion error during large file upload:', error);
            
            // Still update with the original content so user can see and fix it
            onChange(fileContent);
          } else {
            // No conversion happened (already JSON or not convertible)
            onChange(convertedContent);
            
            // Auto-format the uploaded JSON (only for moderately large files)
            if (file.size < LARGE_FILE_SIZE * 2) {
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.getAction('editor.action.formatDocument').run();
                }
              }, 100);
            }
          }
        }
      };
      
      reader.onerror = () => {
        setIsValid(false);
        setErrorMessage('Error reading file: ' + (reader.error?.message || 'Unknown error'));
        onValidityChange(false);
      };
      
      // Read a slice of the file
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsText(slice);
    };
    
    // Start reading the file in chunks
    readNextChunk();
  };

  const formatJson = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };


  const minifyJson = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed));
    } catch {
      // If JSON is invalid, don't minify
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };


  // Row Mode functions
  const toggleRowMode = () => {
    if (!Array.isArray(parsedJson) || parsedJson.length === 0) {
      // Can't enable Row Mode if not an array or empty array
      return;
    }
    
    setRowModeEnabled(!rowModeEnabled);
    
    if (!rowModeEnabled) {
      // Enabling Row Mode
      updateDisplayedJson(parsedJson, currentRowIndex);
    } else {
      // Disabling Row Mode
      setDisplayedJson(originalJson);
      
      // Reset row data in parent component if callback is provided
      if (onRowDataChange) {
        onRowDataChange(null);
      }
    }
  };
  
  /**
   * Extracts an array from a JSON object with a single key and enables Row Mode.
   * 
   * This function:
   * 1. Parses the current JSON input
   * 2. Checks if it's an object with exactly one key
   * 3. Checks if the value of that key is an array
   * 4. If all conditions are met, extracts the array and updates the JSON input
   * 5. Explicitly enables Row Mode immediately (don't wait for validateJson effect)
   * 
   * Example: Converts {"data": [1, 2, 3]} to [1, 2, 3]
   * 
   * @returns {boolean} true if extraction was successful, false otherwise
   */
  const extractArrayFromSingleKey = () => {
    try {
      // Parse the current JSON
      const parsed = JSON.parse(value);
      
      // Check if it's an object (not null, not an array)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Get all keys
        const keys = Object.keys(parsed);
        
        // Check if it has exactly one key
        if (keys.length === 1) {
          const singleKey = keys[0];
          const singleValue = parsed[singleKey];
          
          // Check if the value is an array
          if (Array.isArray(singleValue) && singleValue.length > 0) {
            // Convert the array to JSON string
            const arrayJson = JSON.stringify(singleValue, null, 2);
            
            // Update the value with just the array
            onChange(arrayJson);
            
            // Explicitly enable Row Mode immediately
            setRowModeEnabled(true);
            setCurrentRowIndex(0);
            
            // Also update the displayed JSON for the first item
            if (singleValue.length > 0) {
              const firstItem = singleValue[0];
              const formattedItem = JSON.stringify(firstItem, null, 2);
              setDisplayedJson(formattedItem);
              
              // Notify parent component about row data change if callback is provided
              if (onRowDataChange) {
                onRowDataChange(formattedItem);
              }
            }
            
            return true;
          }
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error extracting array from single key:', err);
      return false;
    }
  };
  
  const nextArrayItem = () => {
    if (!rowModeEnabled || !Array.isArray(parsedJson) || parsedJson.length === 0) {
      return;
    }
    
    const nextIndex = (currentRowIndex + 1) % parsedJson.length;
    setCurrentRowIndex(nextIndex);
    updateDisplayedJson(parsedJson, nextIndex);
  };
  
  const prevArrayItem = () => {
    if (!rowModeEnabled || !Array.isArray(parsedJson) || parsedJson.length === 0) {
      return;
    }
    
    const prevIndex = (currentRowIndex - 1 + parsedJson.length) % parsedJson.length;
    setCurrentRowIndex(prevIndex);
    updateDisplayedJson(parsedJson, prevIndex);
  };
  
  const showAllItems = () => {
    if (rowModeEnabled) {
      setRowModeEnabled(false);
      setDisplayedJson(originalJson);
      
      // Reset row data in parent component if callback is provided
      if (onRowDataChange) {
        onRowDataChange(null);
      }
    }
  };
  
  const jumpToIndex = (index: number) => {
    if (!rowModeEnabled || !Array.isArray(parsedJson) || parsedJson.length === 0) {
      return;
    }
    
    // Ensure index is within bounds
    const safeIndex = Math.max(0, Math.min(index, parsedJson.length - 1));
    setCurrentRowIndex(safeIndex);
    updateDisplayedJson(parsedJson, safeIndex);
  };
  
  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    formatJson,
    minifyJson,
    triggerFileUpload,
    setViewMode: updateViewMode,
    getViewMode: () => viewMode,
    toggleRowMode,
    nextArrayItem,
    prevArrayItem,
    showAllItems,
    jumpToIndex,
    isRowModeEnabled: () => rowModeEnabled,
    getCurrentIndex: () => currentRowIndex,
    getTotalItems: () => Array.isArray(parsedJson) ? parsedJson.length : 0,
    extractArrayFromSingleKey // Expose the new method
  }));

  return (
    <div className="flex-1 flex flex-col">
      {/* Error display */}
      {!isValid && errorMessage && (
        <div className="bg-theme-notification-error-bg border-b border-theme-notification-error-border px-3 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-notification-error-text">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span className="text-xs text-theme-notification-error-text font-medium">
              {errorMessage.includes('YAML') ? 'YAML Conversion Error:' : 'Error:'}
            </span>
            <span className="text-xs text-theme-notification-error-text">
              {errorMessage}
            </span>
          </div>
          <button 
            onClick={() => {
              setIsValid(true);
              setErrorMessage('');
              onValidityChange(true);
            }}
            className="text-theme-notification-error-text hover:text-theme-text-primary"
            aria-label="Dismiss error notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      
      {/* YAML conversion notification */}
      {yamlConversionNotice && (
        <div className="bg-theme-notification-success-bg border-b border-theme-notification-success-border px-3 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-notification-success-text">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span className="text-xs text-theme-notification-success-text font-medium">
              Success:
            </span>
            <span className="text-xs text-theme-notification-success-text">
              YAML detected and converted to JSON successfully
            </span>
          </div>
          <button 
            onClick={() => setYamlConversionNotice(false)}
            className="text-theme-notification-success-text hover:text-theme-text-primary"
            aria-label="Dismiss notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* Main header - always visible */}
      <div className="bg-theme-bg-secondary border-b border-theme-border-primary px-3 py-2 flex items-center justify-between">
        {/* Left side: Title and array controls */}
        <div className="flex items-center space-x-3">
          {/* Title with icon */}
          <div className="flex items-center space-x-2">
            <FileJson className="w-5 h-5 text-theme-text-accent" />
            <h2 className="text-sm font-medium">JSON Input</h2>
          </div>
          
          {/* Array controls - only show when array is detected */}
          {arrayLength > 0 && (
            <div className="flex items-center space-x-2">
              {hasSingleKeyArray && !rowModeEnabled && (
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Extract Array</p>
                      <p>Extract the array from a JSON object with a single key.</p>
                      <p>For example, converts <code className="bg-gray-700 px-1 rounded">&#123;"data": [1,2,3]&#125;</code> to <code className="bg-gray-700 px-1 rounded">[1,2,3]</code></p>
                      <p className="text-green-300">Keyboard shortcut: Alt+E</p>
                    </div>
                  }
                  position="top"
                  maxWidth="300px"
                >
                  <button
                    onClick={extractArrayFromSingleKey}
                    className="flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors bg-theme-button-success-bg text-theme-button-success-text hover:bg-theme-button-success-hover"
                    aria-label="Extract array and enable Row Mode"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 3 21 3 21 8"></polyline>
                      <line x1="4" y1="20" x2="21" y2="3"></line>
                      <polyline points="21 16 21 21 16 21"></polyline>
                      <line x1="15" y1="15" x2="21" y2="21"></line>
                      <line x1="4" y1="4" x2="9" y2="9"></line>
                    </svg>
                    <span>Extract Array</span>
                  </button>
                </Tooltip>
              )}

              {/* Row Mode Toggle Button */}
              <Tooltip
                content={
                  <div className="space-y-1">
                    <p className="font-medium">Row Mode</p>
                    <p>Work with one array item at a time. Useful for large arrays or when focusing on individual items.</p>
                    <p className="text-blue-300">Keyboard shortcut: Alt+L</p>
                  </div>
                }
                position="top"
                maxWidth="300px"
              >
                <button
                  onClick={toggleRowMode}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                    rowModeEnabled
                      ? 'bg-theme-button-primary-bg text-theme-button-primary-text'
                      : 'bg-theme-button-secondary-bg text-theme-text-secondary hover:bg-theme-button-secondary-hover'
                  }`}
                  disabled={!Array.isArray(parsedJson) || (parsedJson as unknown[]).length === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                  </svg>
                  <span>{rowModeEnabled ? "Show All" : "Row Mode"}</span>
                </button>
              </Tooltip>

              {/* Row Navigation Controls - Only show when Row Mode is enabled */}
              {rowModeEnabled && (
                <>
                  <button
                    onClick={prevArrayItem}
                    className="p-1 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded text-xs transition-colors"
                    title="Previous Item (Shift+Left)"
                    aria-label="Previous Item"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && prevArrayItem()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  <div className="flex items-center bg-theme-bg-tertiary rounded px-2 py-1">
                    <label htmlFor="row-index-input" className="sr-only">Jump to item</label>
                    <input
                      id="row-index-input"
                      type="number"
                      min="1"
                      max={arrayLength}
                      value={currentRowIndex + 1}
                      onChange={(e) => {
                        const index = parseInt(e.target.value, 10) - 1;
                        if (!isNaN(index) && index >= 0 && index < arrayLength) {
                          jumpToIndex(index);
                        }
                      }}
                      className="w-12 bg-theme-bg-primary text-theme-text-primary text-xs border border-theme-border-secondary rounded px-1 py-0.5"
                      title="Jump to Index"
                      aria-label={`Jump to item (1-${arrayLength})`}
                    />
                    <span className="text-xs text-theme-text-secondary ml-1" aria-hidden="true">of {arrayLength}</span>
                    <span className="sr-only">of {arrayLength} total items</span>
                  </div>

                  <button
                    onClick={nextArrayItem}
                    className="p-1 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded text-xs transition-colors"
                    title="Next Item (Shift+Right)"
                    aria-label="Next Item"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && nextArrayItem()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Right side: Actions and controls */}
        <div className="flex items-center space-x-2">
          {/* Schema Validation Indicator and Button */}
          {schemaValidationEnabled && customSchema ? (
            <Tooltip
              content="JSON Schema validation is enabled. Click to configure."
              position="bottom"
            >
              <button 
                onClick={() => setShowSchemaModal(true)}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-theme-notification-success-bg text-theme-notification-success-text hover:bg-theme-notification-success-hover"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Schema</span>
              </button>
            </Tooltip>
          ) : (
            <Tooltip
              content="Configure JSON Schema validation"
              position="bottom"
            >
              <button 
                onClick={() => setShowSchemaModal(true)}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-theme-button-secondary-bg text-theme-text-secondary hover:bg-theme-button-secondary-hover"
              >
                <FileCode className="w-3 h-3" />
                <span>Schema</span>
              </button>
            </Tooltip>
          )}
          
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => updateViewMode('editor')}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'editor' 
                  ? 'bg-theme-button-primary-bg text-theme-button-primary-text' 
                  : 'bg-theme-button-secondary-bg text-theme-text-secondary hover:bg-theme-button-secondary-hover'
              }`}
              title="Switch to Editor view"
            >
              <Code2 className="w-3 h-3" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => updateViewMode('viewer')}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'viewer' 
                  ? 'bg-theme-button-primary-bg text-theme-button-primary-text' 
                  : 'bg-theme-button-secondary-bg text-theme-text-secondary hover:bg-theme-button-secondary-hover'
              }`}
              title="Switch to Tree"
            >
              <Eye className="w-3 h-3" />
              <span>Tree</span>
            </button>
          </div>

          {/* Action Menu Button - Always visible in main header */}
          <div className="relative" ref={actionMenuRef}>
              <button
                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors bg-theme-button-secondary-bg text-theme-text-secondary hover:bg-theme-button-secondary-hover"
                aria-label="Open JSON Actions Menu"
              >
                <Settings className="w-3 h-3" />
                <span>Actions</span>
              </button>

            {/* Action Menu Dropdown - Click-based */}
            {isActionMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-theme-bg-primary border border-theme-border-secondary rounded-lg shadow-lg z-10 w-64">
                <div className="p-1">
                  <button
                      onClick={() => {
                        updateViewMode('editor');
                        setIsActionMenuOpen(false);
                      }}
                      className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <Code2 className="w-3 h-3" />
                      <span>Editor View</span>
                    </div>
                  </button>
                  <button
                      onClick={() => {
                        updateViewMode('viewer');
                        setIsActionMenuOpen(false);
                      }}
                      className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <LayoutGrid className="w-3 h-3" />
                      <span>Tree</span>
                    </div>
                  </button>
                  {/* Convert to JSON button - Only show when content is not valid JSON */}
                  {!isValid && (
                    <button
                      onClick={() => {
                        // Try to convert the content to JSON
                        const { content: convertedContent, converted, error } = tryConvertYamlToJson(value);
                        
                        if (converted) {
                          // Update the content if conversion was successful
                          onChange(convertedContent);
                          
                          // Show notification that YAML was converted
                          setYamlConversionNotice(true);
                          
                          // Hide notification after 5 seconds
                          setTimeout(() => {
                            setYamlConversionNotice(false);
                          }, 5000);
                          
                          console.log('Converted content to JSON from action menu');
                        } else if (error) {
                          // If there was an error during conversion, show it to the user
                          setIsValid(false);
                          setErrorMessage(`Failed to convert content: ${error}`);
                          onValidityChange(false);
                          
                          console.error('YAML conversion error from action menu:', error);
                        }
                        
                        setIsActionMenuOpen(false);
                      }}
                      className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-2">
                        <FileJson className="w-3 h-3" />
                        <span>Convert to JSON</span>
                      </div>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      formatJson();
                      setIsActionMenuOpen(false);
                    }}
                    disabled={!isValid}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded disabled:text-gray-500 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <Wand2 className="w-3 h-3" />
                      <span>Format JSON</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      minifyJson();
                      setIsActionMenuOpen(false);
                    }}
                    disabled={!isValid}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded disabled:text-gray-500 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <Minimize2 className="w-3 h-3" />
                      <span>Minify JSON</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      triggerFileUpload();
                      setIsActionMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <Upload className="w-3 h-3" />
                      <span>Upload File</span>
                    </div>
                  </button>

                  {/* Row Mode Actions - Only show if array is present */}
                  {/* Schema Validation Section - Only show if schema is provided */}
                      {jsonSchema && (
                        <>
                          <div className="px-3 py-1 text-xs text-theme-text-secondary font-medium mt-2">Schema Validation</div>
                          <button
                            onClick={() => {
                              setSchemaValidationEnabled(!schemaValidationEnabled);
                              setIsActionMenuOpen(false);
                            }}
                            className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                          >
                            <div className="flex items-center space-x-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                              </svg>
                              <span>{schemaValidationEnabled ? "Disable Schema Validation" : "Enable Schema Validation"}</span>
                            </div>
                          </button>
                        </>
                      )}

                      {arrayLength > 0 && (
                        <>
                          <div className="px-3 py-1 text-xs text-theme-text-secondary font-medium mt-2">Row Mode</div>
                          <button
                            onClick={() => {
                              toggleRowMode();
                              setIsActionMenuOpen(false);
                            }}
                            disabled={!Array.isArray(parsedJson) || (parsedJson as unknown[]).length === 0}
                            className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded disabled:text-gray-500 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            <div className="flex items-center space-x-2">
                              <LayoutGrid className="w-3 h-3" />
                              <span>{rowModeEnabled ? "Show All Items" : "Enable Row Mode"}</span>
                            </div>
                          </button>
                          {rowModeEnabled && (
                            <>
                              <button
                                onClick={() => {
                                  prevArrayItem();
                                  setIsActionMenuOpen(false);
                                }}
                                className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                              >
                                <div className="flex items-center space-x-2">
                                  <ArrowLeft className="w-3 h-3" />
                                  <span>Previous Item</span>
                                </div>
                                <span className="text-xs text-theme-text-secondary">Shift+←</span>
                              </button>
                              <button
                                onClick={() => {
                                  nextArrayItem();
                                  setIsActionMenuOpen(false);
                                }}
                                className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                              >
                                <div className="flex items-center space-x-2">
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Next Item</span>
                                </div>
                                <span className="text-xs text-theme-text-secondary">Shift+→</span>
                              </button>
                              <button
                                onClick={() => {
                                  showAllItems();
                                  setIsActionMenuOpen(false);
                                }}
                                className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                              >
                                <div className="flex items-center space-x-2">
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Show All Items</span>
                                </div>
                              </button>
                            </>
                          )}
                        </>
                      )}
                </div>
              </div>
            )}
          </div>
          
          {isJsonlFormat && (
            <span className="text-xs bg-theme-notification-success-bg text-theme-notification-success-text px-2 py-0.5 rounded">
              JSONL Format
            </span>
          )}
        </div>
      </div>

      {/* Array information - show for arrays */}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.jsonl,.txt,.yaml,.yml"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Content */}
      {viewMode === 'editor' ? (
        <div 
          className={`flex-1 relative ${isDragOver ? 'ring-2 ring-green-500 ring-inset' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Editor
            height="100%"
            language="json"
            theme="json-dark"
            value={rowModeEnabled ? displayedJson : value}
            onChange={async (val) => {
              if (rowModeEnabled) {
                // In Row Mode, we need to update the current item in the array
                try {
                  const updatedItem = JSON.parse(val || '');
                  if (Array.isArray(parsedJson) && parsedJson.length > 0) {
                    // Apply jq transformation to the updated item if jqQuery is provided
                    let transformedItem = updatedItem;
                    if (jqQuery && jqQuery.trim()) {
                      try {
                        // Convert the item to JSON string for processJq
                        const itemJson = JSON.stringify(updatedItem);
                        // Apply the jq transformation
                        transformedItem = await processJq(itemJson, jqQuery);
                        console.log('Applied jq transformation to row:', transformedItem);
                      } catch (err) {
                        console.error('Error applying jq transformation to row:', err);
                        // If transformation fails, use the original updated item
                      }
                    }
                    
                    // Update the array with the transformed item
                    const updatedArray = [...(parsedJson as unknown[])];
                    updatedArray[currentRowIndex] = transformedItem;
                    const updatedJson = JSON.stringify(updatedArray, null, 2);
                    onChange(updatedJson);
                  }
                } catch {
                  // If parsing fails, just update the displayed JSON
                  setDisplayedJson(val || '');
                }
              } else {
                // Normal mode, check if it's YAML and convert if needed
                const inputValue = val || '';
                const { content, converted, error } = tryConvertYamlToJson(inputValue);
                
                if (converted) {
                  // Show notification that YAML was converted
                  setYamlConversionNotice(true);
                  
                  // Hide notification after 5 seconds
                  setTimeout(() => {
                    setYamlConversionNotice(false);
                  }, 5000);
                  
                  console.log('Converted YAML to JSON');
                  
                  // Update with the converted JSON
                  onChange(content);
                } else if (error) {
                  // If there was an error during conversion, show it to the user
                  setIsValid(false);
                  setErrorMessage(`Failed to convert content: ${error}`);
                  onValidityChange(false);
                  
                  console.error('YAML conversion error during editing:', error);
                  
                  // Still update with the original content so user can see and fix it
                  onChange(inputValue);
                } else {
                  // No conversion happened (already JSON or not convertible)
                  onChange(content);
                }
              }
            }}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              bracketPairColorization: { enabled: true },
              matchBrackets: 'always',
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              readOnly: false
            }}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative">
          <DraggableJsonViewer
            jsonString={rowModeEnabled ? displayedJson : value}
            isValid={isValid}
            onPathGenerated={onJsonPathsGenerated}
            isRowMode={rowModeEnabled}
            currentRowIndex={currentRowIndex}
          />
        </div>
      )}

      {/* Drop Zone Indicator */}
      <div className={`border-b px-3 py-1 text-xs transition-colors ${
          isDragOver
              ? 'bg-theme-notification-success-bg border-theme-notification-success-border text-theme-notification-success-text'
              : 'bg-theme-notification-info-bg border-theme-notification-info-border text-theme-notification-info-text'
      }`}>
        <div className="flex items-center space-x-2">
          <FileText className="w-3 h-3" />
          <span>{isDragOver ? 'Drop here to upload JSON or YAML file' : 'Drag & drop JSON or YAML files here'}</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-theme-bg-primary border-t border-theme-border-primary px-3 py-1 flex items-center justify-between text-xs text-theme-text-secondary">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Always visible on all screen sizes */}
          <span>{isJsonlFormat ? 'JSONL' : 'JSON'}</span>
          
          {/* Only visible on small screens and up */}
          <span className="hidden sm:inline">{lineCount} lines</span>
          
          {/* Only visible on medium screens and up */}
          <span className="hidden md:inline">{value.length} characters</span>
          
          {/* Conditional elements with responsive visibility */}
          {isJsonlFormat && (
            <span className="hidden sm:inline text-theme-text-success">
              JSONL format detected
            </span>
          )}
          {pathCount > 0 && (
            <span className="hidden md:inline text-theme-text-success">
              {pathCount} paths detected
            </span>
          )}
          {arrayLength > 0 && (
            <span className="bg-theme-bg-tertiary text-theme-text-primary px-2 py-0.5 rounded">
              <span className="sm:hidden">{arrayLength}</span>
              <span className="hidden sm:inline">{arrayLength.toLocaleString()} items in {isJsonlFormat ? 'JSONL' : 'array'}</span>
            </span>
          )}
        </div>
      </div>
      
      {/* Schema Modal */}
      <SchemaModal
        isOpen={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
        onApplyPredefinedSchema={loadPredefinedSchema}
        onApplyCustomSchema={loadSchemaFromText}
        onApplySchemaUrl={loadSchemaFromUrl}
        selectedSchemaType={schemaSource}
        selectedPredefinedSchema={selectedPredefinedSchema}
        schemaUrl={schemaUrl}
        schemaText={schemaText}
        isLoading={isLoadingSchema}
        error={schemaError}
        schemaValidationEnabled={schemaValidationEnabled}
        onToggleSchemaValidation={() => setSchemaValidationEnabled(!schemaValidationEnabled)}
        activeSchemaContent={customSchema}
      />
    </div>
  );
});

export default JsonInput;