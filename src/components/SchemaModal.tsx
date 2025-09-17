import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, FileJson, Link, FileCode, Info } from 'lucide-react';
import { getAvailableSchemas } from '../utils/sampleSchemas';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPredefinedSchema: (schemaName: string) => void;
  onApplyCustomSchema: (schemaText: string) => void;
  onApplySchemaUrl: (url: string) => void;
  selectedSchemaType: 'none' | 'predefined' | 'url' | 'custom';
  selectedPredefinedSchema: string | null;
  schemaUrl: string;
  schemaText: string;
  isLoading: boolean;
  error: string | null;
  schemaValidationEnabled?: boolean;
  onToggleSchemaValidation?: () => void;
  activeSchemaContent?: object | null;
}

export function SchemaModal({
  isOpen,
  onClose,
  onApplyPredefinedSchema,
  onApplyCustomSchema,
  onApplySchemaUrl,
  selectedSchemaType,
  selectedPredefinedSchema,
  schemaUrl,
  schemaText,
  isLoading,
  error,
  schemaValidationEnabled = true,
  onToggleSchemaValidation,
  activeSchemaContent = null
}: SchemaModalProps) {
  const [activeTab, setActiveTab] = useState<'predefined' | 'url' | 'custom'>(
    selectedSchemaType === 'none' ? 'predefined' : selectedSchemaType
  );
  const [localSchemaUrl, setLocalSchemaUrl] = useState(schemaUrl);
  const [localSchemaText, setLocalSchemaText] = useState(schemaText);
  const [localPredefinedSchema, setLocalPredefinedSchema] = useState(selectedPredefinedSchema);

  // Reset local state when the modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSchemaUrl(schemaUrl);
      setLocalSchemaText(schemaText);
      setLocalPredefinedSchema(selectedPredefinedSchema);
      setActiveTab(selectedSchemaType === 'none' ? 'predefined' : selectedSchemaType);
    }
  }, [isOpen, schemaUrl, schemaText, selectedPredefinedSchema, selectedSchemaType]);

  if (!isOpen) return null;

  const handleApply = () => {
    switch (activeTab) {
      case 'predefined':
        if (localPredefinedSchema) {
          onApplyPredefinedSchema(localPredefinedSchema);
        }
        break;
      case 'url':
        if (localSchemaUrl.trim()) {
          onApplySchemaUrl(localSchemaUrl);
        }
        break;
      case 'custom':
        if (localSchemaText.trim()) {
          onApplyCustomSchema(localSchemaText);
        }
        break;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header with validation toggle */}
        <div className="px-4 py-3 border-b border-theme-border-primary">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium">JSON Schema</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-theme-bg-secondary rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Compact validation toggle */}
          {onToggleSchemaValidation && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-theme-text-secondary">
                {schemaValidationEnabled 
                  ? "Validation enabled" 
                  : "Validation disabled"}
              </span>
              <button 
                onClick={onToggleSchemaValidation}
                className={`w-10 h-5 rounded-full relative ${schemaValidationEnabled ? 'bg-theme-button-success-bg' : 'bg-theme-button-secondary-bg'}`}
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transform transition-transform ${schemaValidationEnabled ? 'translate-x-5' : ''}`}
                ></span>
              </button>
            </div>
          )}
        </div>

        {/* Error message with guidance */}
        {error && (
          <div className="px-4 pt-2">
            <div className="p-3 bg-theme-notification-error-bg border border-theme-notification-error-border rounded-md text-theme-notification-error-text text-xs flex items-start">
              <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error loading schema</p>
                <p className="mt-1">{error}</p>
                
                {/* Show specific guidance for CORS errors */}
                {error.includes('CORS') && (
                  <div className="mt-2 p-2 bg-theme-bg-primary rounded border border-theme-border-secondary">
                    <p className="font-medium">How to resolve CORS issues:</p>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      <li>Try one of the quick-option schemas which are more likely to work</li>
                      <li>Download the schema file and use the Custom tab instead</li>
                      <li>Use a schema from a CORS-enabled source</li>
                    </ul>
                  </div>
                )}
                
                {/* Show specific guidance for network errors */}
                {error.includes('Network error') && !error.includes('CORS') && (
                  <div className="mt-2 p-2 bg-theme-bg-primary rounded border border-theme-border-secondary">
                    <p className="font-medium">How to resolve network issues:</p>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      <li>Check your internet connection</li>
                      <li>Verify that the URL is correct and accessible</li>
                      <li>Try using a different schema URL</li>
                    </ul>
                  </div>
                )}
                
                {/* Show specific guidance for timeout errors */}
                {error.includes('timed out') && (
                  <div className="mt-2 p-2 bg-theme-bg-primary rounded border border-theme-border-secondary">
                    <p className="font-medium">How to resolve timeout issues:</p>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      <li>The server might be slow or unreachable</li>
                      <li>Try again later or use a different schema URL</li>
                      <li>Download the schema file and use the Custom tab instead</li>
                    </ul>
                  </div>
                )}
                
                {/* Show specific guidance for schema reference loading errors */}
                {(error.includes('reference') || error.includes('schema request service') || error.includes('Failed to fetch')) && (
                  <div className="mt-2 p-2 bg-theme-bg-primary rounded border border-theme-border-secondary">
                    <p className="font-medium">How to resolve schema reference issues:</p>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      <li>The schema contains references to other schemas that couldn't be loaded</li>
                      <li>Try using a self-contained schema without external references</li>
                      <li>Download the complete schema with all its references and use the Custom tab</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-theme-border-primary px-4 mt-1">
          <button
            className={`px-3 py-2 font-medium text-sm ${
              activeTab === 'predefined'
                ? 'border-b-2 border-theme-text-accent text-theme-text-accent'
                : 'text-theme-text-secondary hover:text-theme-text-primary'
            }`}
            onClick={() => setActiveTab('predefined')}
          >
            <div className="flex items-center space-x-1">
              <FileJson className="w-4 h-4" />
              <span>Predefined</span>
            </div>
          </button>
          <button
            className={`px-3 py-2 font-medium text-sm ${
              activeTab === 'url'
                ? 'border-b-2 border-theme-text-accent text-theme-text-accent'
                : 'text-theme-text-secondary hover:text-theme-text-primary'
            }`}
            onClick={() => setActiveTab('url')}
          >
            <div className="flex items-center space-x-1">
              <Link className="w-4 h-4" />
              <span>URL</span>
            </div>
          </button>
          <button
            className={`px-3 py-2 font-medium text-sm ${
              activeTab === 'custom'
                ? 'border-b-2 border-theme-text-accent text-theme-text-accent'
                : 'text-theme-text-secondary hover:text-theme-text-primary'
            }`}
            onClick={() => setActiveTab('custom')}
          >
            <div className="flex items-center space-x-1">
              <FileCode className="w-4 h-4" />
              <span>Custom</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 overflow-auto">
          {/* Current schema indicator */}
          {selectedSchemaType !== 'none' && (
            <div className="mb-3 text-xs text-theme-text-secondary flex items-center">
              <Info className="w-3 h-3 mr-1" />
              <span>
                {selectedSchemaType === 'predefined' && selectedPredefinedSchema 
                  ? `Using: ${selectedPredefinedSchema}` 
                  : selectedSchemaType === 'url' 
                    ? `Using URL: ${schemaUrl.length > 30 ? schemaUrl.substring(0, 30) + '...' : schemaUrl}` 
                    : 'Using custom schema'}
              </span>
            </div>
          )}
          
          {/* Active Schema Content Display */}
          {activeSchemaContent && selectedSchemaType !== 'none' && (
            <div className="mb-4 border border-theme-border-secondary rounded-md overflow-hidden">
              <div className="bg-theme-bg-secondary px-3 py-2 border-b border-theme-border-secondary">
                <h3 className="text-sm font-medium">Active Schema</h3>
              </div>
              <pre className="p-3 text-xs font-mono bg-theme-bg-tertiary overflow-auto max-h-60">
                {JSON.stringify(activeSchemaContent, null, 2)}
              </pre>
            </div>
          )}

          {/* Predefined schemas tab */}
          {activeTab === 'predefined' && (
            <div>
              <div className="space-y-2">
                <select
                  value={localPredefinedSchema || ''}
                  onChange={(e) => setLocalPredefinedSchema(e.target.value || null)}
                  className="w-full p-2 bg-theme-bg-secondary border border-theme-border-secondary rounded text-sm"
                >
                  <option value="">Select a schema...</option>
                  {getAvailableSchemas().map((schema) => (
                    <option key={schema} value={schema}>
                      {schema.charAt(0).toUpperCase() + schema.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-theme-text-secondary">
                  Select from a library of common JSON schemas for validating standard formats.
                </p>
              </div>
            </div>
          )}

          {/* URL tab */}
          {activeTab === 'url' && (
            <div>
              <div className="space-y-2">
                <input
                  type="url"
                  value={localSchemaUrl}
                  onChange={(e) => setLocalSchemaUrl(e.target.value)}
                  placeholder="https://example.com/schema.json"
                  className="w-full p-2 bg-theme-bg-secondary border border-theme-border-secondary rounded text-sm"
                />
                <div className="mt-2">
                  <p className="text-xs text-theme-text-secondary mb-1">
                    Quick options:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setLocalSchemaUrl("https://json-schema.org/draft/2020-12/schema")}
                      className="px-2 py-1 text-xs bg-theme-bg-tertiary hover:bg-theme-button-secondary-hover text-theme-text-secondary rounded border border-theme-border-secondary transition-colors"
                    >
                      JSON Schema 2020-12
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalSchemaUrl("https://json-schema.org/draft/2019-09/schema")}
                      className="px-2 py-1 text-xs bg-theme-bg-tertiary hover:bg-theme-button-secondary-hover text-theme-text-secondary rounded border border-theme-border-secondary transition-colors"
                    >
                      JSON Schema 2019-09
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalSchemaUrl("https://json-schema.org/draft-07/schema")}
                      className="px-2 py-1 text-xs bg-theme-bg-tertiary hover:bg-theme-button-secondary-hover text-theme-text-secondary rounded border border-theme-border-secondary transition-colors"
                    >
                      JSON Schema Draft-07
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalSchemaUrl("https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/schemas/v3.1/schema.json")}
                      className="px-2 py-1 text-xs bg-theme-bg-tertiary hover:bg-theme-button-secondary-hover text-theme-text-secondary rounded border border-theme-border-secondary transition-colors"
                    >
                      OpenAPI v3.1
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalSchemaUrl("https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/package.json")}
                      className="px-2 py-1 text-xs bg-theme-bg-tertiary hover:bg-theme-button-secondary-hover text-theme-text-secondary rounded border border-theme-border-secondary transition-colors"
                    >
                      package.json
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalSchemaUrl("https://geojson.org/schema/FeatureCollection.json")}
                      className="px-2 py-1 text-xs bg-theme-bg-tertiary hover:bg-theme-button-secondary-hover text-theme-text-secondary rounded border border-theme-border-secondary transition-colors"
                    >
                      GeoJSON
                    </button>
                  </div>
                </div>
                <p className="text-xs text-theme-text-secondary mt-2">
                  Enter a URL to a JSON Schema file. The schema will be fetched and applied.
                </p>
              </div>
            </div>
          )}

          {/* Custom schema tab */}
          {activeTab === 'custom' && (
            <div>
              <div className="space-y-2">
                <textarea
                  value={localSchemaText}
                  onChange={(e) => setLocalSchemaText(e.target.value)}
                  placeholder='{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" }\n  }\n}'
                  className="w-full h-48 p-2 bg-theme-bg-secondary border border-theme-border-secondary rounded text-sm font-mono"
                />
                <p className="text-xs text-theme-text-secondary">
                  Enter a custom JSON Schema to validate your JSON against.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-theme-border-primary flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover text-theme-text-primary rounded text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isLoading || (activeTab === 'predefined' && !localPredefinedSchema) || 
                    (activeTab === 'url' && !localSchemaUrl.trim()) || 
                    (activeTab === 'custom' && !localSchemaText.trim())}
            className="px-3 py-1.5 bg-theme-button-primary-bg hover:bg-theme-button-primary-hover text-theme-button-primary-text rounded text-sm transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                <span>Apply</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}