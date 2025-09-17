import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Lightbulb, Keyboard, History, HelpCircle, Play, Settings, Code, FileCode, Save, Download, Copy, Wand2, FileJson, FileText } from 'lucide-react';
import { setupJqTheme } from '../utils/monacoTheme';
import { JqErrorDetails, processJq } from '../utils/jqProcessor';
import { JqVersionNavigator } from './JqVersionNavigator';
import { Tooltip } from './Tooltip';
import { ContextualHelp } from './ContextualHelp';
import { DesiredOutputModal } from './DesiredOutputModal';

interface JqEditorProps {
  value: string;
  onChange: (value: string) => void;
  jsonPaths: string[];
  pathCount?: number;
  errorDetails?: JqErrorDetails | null;
  isRowModeEnabled?: boolean;
  onNextRow?: () => void;
  onPrevRow?: () => void;
  
  // New props for consolidated header
  onSave?: () => void; // Callback for Save button
  onVersionHistory?: () => void; // Callback for History button
  onHelp?: () => void; // Callback for Help button
  onDownloadQuery?: () => void; // Callback for downloading the query
  
  // Input JSON prop to avoid having to find it in the DOM
  inputJson?: string; // The current JSON input from App.tsx
}

export default function JqEditor({ 
  value, 
  onChange, 
  jsonPaths, 
  pathCount, 
  errorDetails,
  isRowModeEnabled = false,
  onNextRow,
  onPrevRow,
  // New props for consolidated header
  onSave,
  onVersionHistory,
  onHelp,
  onDownloadQuery,
  // Input JSON prop
  inputJson = ''
}: JqEditorProps) {
  // State for action menu
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{path: string, type: string, description: string}>>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [completionProvider, setCompletionProvider] = useState<any>(null);
  const [showVersionNavigator, setShowVersionNavigator] = useState(false);
  const [previewJqQuery, setPreviewJqQuery] = useState('');
  const [showContextualHelp, setShowContextualHelp] = useState(false);
  const [showDesiredOutputModal, setShowDesiredOutputModal] = useState(false);
  const [isGeneratingJq, setIsGeneratingJq] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [llmResponse, setLlmResponse] = useState<string | null>(null);
  const [generatedJq, setGeneratedJq] = useState<string | null>(null);
  const [isJqValid, setIsJqValid] = useState<boolean | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    llmResponse: string;
    generatedJq: string;
    isValid: boolean;
    error?: string;
  }>>([]);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Format JQ function to format the JQ script in the editor
  const formatJq = () => {
    if (editorRef.current) {
      // Use Monaco Editor's built-in formatting action to format the JQ script
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  // Enhanced jq patterns with descriptions
  const jqPatterns = [
    // Basic Operations
    { 
      name: 'Identity', 
      pattern: '.', 
      description: 'Returns the input unchanged',
      category: 'Basic'
    },
    { 
      name: 'Array iteration', 
      pattern: '.[]', 
      description: 'Iterate over array elements or object values',
      category: 'Basic'
    },
    { 
      name: 'Field access', 
      pattern: '.fieldname', 
      description: 'Access a specific field',
      category: 'Basic'
    },
    { 
      name: 'Array slice', 
      pattern: '.[0:3]', 
      description: 'Get array slice from index 0 to 3',
      category: 'Basic'
    },
    { 
      name: 'First item', 
      pattern: 'first', 
      description: 'Get first item from array',
      category: 'Basic'
    },
    { 
      name: 'Last item', 
      pattern: 'last', 
      description: 'Get last item from array',
      category: 'Basic'
    },
    { 
      name: 'Recursive descent', 
      pattern: '..', 
      description: 'Recursively descend through the input, outputting each value',
      category: 'Basic'
    },
    { 
      name: 'Optional field', 
      pattern: '.field?', 
      description: 'Access field if it exists, otherwise return null',
      category: 'Basic'
    },
    
    // Filtering Operations
    { 
      name: 'Filter by condition', 
      pattern: '.[] | select(.field == "value")', 
      description: 'Filter items based on a condition',
      category: 'Filtering'
    },
    { 
      name: 'String contains', 
      pattern: '.[] | select(.field | contains("text"))', 
      description: 'Filter items where field contains text',
      category: 'Filtering'
    },
    { 
      name: 'Type checking', 
      pattern: '.[] | select(.field | type == "string")', 
      description: 'Filter by field type',
      category: 'Filtering'
    },
    { 
      name: 'Empty filter', 
      pattern: 'empty', 
      description: 'Filter out empty values',
      category: 'Filtering'
    },
    { 
      name: 'Not null', 
      pattern: '.[] | select(. != null)', 
      description: 'Filter out null values',
      category: 'Filtering'
    },
    { 
      name: 'Starts with', 
      pattern: '.[] | select(.field | startswith("text"))', 
      description: 'Filter items where field starts with text',
      category: 'Filtering'
    },
    { 
      name: 'Ends with', 
      pattern: '.[] | select(.field | endswith("text"))', 
      description: 'Filter items where field ends with text',
      category: 'Filtering'
    },
    { 
      name: 'Regex match', 
      pattern: '.[] | select(.field | test("regex"))', 
      description: 'Filter items where field matches regex',
      category: 'Filtering'
    },
    { 
      name: 'Greater than', 
      pattern: '.[] | select(.field > value)', 
      description: 'Filter items where field is greater than value',
      category: 'Filtering'
    },
    { 
      name: 'Less than', 
      pattern: '.[] | select(.field < value)', 
      description: 'Filter items where field is less than value',
      category: 'Filtering'
    },
    
    // Transformation Operations
    { 
      name: 'Map to object', 
      pattern: '.[] | {name, email}', 
      description: 'Transform each item to a new object with selected fields',
      category: 'Transformation'
    },
    { 
      name: 'Flatten array', 
      pattern: 'flatten', 
      description: 'Flatten nested arrays',
      category: 'Transformation'
    },
    { 
      name: 'Reverse array', 
      pattern: 'reverse', 
      description: 'Reverse array order',
      category: 'Transformation'
    },
    { 
      name: 'To entries', 
      pattern: 'to_entries', 
      description: 'Convert object to key-value pairs',
      category: 'Transformation'
    },
    { 
      name: 'From entries', 
      pattern: 'from_entries', 
      description: 'Convert key-value pairs to object',
      category: 'Transformation'
    },
    { 
      name: 'Map values', 
      pattern: 'map(.field)', 
      description: 'Extract field from each array item',
      category: 'Transformation'
    },
    { 
      name: 'Delete field', 
      pattern: 'del(.field)', 
      description: 'Delete a field from an object',
      category: 'Transformation'
    },
    { 
      name: 'Add field', 
      pattern: '. + {field: value}', 
      description: 'Add a field to an object',
      category: 'Transformation'
    },
    { 
      name: 'Merge objects', 
      pattern: 'reduce inputs as $item ({}; . * $item)', 
      description: 'Merge multiple objects together',
      category: 'Transformation'
    },
    { 
      name: 'Pick fields', 
      pattern: '{field1, field2}', 
      description: 'Create a new object with only specified fields',
      category: 'Transformation'
    },
    
    // Aggregation Operations
    { 
      name: 'Count items', 
      pattern: 'length', 
      description: 'Get the length of array or object',
      category: 'Aggregation'
    },
    { 
      name: 'Get unique values', 
      pattern: 'unique', 
      description: 'Remove duplicate values from array',
      category: 'Aggregation'
    },
    { 
      name: 'Min/Max value', 
      pattern: 'min_by(.field)', 
      description: 'Find item with minimum value for field',
      category: 'Aggregation'
    },
    { 
      name: 'Min value', 
      pattern: 'min', 
      description: 'Get minimum value from array',
      category: 'Aggregation'
    },
    { 
      name: 'Max value', 
      pattern: 'max', 
      description: 'Get maximum value from array',
      category: 'Aggregation'
    },
    { 
      name: 'Sum values', 
      pattern: 'add', 
      description: 'Sum array of numbers',
      category: 'Aggregation'
    },
    { 
      name: 'Average', 
      pattern: 'add / length', 
      description: 'Calculate average of array values',
      category: 'Aggregation'
    },
    { 
      name: 'Group count', 
      pattern: 'group_by(.field) | map({key: .[0].field, count: length})', 
      description: 'Count occurrences by field value',
      category: 'Aggregation'
    },
    
    // Sorting and Grouping
    { 
      name: 'Sort by field', 
      pattern: 'sort_by(.field)', 
      description: 'Sort array by a specific field',
      category: 'Sorting'
    },
    { 
      name: 'Group by field', 
      pattern: 'group_by(.field)', 
      description: 'Group array items by a field value',
      category: 'Grouping'
    },
    { 
      name: 'Sort', 
      pattern: 'sort', 
      description: 'Sort array in ascending order',
      category: 'Sorting'
    },
    { 
      name: 'Sort descending', 
      pattern: 'sort | reverse', 
      description: 'Sort array in descending order',
      category: 'Sorting'
    },
    
    // String Operations
    { 
      name: 'Split string', 
      pattern: 'split(",")', 
      description: 'Split string by delimiter',
      category: 'String'
    },
    { 
      name: 'Join array', 
      pattern: 'join(",")', 
      description: 'Join array elements with delimiter',
      category: 'String'
    },
    { 
      name: 'Lowercase', 
      pattern: 'ascii_downcase', 
      description: 'Convert string to lowercase',
      category: 'String'
    },
    { 
      name: 'Uppercase', 
      pattern: 'ascii_upcase', 
      description: 'Convert string to uppercase',
      category: 'String'
    },
    { 
      name: 'Trim left', 
      pattern: 'ltrimstr("prefix")', 
      description: 'Remove prefix from string',
      category: 'String'
    },
    { 
      name: 'Trim right', 
      pattern: 'rtrimstr("suffix")', 
      description: 'Remove suffix from string',
      category: 'String'
    },
    { 
      name: 'String replace', 
      pattern: 'sub("pattern"; "replacement")', 
      description: 'Replace first occurrence of pattern',
      category: 'String'
    },
    { 
      name: 'String replace all', 
      pattern: 'gsub("pattern"; "replacement")', 
      description: 'Replace all occurrences of pattern',
      category: 'String'
    },
    { 
      name: 'String format', 
      pattern: '"\(.field1) - \(.field2)"', 
      description: 'Format string with interpolation',
      category: 'String'
    },
    
    // Testing and Introspection
    { 
      name: 'Check if has key', 
      pattern: 'has("key")', 
      description: 'Check if object has a specific key',
      category: 'Testing'
    },
    { 
      name: 'Get object keys', 
      pattern: 'keys', 
      description: 'Get all keys of an object',
      category: 'Introspection'
    },
    { 
      name: 'Get type', 
      pattern: 'type', 
      description: 'Get the type of a value',
      category: 'Introspection'
    },
    { 
      name: 'Get path', 
      pattern: 'path(.field.nested)', 
      description: 'Get the path to a value',
      category: 'Introspection'
    },
    { 
      name: 'Get value at path', 
      pattern: 'getpath(["field", "nested"])', 
      description: 'Get value at specified path',
      category: 'Introspection'
    },
    
    // Mathematical Operations
    { 
      name: 'Floor', 
      pattern: 'floor', 
      description: 'Round down to nearest integer',
      category: 'Math'
    },
    { 
      name: 'Ceiling', 
      pattern: 'ceil', 
      description: 'Round up to nearest integer',
      category: 'Math'
    },
    { 
      name: 'Round', 
      pattern: 'round', 
      description: 'Round to nearest integer',
      category: 'Math'
    },
    { 
      name: 'Modulo', 
      pattern: '% 10', 
      description: 'Modulo operation (remainder)',
      category: 'Math'
    },
    { 
      name: 'Absolute value', 
      pattern: 'fabs', 
      description: 'Absolute value of a number',
      category: 'Math'
    },
    { 
      name: 'Square root', 
      pattern: 'sqrt', 
      description: 'Square root of a number',
      category: 'Math'
    },
    
    // Conditional Logic
    { 
      name: 'If-then-else', 
      pattern: 'if .condition then .value1 else .value2 end', 
      description: 'Conditional expression',
      category: 'Logic'
    },
    { 
      name: 'Alternative', 
      pattern: '.value1 // .value2', 
      description: 'Use value2 if value1 is null/false/empty',
      category: 'Logic'
    },
    { 
      name: 'Try-catch', 
      pattern: 'try .expression catch .default', 
      description: 'Try expression, use default on error',
      category: 'Logic'
    },
    { 
      name: 'Error', 
      pattern: 'error("message")', 
      description: 'Raise an error with message',
      category: 'Logic'
    },
    
    // Advanced Array Operations
    { 
      name: 'Range', 
      pattern: 'range(0; 10)', 
      description: 'Generate array of numbers in range',
      category: 'Array'
    },
    { 
      name: 'Indices', 
      pattern: 'indices(element)', 
      description: 'Find indices of element in array',
      category: 'Array'
    },
    { 
      name: 'Reduce', 
      pattern: 'reduce .[] as $item (0; . + $item)', 
      description: 'Reduce array to single value',
      category: 'Array'
    },
    { 
      name: 'Foreach', 
      pattern: 'foreach .[] as $item ({}; . + {($item): true})', 
      description: 'Process each item with state',
      category: 'Array'
    },
    { 
      name: 'Index', 
      pattern: 'index("substring")', 
      description: 'Find index of substring',
      category: 'Array'
    },
    { 
      name: 'Rindex', 
      pattern: 'rindex("substring")', 
      description: 'Find last index of substring',
      category: 'Array'
    },
    
    // Variable and Function
    { 
      name: 'Variable assignment', 
      pattern: '.items[] as $item | $item.name', 
      description: 'Assign value to variable',
      category: 'Variable'
    },
    { 
      name: 'Function definition', 
      pattern: 'def add(a; b): a + b; add(1; 2)', 
      description: 'Define and use a function',
      category: 'Function'
    },
    { 
      name: 'Pipe to function', 
      pattern: '.field | tostring', 
      description: 'Pipe output to a function',
      category: 'Function'
    },
    
    // Format Conversion
    { 
      name: 'To string', 
      pattern: 'tostring', 
      description: 'Convert value to string',
      category: 'Conversion'
    },
    { 
      name: 'To number', 
      pattern: 'tonumber', 
      description: 'Convert string to number',
      category: 'Conversion'
    },
    { 
      name: 'To JSON', 
      pattern: 'tojson', 
      description: 'Convert value to JSON string',
      category: 'Conversion'
    },
    { 
      name: 'From JSON', 
      pattern: 'fromjson', 
      description: 'Parse JSON string to value',
      category: 'Conversion'
    },
    
    // Date Functions
    { 
      name: 'ISO date to timestamp', 
      pattern: 'fromdateiso8601', 
      description: 'Parse ISO 8601 datetime to Unix timestamp',
      category: 'Date'
    },
    { 
      name: 'Timestamp to ISO date', 
      pattern: 'todateiso8601', 
      description: 'Convert Unix timestamp to ISO 8601 datetime',
      category: 'Date'
    },
    { 
      name: 'Parse date', 
      pattern: 'fromdate', 
      description: 'Parse datetime string to Unix timestamp',
      category: 'Date'
    },
    { 
      name: 'Format date', 
      pattern: 'todate', 
      description: 'Format Unix timestamp as ISO 8601 datetime',
      category: 'Date'
    },
    { 
      name: 'Current time', 
      pattern: 'now', 
      description: 'Get current time in seconds since Unix epoch',
      category: 'Date'
    },
    { 
      name: 'Parse date with format', 
      pattern: 'strptime("%Y-%m-%d")', 
      description: 'Parse datetime string using format string',
      category: 'Date'
    },
    { 
      name: 'Format date with format', 
      pattern: 'strftime("%Y-%m-%d")', 
      description: 'Format datetime using format string',
      category: 'Date'
    },
    
    // SQL-Style Operators
    { 
      name: 'Index', 
      pattern: 'INDEX(stream; .key)', 
      description: 'Create an index from a stream using key expression',
      category: 'SQL'
    },
    { 
      name: 'Join', 
      pattern: 'JOIN($idx; stream; .key)', 
      description: 'Join stream with index using key expression',
      category: 'SQL'
    },
    { 
      name: 'In', 
      pattern: 'IN(stream)', 
      description: 'Check if input appears in stream',
      category: 'SQL'
    },
    
    // I/O Functions
    { 
      name: 'Read input', 
      pattern: 'input', 
      description: 'Read one input value',
      category: 'IO'
    },
    { 
      name: 'Read all inputs', 
      pattern: 'inputs', 
      description: 'Read all remaining input values',
      category: 'IO'
    },
    { 
      name: 'Debug', 
      pattern: 'debug', 
      description: 'Print debug message to stderr',
      category: 'IO'
    },
    { 
      name: 'Print to stderr', 
      pattern: 'stderr', 
      description: 'Print to stderr without formatting',
      category: 'IO'
    },
    
    // Stream Functions
    { 
      name: 'Truncate stream', 
      pattern: 'truncate_stream(stream_expr)', 
      description: 'Truncate path elements from stream',
      category: 'Stream'
    },
    { 
      name: 'From stream', 
      pattern: 'fromstream(stream_expr)', 
      description: 'Convert stream to regular JSON',
      category: 'Stream'
    },
    { 
      name: 'To stream', 
      pattern: 'tostream', 
      description: 'Convert to streamed form',
      category: 'Stream'
    },
    
    // Additional String Functions
    { 
      name: 'String to codepoints', 
      pattern: 'explode', 
      description: 'Convert string to array of codepoints',
      category: 'String'
    },
    { 
      name: 'Codepoints to string', 
      pattern: 'implode', 
      description: 'Convert array of codepoints to string',
      category: 'String'
    },
    { 
      name: 'UTF-8 byte length', 
      pattern: 'utf8bytelength', 
      description: 'Get number of bytes in UTF-8 encoded string',
      category: 'String'
    },
    { 
      name: 'Trim whitespace', 
      pattern: 'trim', 
      description: 'Trim whitespace from both ends of string',
      category: 'String'
    },
    { 
      name: 'Trim left whitespace', 
      pattern: 'ltrim', 
      description: 'Trim whitespace from left side of string',
      category: 'String'
    },
    { 
      name: 'Trim right whitespace', 
      pattern: 'rtrim', 
      description: 'Trim whitespace from right side of string',
      category: 'String'
    },
    
    // Additional Math Functions
    { 
      name: 'Infinity', 
      pattern: 'infinite', 
      description: 'Return positive infinity',
      category: 'Math'
    },
    { 
      name: 'NaN', 
      pattern: 'nan', 
      description: 'Return Not-a-Number value',
      category: 'Math'
    },
    { 
      name: 'Is infinite', 
      pattern: 'isinfinite', 
      description: 'Check if value is infinite',
      category: 'Math'
    },
    { 
      name: 'Is NaN', 
      pattern: 'isnan', 
      description: 'Check if value is NaN',
      category: 'Math'
    },
    { 
      name: 'Is finite', 
      pattern: 'isfinite', 
      description: 'Check if value is finite',
      category: 'Math'
    },
    { 
      name: 'Is normal', 
      pattern: 'isnormal', 
      description: 'Check if value is a normal number',
      category: 'Math'
    },
    
    // Additional Array/Object Functions
    { 
      name: 'Combinations', 
      pattern: 'combinations', 
      description: 'Generate all combinations of array elements',
      category: 'Array'
    },
    { 
      name: 'Transpose', 
      pattern: 'transpose', 
      description: 'Transpose a matrix (array of arrays)',
      category: 'Array'
    },
    { 
      name: 'Binary search', 
      pattern: 'bsearch(value)', 
      description: 'Binary search for value in sorted array',
      category: 'Array'
    },
    { 
      name: 'Inside', 
      pattern: 'inside(container)', 
      description: 'Check if input is contained within container',
      category: 'Testing'
    },
    { 
      name: 'Walk', 
      pattern: 'walk(f)', 
      description: 'Apply function to every component of input recursively',
      category: 'Transformation'
    },
    
    // Format Functions
    { 
      name: 'Format as text', 
      pattern: '@text', 
      description: 'Format as plain text',
      category: 'Format'
    },
    { 
      name: 'Format as JSON', 
      pattern: '@json', 
      description: 'Format as JSON string',
      category: 'Format'
    },
    { 
      name: 'Format as HTML', 
      pattern: '@html', 
      description: 'Format with HTML escaping',
      category: 'Format'
    },
    { 
      name: 'Format as URI', 
      pattern: '@uri', 
      description: 'Format with URI percent-encoding',
      category: 'Format'
    },
    { 
      name: 'Format as CSV', 
      pattern: '@csv', 
      description: 'Format array as CSV',
      category: 'Format'
    },
    { 
      name: 'Format as TSV', 
      pattern: '@tsv', 
      description: 'Format array as TSV',
      category: 'Format'
    },
    { 
      name: 'Format as shell', 
      pattern: '@sh', 
      description: 'Format for shell command-line',
      category: 'Format'
    },
    { 
      name: 'Format as base64', 
      pattern: '@base64', 
      description: 'Encode as base64',
      category: 'Format'
    },
    { 
      name: 'Decode base64', 
      pattern: '@base64d', 
      description: 'Decode base64 to string',
      category: 'Format'
    },
    
    // Control Flow
    { 
      name: 'While loop', 
      pattern: 'while(condition; update)', 
      description: 'Repeatedly apply update while condition is true',
      category: 'Control'
    },
    { 
      name: 'Until loop', 
      pattern: 'until(condition; next)', 
      description: 'Repeatedly apply next until condition is true',
      category: 'Control'
    },
    { 
      name: 'Repeat', 
      pattern: 'repeat(expr)', 
      description: 'Repeatedly apply expression until error',
      category: 'Control'
    },
    { 
      name: 'Label', 
      pattern: 'label $out | ...', 
      description: 'Define a label for break',
      category: 'Control'
    },
    { 
      name: 'Break', 
      pattern: 'break $out', 
      description: 'Break out of labeled section',
      category: 'Control'
    },
    
    // Boolean Functions
    { 
      name: 'Any', 
      pattern: 'any', 
      description: 'Check if any array element is true',
      category: 'Boolean'
    },
    { 
      name: 'All', 
      pattern: 'all', 
      description: 'Check if all array elements are true',
      category: 'Boolean'
    },
    { 
      name: 'Any with condition', 
      pattern: 'any(condition)', 
      description: 'Check if any element satisfies condition',
      category: 'Boolean'
    },
    { 
      name: 'All with condition', 
      pattern: 'all(condition)', 
      description: 'Check if all elements satisfy condition',
      category: 'Boolean'
    },
    
    // Utility Functions
    { 
      name: 'Halt', 
      pattern: 'halt', 
      description: 'Stop jq program with exit status 0',
      category: 'Utility'
    },
    { 
      name: 'Halt with error', 
      pattern: 'halt_error(1)', 
      description: 'Stop jq program with specified exit code',
      category: 'Utility'
    },
    { 
      name: 'Module metadata', 
      pattern: 'modulemeta', 
      description: 'Get metadata for a module',
      category: 'Utility'
    },
    { 
      name: 'Builtins', 
      pattern: 'builtins', 
      description: 'List all builtin functions',
      category: 'Utility'
    },
    { 
      name: 'Environment variables', 
      pattern: 'env', 
      description: 'Get environment variables',
      category: 'Utility'
    },
    { 
      name: 'Is empty', 
      pattern: 'isempty(expr)', 
      description: 'Check if expression produces no outputs',
      category: 'Utility'
    },
    { 
      name: 'Limit', 
      pattern: 'limit(n; expr)', 
      description: 'Extract up to n outputs from expression',
      category: 'Utility'
    },
    { 
      name: 'Skip', 
      pattern: 'skip(n; expr)', 
      description: 'Skip first n outputs from expression',
      category: 'Utility'
    },
    { 
      name: 'First', 
      pattern: 'first(expr)', 
      description: 'Extract first value from expression',
      category: 'Utility'
    },
    { 
      name: 'Last', 
      pattern: 'last(expr)', 
      description: 'Extract last value from expression',
      category: 'Utility'
    },
    { 
      name: 'Nth', 
      pattern: 'nth(n; expr)', 
      description: 'Extract nth value from expression',
      category: 'Utility'
    }
  ];

  // Generate enhanced suggestions based on JSON paths
  const generateSuggestions = (currentWord: string, context: string) => {
    const pathSuggestions = jsonPaths
      .filter(path => path.toLowerCase().includes(currentWord.toLowerCase()))
      .slice(0, 10)
      .map(path => ({
        path: `.${path}`,
        type: 'field',
        description: `Access field: ${path}`
      }));

    const patternSuggestions = jqPatterns
      .filter(pattern => 
        pattern.name.toLowerCase().includes(currentWord.toLowerCase()) ||
        pattern.pattern.toLowerCase().includes(currentWord.toLowerCase())
      )
      .slice(0, 5)
      .map(pattern => ({
        path: pattern.pattern,
        type: 'pattern',
        description: `${pattern.name}: ${pattern.description}`
      }));

    return [...pathSuggestions, ...patternSuggestions];
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure jq language support
    monaco.languages.register({ id: 'jq' });
    
    // Register a document formatting edit provider for JQ language
    monaco.languages.registerDocumentFormattingEditProvider('jq', {
      provideDocumentFormattingEdits: (model: any) => {
        const text = model.getValue();
        const formatted = formatJqScript(text);
        return [
          {
            range: model.getFullModelRange(),
            text: formatted
          }
        ];
      }
    });
    
    // Function to format JQ script
    function formatJqScript(jqScript: string): string {
      if (!jqScript.trim()) return jqScript;
      
      // Split the script into lines
      const lines = jqScript.split('\n');
      const formattedLines: string[] = [];
      let indentLevel = 0;
      
      // Process each line
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Skip empty lines
        if (!line) {
          formattedLines.push('');
          continue;
        }
        
        // Check for closing brackets/braces to decrease indent
        if (line.startsWith(']') || line.startsWith('}')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add proper indentation
        const indent = '  '.repeat(indentLevel);
        formattedLines.push(indent + line);
        
        // Check for opening brackets/braces to increase indent
        if (line.endsWith('[') || line.endsWith('{')) {
          indentLevel++;
        }
        
        // Handle pipe operator at the end of a line
        if (line.endsWith('|')) {
          indentLevel++;
        }
        
        // Handle pipe operator at the beginning of a line
        if (line.startsWith('|')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
      }
      
      return formattedLines.join('\n');
    }
    
    // Add context menu actions for Quick Patterns by Category
    const addPatternAction = (pattern: any) => {
      editor.addAction({
        id: `insert-pattern-${pattern.name.replace(/\s+/g, '-').toLowerCase()}`,
        label: pattern.name,
        contextMenuGroupId: `jq-patterns-${pattern.category.toLowerCase()}`,
        contextMenuOrder: 1,
        run: () => {
          const position = editor.getPosition();
          editor.executeEdits('insert-pattern', [
            {
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              text: pattern.pattern
            }
          ]);
        }
      });
    };
    
    // Add all patterns to context menu, organized by category
    jqPatterns.forEach(pattern => {
      addPatternAction(pattern);
    });
    
    // Add category headers to context menu
    const categories = [...new Set(jqPatterns.map(p => p.category))];
    categories.forEach(category => {
      editor.addAction({
        id: `category-header-${category.toLowerCase()}`,
        label: `--- ${category} Patterns ---`,
        contextMenuGroupId: `jq-patterns-${category.toLowerCase()}`,
        contextMenuOrder: 0,
        run: () => {}
      });
    });
    
    // Add keyboard shortcuts for common JQ operations
    const addShortcutAction = (id: string, label: string, keybinding: number[], pattern: string, description: string) => {
      editor.addAction({
        id: id,
        label: label,
        keybindings: keybinding,
        precondition: null,
        keybindingContext: null,
        contextMenuGroupId: 'jq-shortcuts',
        contextMenuOrder: 1,
        run: () => {
          const position = editor.getPosition();
          editor.executeEdits('insert-pattern', [
            {
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              text: pattern
            }
          ]);
        }
      });
    };
    
    // Define keyboard shortcuts for common operations
    // Using Ctrl+Alt+key combinations to avoid conflicts
    addShortcutAction(
      'jq-shortcut-identity',
      'Insert Identity Operator (.)',
      [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Period],
      '.',
      'Returns the input unchanged'
    );
    
    addShortcutAction(
      'jq-shortcut-array-iteration',
      'Insert Array Iteration ([])',
      [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.BracketLeft],
      '.[]',
      'Iterate over array elements'
    );
    
    addShortcutAction(
      'jq-shortcut-pipe',
      'Insert Pipe (|)',
      [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_P],
      ' | ',
      'Pipe operator'
    );
    
    addShortcutAction(
      'jq-shortcut-select',
      'Insert Select',
      [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_S],
      'select()',
      'Filter items based on a condition'
    );
    
    addShortcutAction(
      'jq-shortcut-map',
      'Insert Map',
      [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_M],
      'map()',
      'Transform each item'
    );
    
    addShortcutAction(
      'jq-shortcut-length',
      'Insert Length',
      [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_L],
      'length',
      'Count items'
    );
    
    addShortcutAction(
      'jq-shortcut-sort-by',
      'Insert Sort By',
      [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_O],
      'sort_by()',
      'Sort array by a specific field'
    );
    
    
    // Define jq syntax highlighting
    monaco.languages.setMonarchTokensProvider('jq', {
      tokenizer: {
        root: [
          [/\.[a-zA-Z_][a-zA-Z0-9_]*/, 'field'],
          [/\[\]/, 'array-access'],
          [/\|/, 'pipe'],
          [/select|map|sort_by|group_by|has|keys|length|unique|flatten|min_by|max_by|contains|type|empty|min|max|add|reverse|split|join|to_entries|from_entries|first|last|startswith|endswith|del|path|getpath|setpath|floor|ceil|round|fabs|sqrt|if|then|else|end|try|catch|error|range|indices|reduce|foreach|index|rindex|as|def|tostring|tonumber|tojson|fromjson|ascii_downcase|ascii_upcase|ltrimstr|rtrimstr|sub|gsub|test|match|capture|fromdateiso8601|todateiso8601|fromdate|todate|now|strptime|strftime|strflocaltime|mktime|gmtime|localtime|INDEX|JOIN|IN|input|inputs|debug|stderr|truncate_stream|fromstream|tostream|explode|implode|utf8bytelength|trim|rtrim|ltrim|infinite|nan|isinfinite|isnan|isfinite|isnormal|combinations|transpose|bsearch|inside|walk|while|until|repeat|label|break|any|all|halt|halt_error|modulemeta|builtins|env|isempty|limit|skip|nth/, 'keyword'],
          [/"[^"]*"/, 'string'],
          [/'[^']*'/, 'string'],
          [/\d+/, 'number'],
          [/==|!=|<=|>=|<|>|\/\/|\+|\-|\*|\/|%/, 'operator'],
          [/[{}()\[\]]/, 'bracket'],
          [/[,;]/, 'delimiter']
        ]
      }
    });

    // Setup consistent jq theme
    setupJqTheme(monaco);

    // Store references for later use
    console.log('Editor mounted, storing references');
    // Note: We don't register the completion provider here anymore
    // It will be registered by the useEffect hooks

    // Set up hover provider
    monaco.languages.registerHoverProvider('jq', {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return;

        const pattern = jqPatterns.find(p => 
          p.pattern.includes(word.word) || p.name.toLowerCase().includes(word.word.toLowerCase())
        );

        if (pattern) {
          return {
            range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
            contents: [
              { value: `**${pattern.name}**` },
              { value: pattern.description },
              { value: `\`\`\`jq\n${pattern.pattern}\n\`\`\`` }
            ]
          };
        }
      }
    });

    // Track cursor position
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.columnNumber });
    });

    // Auto-trigger suggestions
    editor.onDidChangeModelContent(() => {
      const position = editor.getPosition();
      const model = editor.getModel();
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.columnNumber
      });
      
      // Trigger autocomplete on '.' or after certain keywords
      if (textUntilPosition.endsWith('.') || textUntilPosition.match(/\b(select|map|sort_by|group_by)\s*\($/)) {
        editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
      }
    });
  };

  // Register or update the completion provider when jsonPaths change
  const registerCompletionProvider = (monaco: any, paths: string[]) => {
    console.log('Registering completion provider with paths:', paths.length);
    
    // Ensure paths is always an array, even if empty
    paths = Array.isArray(paths) ? paths : [];
    
    // Dispose existing provider if it exists
    if (completionProvider) {
      console.log('Disposing existing completion provider');
      completionProvider.dispose();
    }

    // Register new provider with current paths
    console.log('Creating new completion provider');
    const newProvider = monaco.languages.registerCompletionItemProvider('jq', {
      provideCompletionItems: (model: any, position: any) => {
        console.log('Providing completion items at position:', position);
        
        const word = model.getWordUntilPosition(position);
        console.log('Current word:', word.word);
        
        const textBeforePosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.columnNumber
        });
        console.log('Text before position:', textBeforePosition);
        
        // Enhanced context detection for better context-aware autocomplete
        const isAfterDot = textBeforePosition.match(/\.[a-zA-Z_][a-zA-Z0-9_]*$/);
        const isAfterFieldAccess = textBeforePosition.match(/\.[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_]*$/);
        const isAfterPipe = textBeforePosition.trim().endsWith('|');
        const isAfterSelect = textBeforePosition.match(/select\s*\(\s*$/);
        const isAfterMap = textBeforePosition.match(/map\s*\(\s*$/);
        const isAfterFilter = textBeforePosition.match(/filter\s*\(\s*$/);
        const isAfterSortBy = textBeforePosition.match(/sort_by\s*\(\s*$/);
        const isAfterGroupBy = textBeforePosition.match(/group_by\s*\(\s*$/);
        const isInCondition = textBeforePosition.match(/\b(if|elif|select)\s*\([^)]*$/);
        const isAfterComparison = textBeforePosition.match(/[=!<>]=?\s*$/);
        
        // Extract the current line for more detailed context analysis
        const currentLine = textBeforePosition.split('\n').pop() || '';
        const lineTokens = currentLine.trim().split(/\s+/);
        const lastToken = lineTokens[lineTokens.length - 1];
        
        console.log('Enhanced context checks:', {
          isAfterDot: !!isAfterDot, 
          isAfterFieldAccess: !!isAfterFieldAccess,
          isAfterPipe: isAfterPipe,
          isAfterSelect: !!isAfterSelect,
          isAfterMap: !!isAfterMap,
          isAfterFilter: !!isAfterFilter,
          isAfterSortBy: !!isAfterSortBy,
          isAfterGroupBy: !!isAfterGroupBy,
          isInCondition: !!isInCondition,
          isAfterComparison: !!isAfterComparison,
          currentLine,
          lastToken
        });
        
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        // Generate JSON path suggestions
        const pathSuggestions = paths.map(path => ({
          label: path,
          kind: monaco.languages.CompletionItemKind.Field,
          insertText: isAfterDot || isAfterFieldAccess ? path.substring(1) : path, // Remove leading dot if already after a dot
          range: range,
          documentation: `Access field: ${path}`,
          // Always prioritize paths, but even higher after a dot
          sortText: isAfterDot ? `00${path}` : `0${path}`
        }));
        
        console.log('JSON path suggestions count:', pathSuggestions.length);
        if (pathSuggestions.length > 0) {
          console.log('Sample JSON path suggestions:', pathSuggestions.slice(0, 3));
        }
        
        // Helper function to determine pattern relevance based on context
        const getPatternRelevanceScore = (pattern) => {
          // Default score - lower is better
          let score = 500;
          let appliedRules = [];
          
          // Boost patterns based on context
          if (isAfterDot && pattern.category === 'Basic' && 
              (pattern.name === 'Field access' || pattern.name === 'Array iteration')) {
            score -= 300;
            appliedRules.push('After dot - boosted field access/array iteration');
          }
          
          if (isAfterPipe) {
            // After a pipe, prioritize filtering and transformation operations
            if (pattern.category === 'Filtering' || pattern.category === 'Transformation') {
              score -= 200;
              appliedRules.push('After pipe - boosted filtering/transformation');
            }
            // Further boost select after pipe
            if (pattern.name === 'Filter by condition') {
              score -= 100;
              appliedRules.push('After pipe - extra boost for filter by condition');
            }
          }
          
          if (isAfterSelect || isAfterFilter || isInCondition) {
            // In a condition, prioritize comparison operations
            if (pattern.category === 'Comparison') {
              score -= 300;
              appliedRules.push('In condition - boosted comparison operations');
            }
            // Also boost field access in conditions
            if (pattern.category === 'Basic' && pattern.name === 'Field access') {
              score -= 200;
              appliedRules.push('In condition - boosted field access');
            }
          }
          
          if (isAfterMap) {
            // After map, prioritize transformations
            if (pattern.category === 'Transformation') {
              score -= 300;
              appliedRules.push('After map - boosted transformations');
            }
            // Also boost field access and object construction
            if (pattern.category === 'Basic' && pattern.name === 'Field access') {
              score -= 200;
              appliedRules.push('After map - boosted field access');
            }
            if (pattern.category === 'Object') {
              score -= 250;
              appliedRules.push('After map - boosted object construction');
            }
          }
          
          if (isAfterSortBy || isAfterGroupBy) {
            // After sort_by or group_by, prioritize field access
            if (pattern.category === 'Basic' && pattern.name === 'Field access') {
              score -= 300;
              appliedRules.push('After sort_by/group_by - boosted field access');
            }
          }
          
          if (isAfterComparison) {
            // After comparison operators, prioritize values and field access
            if (pattern.category === 'Basic' && pattern.name === 'Field access') {
              score -= 300;
              appliedRules.push('After comparison - boosted field access');
            }
            if (pattern.category === 'Value') {
              score -= 250;
              appliedRules.push('After comparison - boosted values');
            }
          }
          
          // Log detailed scoring for debugging (only for a few patterns to avoid log spam)
          if (pattern.name === 'Field access' || pattern.name === 'Filter by condition' || 
              pattern.name === 'Object construction' || appliedRules.length > 0) {
            console.log(`Context-aware scoring for [${pattern.category}] ${pattern.name}:`, {
              finalScore: score,
              appliedRules,
              currentLine,
              contextFlags: {
                isAfterDot, isAfterFieldAccess, isAfterPipe, isAfterSelect, 
                isAfterMap, isAfterFilter, isAfterSortBy, isAfterGroupBy,
                isInCondition, isAfterComparison
              }
            });
          }
          
          return score;
        };
        
        // Generate jq function suggestions with category in label and enhanced descriptions
        const patternSuggestions = jqPatterns.map((pattern, index) => {
          // Get context-based relevance score
          const relevanceScore = getPatternRelevanceScore(pattern);
          
          // Create more descriptive labels and documentation for utility functions
          let enhancedLabel = `[${pattern.category}] ${pattern.name}`;
          let enhancedDocumentation = pattern.description;
          let enhancedDetail = pattern.category;
          
          // For utility functions, add parameter information to make them more readable
          if (pattern.category === 'Utility') {
            // Extract parameter information from the pattern
            const paramMatch = pattern.pattern.match(/(\w+)\((.*?)\)/);
            if (paramMatch) {
              const funcName = paramMatch[1];
              const params = paramMatch[2].split(';').map(p => p.trim());
              
              // Create a more descriptive label with parameter information
              enhancedLabel = `[${pattern.category}] ${pattern.name} (${params.join(', ')})`;
              
              // Create more detailed documentation with parameter explanations
              let paramDocs = '';
              if (pattern.pattern.includes('n; expr')) {
                paramDocs = '\n\nParameters:\n- n: Number of items\n- expr: Expression to evaluate';
              } else if (pattern.pattern.includes('expr')) {
                paramDocs = '\n\nParameters:\n- expr: Expression to evaluate';
              }
              
              // Add example usage
              let example = '';
              if (pattern.name === 'Limit') {
                example = '\n\nExample: `limit(3; .items[])` - Returns first 3 items from array';
              } else if (pattern.name === 'Skip') {
                example = '\n\nExample: `skip(2; .items[])` - Skips first 2 items from array';
              } else if (pattern.name === 'First') {
                example = '\n\nExample: `first(.items[])` - Returns first item from array';
              } else if (pattern.name === 'Last') {
                example = '\n\nExample: `last(.items[])` - Returns last item from array';
              } else if (pattern.name === 'Nth') {
                example = '\n\nExample: `nth(1; .items[])` - Returns second item from array (0-indexed)';
              } else if (pattern.name === 'Is empty') {
                example = '\n\nExample: `isempty(.items)` - Returns true if items array is empty';
              }
              
              enhancedDocumentation = `${pattern.description}${paramDocs}${example}`;
              enhancedDetail = `${pattern.category}: ${funcName}(${params.join(', ')})`;
            }
          }
          
          return {
            // Use enhanced label for better readability
            label: enhancedLabel,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: pattern.pattern,
            range: range,
            documentation: enhancedDocumentation,
            detail: enhancedDetail,
            // Use relevance score for context-aware sorting
            // Format: score (padded) + category + index (for consistent ordering within same score)
            sortText: `${relevanceScore.toString().padStart(3, '0')}_${pattern.category}_${index.toString().padStart(3, '0')}`
          };
        });
        
        console.log('jq pattern suggestions count:', patternSuggestions.length);
        
        // Since we now include category in the label, we don't need separate category headers
        // Enhance pattern suggestions with more visible category information in documentation
        const enhancedPatternSuggestions = patternSuggestions.map(suggestion => ({
          ...suggestion,
          documentation: `${suggestion.documentation}\n\nCategory: ${suggestion.detail.split(':')[0]}`
        }));
        
        // Deduplicate suggestions by label
        const uniqueSuggestions = new Map();
        
        // Add path suggestions first (higher priority)
        pathSuggestions.forEach(suggestion => {
          uniqueSuggestions.set(suggestion.label, suggestion);
        });
        
        // Add enhanced pattern suggestions (lower priority, won't overwrite paths with same label)
        enhancedPatternSuggestions.forEach(suggestion => {
          if (!uniqueSuggestions.has(suggestion.label)) {
            uniqueSuggestions.set(suggestion.label, suggestion);
          }
        });
        
        // Convert Map back to array
        const suggestions = Array.from(uniqueSuggestions.values());
        console.log('Total unique suggestions count:', suggestions.length);
        
        // Log top suggestions to verify context-aware sorting
        if (suggestions.length > 0) {
          // Sort suggestions by sortText to see what would appear first
          const sortedForLogging = [...suggestions].sort((a, b) => 
            a.sortText.localeCompare(b.sortText)
          );
          
          console.log('Top 5 context-aware suggestions:', 
            sortedForLogging.slice(0, 5).map(s => ({
              label: s.label,
              sortText: s.sortText,
              insertText: s.insertText
            }))
          );
          
          // Log context information again for reference
          console.log('Current context for these suggestions:', {
            currentLine,
            contextFlags: {
              isAfterDot, isAfterFieldAccess, isAfterPipe, isAfterSelect, 
              isAfterMap, isAfterFilter, isAfterSortBy, isAfterGroupBy,
              isInCondition, isAfterComparison
            }
          });
        }
        
        // Always ensure we have suggestions, even if paths is empty and no patterns match
        if (suggestions.length === 0) {
          console.log('No suggestions generated, adding default jq patterns with categories in labels');
          
          // Add patterns with category in label and enhanced descriptions for utilities
          const defaultSuggestions = jqPatterns.map((pattern, index) => {
            // Get context-based relevance score
            const relevanceScore = getPatternRelevanceScore(pattern);
            
            // Create more descriptive labels and documentation for utility functions
            let enhancedLabel = `[${pattern.category}] ${pattern.name}`;
            let enhancedDocumentation = pattern.description;
            let enhancedDetail = pattern.category;
            
            // For utility functions, add parameter information to make them more readable
            if (pattern.category === 'Utility') {
              // Extract parameter information from the pattern
              const paramMatch = pattern.pattern.match(/(\w+)\((.*?)\)/);
              if (paramMatch) {
                const funcName = paramMatch[1];
                const params = paramMatch[2].split(';').map(p => p.trim());
                
                // Create a more descriptive label with parameter information
                enhancedLabel = `[${pattern.category}] ${pattern.name} (${params.join(', ')})`;
                
                // Create more detailed documentation with parameter explanations
                let paramDocs = '';
                if (pattern.pattern.includes('n; expr')) {
                  paramDocs = '\n\nParameters:\n- n: Number of items\n- expr: Expression to evaluate';
                } else if (pattern.pattern.includes('expr')) {
                  paramDocs = '\n\nParameters:\n- expr: Expression to evaluate';
                }
                
                // Add example usage
                let example = '';
                if (pattern.name === 'Limit') {
                  example = '\n\nExample: `limit(3; .items[])` - Returns first 3 items from array';
                } else if (pattern.name === 'Skip') {
                  example = '\n\nExample: `skip(2; .items[])` - Skips first 2 items from array';
                } else if (pattern.name === 'First') {
                  example = '\n\nExample: `first(.items[])` - Returns first item from array';
                } else if (pattern.name === 'Last') {
                  example = '\n\nExample: `last(.items[])` - Returns last item from array';
                } else if (pattern.name === 'Nth') {
                  example = '\n\nExample: `nth(1; .items[])` - Returns second item from array (0-indexed)';
                } else if (pattern.name === 'Is empty') {
                  example = '\n\nExample: `isempty(.items)` - Returns true if items array is empty';
                }
                
                enhancedDocumentation = `${pattern.description}${paramDocs}${example}`;
                enhancedDetail = `${pattern.category}: ${funcName}(${params.join(', ')})`;
              }
            }
            
            return {
              label: enhancedLabel,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: pattern.pattern,
              range: range,
              documentation: `${enhancedDocumentation}\n\nCategory: ${enhancedDetail.split(':')[0]}`,
              detail: enhancedDetail,
              // Use relevance score for context-aware sorting
              // Format: score (padded) + category + index (for consistent ordering within same score)
              sortText: `${relevanceScore.toString().padStart(3, '0')}_${pattern.category}_${index.toString().padStart(3, '0')}`
            };
          });
          
          // Log top default suggestions to verify context-aware sorting
          if (defaultSuggestions.length > 0) {
            // Sort suggestions by sortText to see what would appear first
            const sortedForLogging = [...defaultSuggestions].sort((a, b) => 
              a.sortText.localeCompare(b.sortText)
            );
            
            console.log('Top 5 context-aware DEFAULT suggestions:', 
              sortedForLogging.slice(0, 5).map(s => ({
                label: s.label,
                sortText: s.sortText,
                insertText: s.insertText
              }))
            );
            
            // Log context information again for reference
            console.log('Current context for DEFAULT suggestions:', {
              currentLine,
              contextFlags: {
                isAfterDot, isAfterFieldAccess, isAfterPipe, isAfterSelect, 
                isAfterMap, isAfterFilter, isAfterSortBy, isAfterGroupBy,
                isInCondition, isAfterComparison
              }
            });
          }
          
          return { suggestions: defaultSuggestions };
        }
        
        return { suggestions };
      },
      // Set higher priority to ensure our provider is used
      // Add more trigger characters to improve suggestion triggering
      triggerCharacters: ['.', '|', ' ', '[', '(', ',', '=', '!', '<', '>', '"', "'"],
    });
    
    // Store the provider in state for later disposal
    setCompletionProvider(newProvider);
    
    return newProvider;
  };

  // Update autocomplete when jsonPaths change
  useEffect(() => {
    console.log('jsonPaths changed, updating completion provider', {
      pathsLength: jsonPaths.length,
      timestamp: new Date().toISOString()
    });
    
    if (monacoRef.current) {
      console.log('Monaco reference available, registering completion provider');
      const newProvider = registerCompletionProvider(monacoRef.current, jsonPaths);
      
      // Clean up on unmount or when jsonPaths change
      return () => {
        console.log('Cleaning up previous completion provider');
        if (newProvider) {
          newProvider.dispose();
        }
      };
    } else {
      console.log('Monaco reference not available, skipping registration');
    }
  }, [jsonPaths]);
  
  // Initial registration of completion provider when component mounts
  useEffect(() => {
    console.log('Setting up initial completion provider registration', {
      timestamp: new Date().toISOString(),
      initialJsonPathsLength: jsonPaths.length
    });
    
    // Only proceed if Monaco is initialized
    if (!monacoRef.current) {
      console.log('Monaco not initialized yet, skipping initial registration');
      return;
    }
    
    // Register the completion provider once on mount
    console.log('Executing initial completion provider registration');
    const initialProvider = registerCompletionProvider(monacoRef.current, jsonPaths);
    
    // Force trigger suggestions after a short delay to ensure they're visible on initial load
    const triggerTimer = setTimeout(() => {
      console.log('Auto-triggering suggestions after initial registration', {
        timestamp: new Date().toISOString(),
        editorReady: !!editorRef.current,
        jsonPathsLength: jsonPaths.length
      });
      
      if (editorRef.current) {
        // Focus the editor to ensure suggestions are visible
        editorRef.current.focus();
        // Trigger suggestions
        editorRef.current.trigger('initial-registration', 'editor.action.triggerSuggest', {});
        console.log('Suggestions triggered successfully');
      } else {
        console.log('Editor reference not available, could not trigger suggestions');
      }
    }, 500); // 500ms delay
    
    return () => {
      // Clean up the provider and timer
      console.log('Cleaning up initial completion provider');
      if (initialProvider) {
        initialProvider.dispose();
      }
      clearTimeout(triggerTimer);
    };
  }, []); // Empty dependency array - only run once on mount

  const insertPattern = (pattern: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const position = editor.getPosition();
      editor.executeEdits('insert-pattern', [{
        range: new (window as any).monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: pattern
      }]);
      editor.focus();
    }
  };

  const [isDragOver, setIsDragOver] = useState(false);
  const [errorDecorations, setErrorDecorations] = useState<string[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const jqSelector = e.dataTransfer.getData('text/plain');
    
    if (jqSelector && editorRef.current) {
      const editor = editorRef.current;
      const position = editor.getPosition();
      
      // Insert the jq selector at cursor position
      editor.executeEdits('drop-insert', [{
        range: new (window as any).monaco.Range(
          position.lineNumber, 
          position.column, 
          position.lineNumber, 
          position.column
        ),
        text: jqSelector
      }]);
      
      // Focus the editor
      editor.focus();
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
  
  // Handler for generating JQ from desired output
  const handleGenerateJq = async (
    desiredOutput: string, 
    extraPrompt?: string, 
    continueConversation: boolean = false,
    breakConversation: boolean = false
  ) => {
    try {
      // Reset state if not continuing conversation
      if (!continueConversation) {
        setConversationHistory([]);
      }
      
      // If breaking the conversation, just return without doing anything
      if (breakConversation) {
        return;
      }
      
      setIsGeneratingJq(true);
      setGenerationError(null);
      
      // Only reset these if not continuing conversation
      if (!continueConversation) {
        setLlmResponse(null);
        setGeneratedJq(null);
        setIsJqValid(null);
      }
      
      // Use the inputJson prop directly instead of trying to find it in the DOM
      // This is much more reliable as it comes directly from the App component's state
      if (!inputJson.trim()) {
        throw new Error('Could not get input JSON. Please make sure you have valid JSON in the input editor.');
      }
      
      // Prepare the request body
      const requestBody: any = {
        inputJson,
        desiredOutput,
        extraPrompt: extraPrompt || '',
      };
      
      // If continuing conversation, add the previous conversation history
      if (continueConversation && conversationHistory.length > 0) {
        requestBody.previousConversation = conversationHistory;
      }
      
      // Call the server API to generate the JQ query
      const response = await fetch('/api/generate-jq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate JQ query');
          } catch (jsonError) {
            // If parsing the error response as JSON fails, use the status text
            console.error('Error parsing error response:', jsonError);
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        } else {
          // Handle non-JSON error responses
          try {
            const textError = await response.text();
            throw new Error(textError || `Server error: ${response.status} ${response.statusText}`);
          } catch (textError) {
            // If even getting the text fails, use the status
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        }
      }
      
      // Parse the successful response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing successful response:', jsonError);
        throw new Error('Failed to parse server response. The response was not valid JSON.');
      }
      
      // Store the LLM response and generated JQ
      setLlmResponse(data.llmResponse || 'No response from LLM');
      setGeneratedJq(data.jqQuery);
      
      // Check if the JQ is valid
      const isValid = !data.warning;
      setIsJqValid(isValid);
      
      // Add to conversation history
      const historyEntry = {
        llmResponse: data.llmResponse || 'No response from LLM',
        generatedJq: data.jqQuery,
        isValid,
        error: data.warning || undefined
      };
      
      setConversationHistory(prev => [...prev, historyEntry]);
      
      // Update the JQ editor with the generated query
      onChange(data.jqQuery);
      
      // Don't close the modal, so the user can see the LLM response and generated JQ
      // setShowDesiredOutputModal(false);
      
      // Show a success message
      if (data.warning) {
        // If there's a warning, log it
        console.warn('JQ generation warning:', data.warning);
      }
    } catch (error) {
      console.error('Error generating JQ query:', error);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGeneratingJq(false);
    }
  };

  // Effect to highlight errors in the editor
  useEffect(() => {
    console.log('🔍 Error highlighting useEffect triggered', {
      hasEditor: !!editorRef.current,
      hasMonaco: !!monacoRef.current,
      hasErrorDetails: !!errorDetails,
      hasPosition: errorDetails?.position ? true : false,
      errorType: errorDetails?.type,
      errorPosition: errorDetails?.position,
      decorationsCount: errorDecorations.length,
      timestamp: new Date().toISOString()
    });

    if (!editorRef.current || !monacoRef.current) {
      console.log('⚠️ Missing editor or Monaco references');
      return;
    }
    
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    
    // Clear any existing markers and decorations if there are no errors
    if (!errorDetails || !errorDetails.position) {
      console.log('⚠️ No error details or position, clearing decorations and markers');
      
      // Clear decorations
      if (errorDecorations.length > 0) {
        console.log('🧹 Clearing existing error decorations');
        setErrorDecorations(editor.deltaDecorations(errorDecorations, []));
      }
      
      // Clear markers
      console.log('🧹 Clearing existing error markers');
      monaco.editor.setModelMarkers(editor.getModel(), 'jq-errors', []);
      
      return;
    }

    // Get the position information from errorDetails
    const { start, end } = errorDetails.position;
    console.log('📍 Error position:', { start, end });
    
    // Create a decoration for the error
    const newDecorations = [{
      range: new monaco.Range(1, start + 1, 1, end + 1),
      options: {
        inlineClassName: 'jq-error-highlight',
        hoverMessage: { value: errorDetails.rawMessage },
        className: 'jq-error-line',
        isWholeLine: false,
        overviewRuler: {
          color: '#ff0000',
          position: monaco.editor.OverviewRulerLane.Right
        },
        // Add Monaco-specific marker styling
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        minimap: {
          color: '#ff0000',
          position: monaco.editor.MinimapPosition.Inline
        }
      }
    }];
    
    // Also add a Monaco marker for better visibility
    monaco.editor.setModelMarkers(editor.getModel(), 'jq-errors', [{
      startLineNumber: 1,
      startColumn: start + 1,
      endLineNumber: 1,
      endColumn: end + 1,
      message: errorDetails.rawMessage,
      severity: monaco.MarkerSeverity.Error
    }]);
    
    console.log('🎨 Creating new error decoration with range:', {
      lineStart: 1,
      columnStart: start + 1,
      lineEnd: 1,
      columnEnd: end + 1
    });
    
    // Apply the decoration
    const decorationIds = editor.deltaDecorations(errorDecorations, newDecorations);
    console.log('✅ Applied error decoration, got IDs:', decorationIds);
    setErrorDecorations(decorationIds);
    
    // Add CSS for the error highlighting if it doesn't exist
    const styleId = 'jq-error-styles';
    if (!document.getElementById(styleId)) {
      console.log('💄 Adding CSS styles for error highlighting');
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .jq-error-highlight {
          background-color: rgba(255, 0, 0, 0.3) !important;
          border-bottom: 2px wavy #ff0000 !important;
          text-decoration: underline wavy #ff0000 !important;
        }
        .jq-error-line {
          background-color: rgba(255, 0, 0, 0.1) !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      console.log('💄 Error highlighting CSS styles already exist');
    }
  }, [errorDetails, errorDecorations]);

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Main header - always visible */}
      <div className="bg-theme-bg-secondary border-b border-theme-border-primary px-3 py-2 flex items-center justify-between">
        {/* Left side: Title and info */}
        <div className="flex items-center space-x-3">
          {/* Title with icon */}
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-theme-text-success" />
            <h2 className="text-sm font-medium">JQ Transformation</h2>
          </div>
          
          {/* Row mode indicator - only show when row mode is enabled */}
          {isRowModeEnabled && (
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-theme-notification-info-bg text-theme-notification-info-text px-2 py-0.5 rounded">
                Row Mode Active
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={onPrevRow}
                  className="p-1 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded text-xs transition-colors"
                  title="Previous Item (Shift+Left)"
                  aria-label="Previous Item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button
                  onClick={onNextRow}
                  className="p-1 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded text-xs transition-colors"
                  title="Next Item (Shift+Right)"
                  aria-label="Next Item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right side: Actions and controls */}
        <div className="flex items-center space-x-2">
          {/* Generate JQ Button - Always visible in main header */}
          <button
            onClick={() => setShowDesiredOutputModal(true)}
            className="flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors bg-theme-button-primary-bg text-theme-button-primary-text hover:bg-theme-button-primary-hover"
            aria-label="Generate JQ with AI"
          >
            <Wand2 className="w-3 h-3" />
            <span>Generate</span>
          </button>
          
          {/* Browse Versions Button - Always visible in main header */}
          <button
            onClick={() => setShowVersionNavigator(!showVersionNavigator)}
            className="flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors bg-theme-button-secondary-bg text-theme-text-primary hover:bg-theme-button-secondary-hover"
            aria-label="Browse Version History"
          >
            <History className="w-3 h-3" />
            <span>History</span>
          </button>
          
          {/* Version Navigator - Shown when showVersionNavigator is true */}
          {showVersionNavigator && (
            <div className="fixed mt-2 z-30" style={{ top: '50px', right: '50px' }}>
              <JqVersionNavigator
                currentJqQuery={value}
                onApplyVersion={(jqQuery) => {
                  onChange(jqQuery);
                  setShowVersionNavigator(false);
                }}
                onClose={() => setShowVersionNavigator(false)}
                onPreview={(jqQuery) => {
                  // Just preview the jq query in the editor without applying it
                  setPreviewJqQuery(jqQuery);
                }}
              />
            </div>
          )}
          
          {/* Action Menu Button - Always visible in main header */}
          <div className="relative" ref={actionMenuRef}>
            <button
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className="flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors bg-theme-button-secondary-bg text-theme-text-primary hover:bg-theme-button-secondary-hover"
              aria-label="Open jq Actions Menu"
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
                      if (onDownloadQuery) onDownloadQuery();
                      setIsActionMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <Download className="w-3 h-3" />
                      <span>Download Query</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(value);
                      setIsActionMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <Copy className="w-3 h-3" />
                      <span>Copy Query</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      formatJq();
                      setIsActionMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <FileJson className="w-3 h-3" />
                      <span>Format JQ</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowContextualHelp(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="w-3 h-3" />
                      <span>jq Help</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowDesiredOutputModal(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-2">
                      <Wand2 className="w-3 h-3" />
                      <span>Desired Output</span>
                    </div>
                  </button>
                  <div className="px-3 py-1 text-xs text-theme-text-secondary font-medium mt-2">Keyboard Shortcuts</div>
                  {isRowModeEnabled && (
                    <>
                      <button
                        onClick={() => {
                          onNextRow?.();
                          setIsActionMenuOpen(false);
                        }}
                        className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded whitespace-nowrap"
                      >
                        <div className="flex items-center space-x-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                          <span>Next Array Item</span>
                        </div>
                        <span className="text-xs text-gray-500">⇧ →</span>
                      </button>
                      <button
                        onClick={() => {
                          onPrevRow?.();
                          setIsActionMenuOpen(false);
                        }}
                        className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded whitespace-nowrap"
                      >
                        <div className="flex items-center space-x-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="15 18 9 12 15 6"></polyline>
                          </svg>
                          <span>Previous Array Item</span>
                        </div>
                        <span className="text-xs text-gray-500">⇧ ←</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Editor */}
      <div 
        className={`flex-1 relative ${isDragOver ? 'ring-2 ring-green-500 ring-inset' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Contextual Help Panel */}
        {showContextualHelp && (
          <div className="absolute right-0 top-0 z-10 p-2">
            <ContextualHelp
              context="jq-query"
              position="right"
              onClose={() => setShowContextualHelp(false)}
            />
          </div>
        )}
        
        {/* Help Button */}
        <button
          onClick={() => setShowContextualHelp(!showContextualHelp)}
          className={`absolute right-3 top-3 z-20 p-1.5 rounded-full transition-colors ${
            showContextualHelp ? 'bg-theme-button-primary-bg text-theme-button-primary-text' : 'bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover text-theme-text-primary'
          }`}
          title="Toggle jq Help"
          aria-label="Toggle jq Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <Editor
          height="100%"
          language="jq"
          theme={`jq-${document.documentElement.classList.contains('theme-light') ? 'light' : 'dark'}`}
          value={previewJqQuery || value}
          onChange={(val) => onChange(val || '')}
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
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
              showFields: true
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            bracketPairColorization: { enabled: true },
            matchBrackets: 'always',
            folding: true,
            foldingStrategy: 'indentation'
          }}
        />
      </div>

      {/* Drop Zone Indicator */}
      <div className={`border-b px-3 py-1 text-xs transition-colors ${
          isDragOver
              ? 'bg-theme-notification-success-bg border-theme-notification-success-border text-theme-notification-success-text'
              : 'bg-theme-notification-info-bg border-theme-notification-info-border text-theme-notification-info-text'
      }`}>
        <div className="flex items-center space-x-2">
          <FileText className="w-3 h-3" />
          <span>{isDragOver ? 'Drop here to insert jq selector' : 'Drop JSON keys here to insert jq selectors'}</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-theme-bg-primary border-t border-theme-border-primary px-3 py-1 flex items-center justify-between text-xs text-theme-text-secondary">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Always visible on all screen sizes */}
          <span>jq</span>
          
          {/* Cursor position - simplified on small screens */}
          <span className="inline sm:hidden">L:{cursorPosition.line}</span>
          <span className="hidden sm:inline">Line {cursorPosition.line}, Column {cursorPosition.column}</span>
          
          {/* Only visible on medium screens and up */}
          <span className="hidden md:inline">{value.length} characters</span>
          
          {/* Only visible on small screens and up */}
          <span className="hidden sm:inline">{value.split('\n').length} lines</span>
          
          {/* Row Mode indicator - always visible but styled differently based on screen size */}
          {isRowModeEnabled && (
            <span className="bg-theme-notification-info-bg text-theme-notification-info-text px-2 py-0.5 rounded">
              <span className="inline sm:hidden">Row</span>
              <span className="hidden sm:inline">Row Mode Active</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Version navigator moved to header */}
        </div>
      </div>
      
      {/* Desired Output Modal */}
      <DesiredOutputModal
        isOpen={showDesiredOutputModal}
        onClose={() => setShowDesiredOutputModal(false)}
        inputJson={inputJson}
        onGenerateJq={handleGenerateJq}
        isGenerating={isGeneratingJq}
        generationError={generationError}
        llmResponse={llmResponse}
        generatedJq={generatedJq}
        isJqValid={isJqValid}
        conversationHistory={conversationHistory}
      />
    </div>
  );
}