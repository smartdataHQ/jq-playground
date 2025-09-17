import React, {useRef, useEffect, useState} from 'react';
import Editor from '@monaco-editor/react';
import {AlertCircle, Copy, Download, Eye, FileJson, Settings, Save, FileCode, Link} from 'lucide-react';
import { Tooltip } from './Tooltip';
import {setupOutputTheme, enforceTheme} from '../utils/monacoTheme';
import { fetchSchemaFromUrl, parseSchemaString, isValidJsonSchema } from '../utils/schemaLoader';
import { getSchemaByName, getAvailableSchemas, getSampleData, loadSchemaByName } from '../utils/sampleSchemas';
import { SchemaModal } from './SchemaModal';

interface JsonOutputProps {
    value: string;
    error: string;
    isJson?: boolean;
    
    // New props for consolidated header
    onCopy?: () => void; // Callback for Copy button
    onDownload?: () => void; // Callback for Download button
    onSave?: () => void; // Callback for Save button
    
    // JSON Schema validation
    jsonSchema?: object | null; // The JSON schema object for validation
}

export function JsonOutput({
    value, 
    error, 
    isJson = true,
    // New props for consolidated header
    onCopy,
    onDownload,
    onSave,
    // JSON Schema validation
    jsonSchema
}: JsonOutputProps) {
    // State for action menu
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const actionMenuRef = useRef<HTMLDivElement>(null);
    
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
    const editorRef = useRef<any>(null);

    // Ensure theme is applied when language changes
    useEffect(() => {
        if (editorRef.current) {
            // Force theme reapplication when switching between JSON and plain text
            setTimeout(() => {
                enforceTheme(); // Will use current app theme
            }, 100);
        }
    }, [isJson]);
    
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
            console.log('JsonOutput: Schema loaded successfully from URL:', url);
        } catch (error) {
            console.error('JsonOutput: Error loading schema from URL:', error);
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
        console.log('JsonOutput: Applying schema to editor:', schema ? 'valid schema object' : 'null schema');
        
        if (!isJson) {
            console.log('JsonOutput: Not applying schema because output is not JSON');
            return;
        }
        
        if (!editorRef.current) {
            console.warn('JsonOutput: Editor reference is not available');
            return;
        }
        
        const monaco = window.monaco;
        if (!monaco || !monaco.languages || !monaco.languages.json) {
            console.error('JsonOutput: Monaco editor or languages.json not available');
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
                console.log('JsonOutput: Schema validation is enabled, adding schema to diagnostics options');
                
                // Extract the $id from the schema if available, otherwise use a default URI
                const schemaObj = schema as Record<string, unknown>;
                const schemaId = schemaObj.$id || `${window.location.origin}/schema-for-output-json.json`;
                
                console.log(`JsonOutput: Using schema URI: ${schemaId}`);
                
                diagnosticsOptions.schemas = [
                    {
                        uri: schemaId,
                        fileMatch: ["*"],
                        schema: schema
                    }
                ];
            } else {
                console.log('JsonOutput: Schema validation is disabled or schema is null');
            }
            
            console.log('JsonOutput: Setting diagnostics options on Monaco editor');
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions(diagnosticsOptions);
            console.log('JsonOutput: Schema successfully applied to editor');
        } catch (error) {
            console.error('JsonOutput: Error applying schema to editor:', error);
        }
    };
    
    // Effect to apply schema when validation is toggled
    useEffect(() => {
        applySchemaToEditor(customSchema);
    }, [schemaValidationEnabled, isJson]);
    
    // Initialize with jsonSchema prop if provided (for backward compatibility)
    useEffect(() => {
        if (jsonSchema) {
            setCustomSchema(jsonSchema);
            setSchemaValidationEnabled(true);
            setSchemaSource('predefined');
        }
    }, [jsonSchema]);

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;

        // Setup consistent output theme
        setupOutputTheme(monaco);
        
        // Configure JSON validation if it's JSON output
        if (isJson && monaco && typeof monaco === 'object' && 'languages' in monaco && 
            monaco.languages && typeof monaco.languages === 'object' && 
            'json' in monaco.languages && monaco.languages.json) {
            
            // Create the diagnostics options
            const diagnosticsOptions = {
                validate: true,
                allowComments: false,
                schemas: [],
                enableSchemaRequest: true
            };
            
            // Add schema if provided and validation is enabled
            if (jsonSchema && schemaValidationEnabled) {
                diagnosticsOptions.schemas = [
                    {
                        uri: "http://myserver/schema-for-output-json.json", // A unique URI for this schema
                        fileMatch: ["*"], // Apply to all JSON documents in the editor
                        schema: jsonSchema // The actual schema object
                    }
                ];
            }
            
            // Apply the configuration
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions(diagnosticsOptions);
        }
    };

    const copyOutput = () => {
        navigator.clipboard.writeText(value);
    };

    const downloadOutput = () => {
        const mimeType = isJson ? 'application/json' : 'text/plain';
        const extension = isJson ? 'json' : 'txt';
        const blob = new Blob([value], {type: mimeType});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jq-output.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatOutput = () => {
        if (editorRef.current && value) {
            editorRef.current.getAction('editor.action.formatDocument').run();
        }
    };

    if (error) {
        return (
            <div className="flex-1 flex flex-col">
                {/* Main header - always visible */}
                <div className="bg-theme-bg-secondary border-b border-theme-border-primary px-3 py-2 flex items-center justify-between">
                    {/* Left side: Title and info */}
                    <div className="flex items-center space-x-3">
                        {/* Title with icon */}
                        <div className="flex items-center space-x-2">
                            <FileJson className="w-5 h-5 text-theme-text-accent" />
                            <h2 className="text-sm font-medium">Output</h2>
                        </div>
                        
                        <span className="text-xs bg-theme-notification-error-bg text-theme-notification-error-text px-2 py-0.5 rounded">
                            Error
                        </span>
                    </div>

                    {/* Right side: Actions and controls */}
                    <div className="flex items-center space-x-2">
                        {/* Save button - icon only with tooltip */}
                        {onSave && (
                            <Tooltip content="Save (⌘ S)" position="bottom">
                                <button
                                    onClick={onSave}
                                    className="p-1.5 bg-theme-button-success-bg hover:bg-theme-button-success-hover rounded transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>
                
                {/* Error Content */}
                <div className="flex-1 bg-theme-bg-primary p-4">
                    <div className="bg-theme-notification-error-bg border border-theme-notification-error-border rounded-lg p-4">
                        <div className="text-theme-notification-error-text text-sm font-mono whitespace-pre-wrap leading-relaxed">
                            {error}
                        </div>
                    </div>

                    {/* Error Help */}
                    <div className="mt-4 p-3 bg-theme-bg-secondary rounded-lg border border-theme-border-primary">
                        <div className="text-xs text-theme-text-secondary mb-2">Common jq syntax tips:</div>
                        <ul className="text-xs text-theme-text-secondary space-y-1">
                            <li>• Use <code className="bg-theme-bg-tertiary px-1 rounded">.field</code> to access object
                                properties
                            </li>
                            <li>• Use <code className="bg-theme-bg-tertiary px-1 rounded">.[]</code> to iterate over arrays</li>
                            <li>• Use <code className="bg-theme-bg-tertiary px-1 rounded">|</code> to pipe results between
                                operations
                            </li>
                            <li>• Use <code className="bg-theme-bg-tertiary px-1 rounded">select(.field == "value")</code> to
                                filter
                            </li>
                        </ul>
                    </div>
                </div>
                
                {/* Status Bar */}
                <div className="bg-theme-bg-primary border-t border-theme-border-primary px-3 py-1 flex items-center justify-between text-xs text-theme-text-secondary">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <span>Error</span>
                        <span className="hidden sm:inline">jq syntax error</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-3 h-3 text-theme-text-error" />
                        <span className="hidden sm:inline">Check your query syntax</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!value) {
        return (
            <div className="flex-1 flex flex-col">
                {/* Main header - always visible */}
                <div className="bg-theme-bg-secondary border-b border-theme-border-primary px-3 py-2 flex items-center justify-between">
                    {/* Left side: Title and info */}
                    <div className="flex items-center space-x-3">
                        {/* Title with icon */}
                        <div className="flex items-center space-x-2">
                            <FileJson className="w-5 h-5 text-theme-text-accent" />
                            <h2 className="text-sm font-medium">Output</h2>
                        </div>
                    </div>

                    {/* Right side: Actions and controls */}
                    <div className="flex items-center space-x-2">
                        {/* Save button - icon only with tooltip */}
                        {onSave && (
                            <Tooltip content="Save (⌘ S)" position="bottom">
                                <button
                                    onClick={onSave}
                                    className="p-1.5 bg-theme-button-success-bg hover:bg-theme-button-success-hover rounded transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>
                
                {/* Empty State */}
                <div className="flex-1 bg-theme-bg-primary flex items-center justify-center">
                    <div className="text-center text-theme-text-secondary">
                        <Eye className="w-12 h-12 mx-auto mb-4 text-theme-text-secondary"/>
                        <div className="text-lg mb-2">No output yet</div>
                        <div className="text-sm">Enter a jq query to see transformation results</div>
                    </div>
                </div>
                
                {/* Status Bar */}
                <div className="bg-theme-bg-primary border-t border-theme-border-primary px-3 py-1 flex items-center justify-between text-xs text-theme-text-secondary">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <span>Waiting</span>
                        <span className="hidden sm:inline">for input</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="hidden sm:inline">Enter a jq query to see results</span>
                    </div>
                </div>
            </div>
        );
    }

    const lineCount = value.split('\n').length;
    const charCount = value.length;

    return (
        <div className="flex-1 flex flex-col">
            {/* Main header - always visible */}
            <div className="bg-theme-bg-secondary border-b border-theme-border-primary px-3 py-2 flex items-center justify-between">
                {/* Left side: Title and info */}
                <div className="flex items-center space-x-3">
                    {/* Title with icon */}
                    <div className="flex items-center space-x-2">
                        <FileJson className="w-5 h-5 text-theme-text-accent" />
                        <h2 className="text-sm font-medium">Output</h2>
                    </div>
                    
                    <span className="text-xs bg-theme-notification-success-bg text-theme-notification-success-text px-2 py-0.5 rounded">
                        {isJson ? 'JSON' : 'Text'}
                    </span>
                    
                    {/* Schema Validation Indicator and Button */}
                    {isJson && (
                        schemaValidationEnabled && customSchema ? (
                            <Tooltip
                                content="JSON Schema validation is enabled. Click to configure."
                                position="bottom"
                            >
                                <button 
                                    onClick={() => setShowSchemaModal(true)}
                                    className="flex items-center space-x-1 px-2 py-0.5 rounded text-xs bg-theme-notification-success-bg text-theme-notification-success-text hover:bg-theme-notification-success-hover"
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
                                    className="flex items-center space-x-1 px-2 py-0.5 rounded text-xs bg-theme-button-secondary-bg text-theme-text-secondary hover:bg-theme-button-secondary-hover"
                                >
                                    <FileCode className="w-3 h-3" />
                                    <span>Schema</span>
                                </button>
                            </Tooltip>
                        )
                    )}
                </div>
                
                {/* Right side: Actions and controls */}
                <div className="flex items-center space-x-2">
                    {/* Action Menu Button - Always visible in main header */}
                    <div className="relative" ref={actionMenuRef}>
                        <button
                            onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                            className="flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors bg-theme-button-secondary-bg text-theme-text-primary hover:bg-theme-button-secondary-hover"
                            aria-label="Open Output Actions Menu"
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
                                            if (onCopy) onCopy();
                                            else copyOutput();
                                            setIsActionMenuOpen(false);
                                        }}
                                        className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Copy className="w-3 h-3" />
                                            <span>Copy Output</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (onDownload) onDownload();
                                            else downloadOutput();
                                            setIsActionMenuOpen(false);
                                        }}
                                        className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Download className="w-3 h-3" />
                                            <span>Download Output</span>
                                        </div>
                                    </button>
                                    {onSave && (
                                        <button
                                            onClick={() => {
                                                onSave();
                                                setIsActionMenuOpen(false);
                                            }}
                                            className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <Save className="w-3 h-3" />
                                                <span>Save</span>
                                            </div>
                                        </button>
                                    )}
                                    
                                    {/* Schema Validation Section - Only show if it's JSON output */}
                                    {isJson && (
                                        <>
                                            <div className="px-3 py-1 text-xs text-theme-text-secondary font-medium mt-2">Schema Validation</div>
                                            {customSchema ? (
                                                <>
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
                                                    <button
                                                        onClick={() => {
                                                            setShowSchemaModal(true);
                                                            setIsActionMenuOpen(false);
                                                        }}
                                                        className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <FileCode className="w-3 h-3" />
                                                            <span>Change Schema</span>
                                                        </div>
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setShowSchemaModal(true);
                                                        setIsActionMenuOpen(false);
                                                    }}
                                                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded whitespace-nowrap"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <FileCode className="w-3 h-3" />
                                                        <span>Configure Schema</span>
                                                    </div>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Editor */}
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={isJson ? "json" : "plaintext"}
                    theme={`output-${document.documentElement.classList.contains('theme-light') ? 'light' : 'dark'}`}
                    value={value}
                    onMount={handleEditorDidMount}
                    options={{
                        readOnly: true,
                        minimap: {enabled: false},
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        bracketPairColorization: {enabled: isJson},
                        matchBrackets: isJson ? 'always' : 'never',
                        folding: isJson,
                        foldingStrategy: isJson ? 'indentation' : undefined,
                        showFoldingControls: isJson ? 'always' : 'never',
                        contextmenu: true,
                        selectOnLineNumbers: true
                    }}
                />
            </div>
            
            {/* Status Bar */}
            <div className="bg-theme-bg-primary border-t border-theme-border-primary px-3 py-1 flex items-center justify-between text-xs text-theme-text-secondary">
                <div className="flex items-center space-x-2 sm:space-x-4">
                    {/* Always visible on all screen sizes */}
                    <span>{isJson ? 'JSON' : 'Text'}</span>
                    
                    {/* Only visible on small screens and up */}
                    <span className="hidden sm:inline">Read-only</span>
                    <span className="hidden sm:inline">{lineCount} lines</span>
                    
                    {/* Only visible on medium screens and up */}
                    <span className="hidden md:inline">{charCount} characters</span>
                </div>
                <div className="flex items-center space-x-2">
                    <FileJson className="w-3 h-3" />
                    <span className="hidden sm:inline">{isJson ? 'Formatted JSON output' : 'Plain text output'}</span>
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
}