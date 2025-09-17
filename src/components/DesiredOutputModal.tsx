import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { setupJsonTheme } from '../utils/monacoTheme';

interface DesiredOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputJson: string;
  onGenerateJq: (
    desiredOutput: string, 
    extraPrompt?: string, 
    continueConversation?: boolean, 
    breakConversation?: boolean
  ) => void;
  isGenerating?: boolean;
  generationError?: string | null;
  llmResponse?: string | null;
  generatedJq?: string | null;
  isJqValid?: boolean | null;
  conversationHistory?: Array<{
    llmResponse: string;
    generatedJq: string;
    isValid: boolean;
    error?: string;
  }>;
}

export function DesiredOutputModal({ 
  isOpen, 
  onClose, 
  inputJson,
  onGenerateJq,
  isGenerating: externalIsGenerating,
  generationError: externalGenerationError,
  llmResponse,
  generatedJq,
  isJqValid,
  conversationHistory = []
}: DesiredOutputModalProps) {
  const [desiredOutput, setDesiredOutput] = useState('');
  const [extraPrompt, setExtraPrompt] = useState('');
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const editorRef = useRef<unknown>(null);
  
  // Use external generation state if provided, otherwise use local state
  const isGenerating = externalIsGenerating !== undefined ? externalIsGenerating : localIsGenerating;
  
  // Combine local validation errors with external generation errors
  const error = externalGenerationError || localError;

  // Initialize with a formatted version of the input JSON when opened
  useEffect(() => {
    if (isOpen && inputJson && !desiredOutput) {
      try {
        // Try to parse and format the input JSON as a starting point
        const parsed = JSON.parse(inputJson);
        setDesiredOutput(JSON.stringify(parsed, null, 2));
      } catch {
        // If parsing fails, just leave it empty
        setDesiredOutput('');
      }
    }
  }, [isOpen, inputJson, desiredOutput]);

  const handleEditorChange = (value: string | undefined) => {
    setDesiredOutput(value || '');
    // Clear any previous errors when the user edits
    if (localError) setLocalError(null);
  };
  
  const handleEditorDidMount = (editor: unknown, monaco: unknown) => {
    editorRef.current = editor;
    
    // Setup consistent JSON theme
    setupJsonTheme(monaco);
  };

  const handleGenerateJq = async () => {
    // Validate JSON
    try {
      // Check if the desired output is valid JSON
      JSON.parse(desiredOutput);
      
      // If we get here, JSON is valid
      setLocalIsGenerating(true);
      setLocalError(null);
      
      // Call the parent component's handler with desired output and extra prompt
      onGenerateJq(desiredOutput, extraPrompt);
      
      // Note: We don't set localIsGenerating to false here because
      // the parent component will handle closing the modal or showing results
    } catch {
      // Invalid JSON
      setLocalError('Please enter valid JSON for the desired output');
      setLocalIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-theme-bg-secondary rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border-primary">
          <div className="flex items-center space-x-2">
            <Wand2 className="w-5 h-5 text-theme-text-accent" />
            <h2 className="text-xl font-semibold">Desired Output</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-theme-bg-tertiary rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 overflow-auto">
          <p className="text-sm text-theme-text-secondary mb-4">
            Enter the desired JSON output you want to achieve. The AI will generate a JQ query that transforms your input JSON into this desired output.
          </p>
          
          {/* Desired Output Editor */}
          <div className="flex-1 border border-theme-border-primary rounded-lg overflow-hidden mb-4">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={desiredOutput}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          </div>
          
          {/* Extra Prompt */}
          <div className="mb-4">
            <label htmlFor="extra-prompt" className="block text-sm font-medium text-theme-text-primary mb-2">
              Extra Prompt (Optional)
            </label>
            <textarea
              id="extra-prompt"
              className="w-full p-2 border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary"
              placeholder="Add any additional instructions for the AI here..."
              rows={3}
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
            />
          </div>
          
          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-theme-text-primary">Conversation History</h3>
                <span className="text-xs text-theme-text-secondary">{conversationHistory.length} attempts</span>
              </div>
              <div className="border border-theme-border-primary rounded-lg overflow-hidden max-h-32 overflow-y-auto">
                {conversationHistory.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-3 border-b border-theme-border-primary ${
                      index === conversationHistory.length - 1 ? 'bg-theme-bg-secondary' : 'bg-theme-bg-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Attempt {index + 1}</span>
                      {item.isValid ? (
                        <span className="text-xs bg-theme-notification-success-bg text-theme-notification-success-text px-2 py-0.5 rounded">
                          Valid
                        </span>
                      ) : (
                        <span className="text-xs bg-theme-notification-error-bg text-theme-notification-error-text px-2 py-0.5 rounded">
                          Invalid
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono bg-theme-bg-tertiary p-2 rounded mb-2 max-h-20 overflow-auto">
                      {item.generatedJq}
                    </div>
                    {item.error && (
                      <div className="text-xs text-theme-notification-error-text">
                        Error: {item.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* LLM Response */}
          {/* eslint-disable-next-line no-constant-binary-expression */}
          {llmResponse && false && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-theme-text-primary mb-2">LLM Response</h3>
              <div className="p-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg max-h-40 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap">{llmResponse}</pre>
              </div>
            </div>
          )}
          
          {/* Generated JQ */}
          {generatedJq && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                {isJqValid === false && (
                  <span className="text-xs bg-theme-notification-error-bg text-theme-notification-error-text px-2 py-0.5 rounded">
                    Invalid JQ
                  </span>
                )}
                {isJqValid === true && (
                  <span className="text-xs bg-theme-notification-success-bg text-theme-notification-success-text px-2 py-0.5 rounded">
                    Valid JQ
                  </span>
                )}
              </div>

              {/* Continue Conversation Controls - only show if JQ is invalid */}
              {isJqValid === false && !isGenerating && (
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => onGenerateJq(desiredOutput, extraPrompt, false, true)}
                    className="px-3 py-1 text-xs bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded transition-colors"
                  >
                    Break Conversation
                  </button>
                  <button
                    onClick={() => onGenerateJq(desiredOutput, extraPrompt, true, false)}
                    className="px-3 py-1 text-xs bg-theme-button-primary-bg hover:bg-theme-button-primary-hover rounded transition-colors flex items-center space-x-1"
                  >
                    <span>Continue with LLM</span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mt-3 p-3 bg-theme-notification-error-bg text-theme-notification-error-text rounded-lg">
              {error}
            </div>
          )}
          
          {/* Generation Progress */}
          {isGenerating && !error && (
            <div className="mt-3 p-3 bg-theme-notification-info-bg text-theme-notification-info-text rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin mr-2">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Generating the perfect JQ script...</p>
                  <p className="text-sm mt-1">The AI is analyzing your input and desired output to create an optimal JQ transformation.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded transition-colors"
              disabled={isGenerating}
            >
              {isGenerating ? 'Please wait...' : 'Cancel'}
            </button>
            <button
              onClick={handleGenerateJq}
              disabled={!desiredOutput.trim() || isGenerating}
              className="px-4 py-2 bg-theme-button-primary-bg hover:bg-theme-button-primary-hover rounded transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-t-transparent border-white rounded-full"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}