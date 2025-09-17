import React, { useState, useEffect } from 'react';
import { HelpCircle, X, ChevronRight, ChevronDown } from 'lucide-react';

interface ContextualHelpProps {
  context: 'jq-query' | 'row-mode' | 'array-extraction' | 'version-history';
  position?: 'right' | 'bottom';
  className?: string;
  onClose?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function ContextualHelp({ 
  context, 
  position = 'right',
  className = '',
  onClose,
  autoHide = false,
  autoHideDelay = 10000
}: ContextualHelpProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onClose]);

  const toggleSection = (section: string) => {
    if (expandedSections.includes(section)) {
      setExpandedSections(expandedSections.filter(s => s !== section));
    } else {
      setExpandedSections([...expandedSections, section]);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const getContent = () => {
    switch (context) {
      case 'jq-query':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-theme-text-accent">Writing jq Queries</h3>
            
            <div className="space-y-2">
              <div className="border-b border-theme-border-primary pb-1">
                <button 
                  className="flex items-center justify-between w-full text-left text-xs font-medium"
                  onClick={() => toggleSection('basics')}
                >
                  <span>Basic Syntax</span>
                  {expandedSections.includes('basics') ? 
                    <ChevronDown className="w-3 h-3" /> : 
                    <ChevronRight className="w-3 h-3" />
                  }
                </button>
                
                {expandedSections.includes('basics') && (
                  <div className="mt-1 pl-2 text-xs text-theme-text-primary space-y-1">
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">.</code> - Identity operator (returns input unchanged)</p>
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">.fieldname</code> - Access a field</p>
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">.[]</code> - Iterate over array elements</p>
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">|</code> - Pipe operator (chain operations)</p>
                  </div>
                )}
              </div>
              
              <div className="border-b border-theme-border-primary pb-1">
                <button 
                  className="flex items-center justify-between w-full text-left text-xs font-medium"
                  onClick={() => toggleSection('filtering')}
                >
                  <span>Filtering Data</span>
                  {expandedSections.includes('filtering') ? 
                    <ChevronDown className="w-3 h-3" /> : 
                    <ChevronRight className="w-3 h-3" />
                  }
                </button>
                
                {expandedSections.includes('filtering') && (
                  <div className="mt-1 pl-2 text-xs text-theme-text-primary space-y-1">
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">select(.field == "value")</code> - Filter by condition</p>
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">map(select(.field &gt; 10))</code> - Filter array items</p>
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">select(.field | contains("text"))</code> - Check if field contains text</p>
                  </div>
                )}
              </div>
              
              <div className="border-b border-theme-border-primary pb-1">
                <button 
                  className="flex items-center justify-between w-full text-left text-xs font-medium"
                  onClick={() => toggleSection('transforming')}
                >
                  <span>Transforming Data</span>
                  {expandedSections.includes('transforming') ? 
                    <ChevronDown className="w-3 h-3" /> : 
                    <ChevronRight className="w-3 h-3" />
                  }
                </button>
                
                {expandedSections.includes('transforming') && (
                  <div className="mt-1 pl-2 text-xs text-theme-text-primary space-y-1">
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">{"{name: .name, age: .age}"}</code> - Create new object</p>
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">map(.field)</code> - Extract field from each array item</p>
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">sort_by(.field)</code> - Sort array by field</p>
                    <p><code className="bg-theme-bg-tertiary px-1 rounded">group_by(.field)</code> - Group array items by field</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-xs text-theme-text-secondary">
              Press <code className="bg-theme-bg-tertiary px-1 rounded">Ctrl+Space</code> for suggestions while typing
            </div>
          </div>
        );
        
      case 'row-mode':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-theme-text-accent">Working with Row Mode</h3>
            
            <div className="space-y-2 text-xs text-theme-text-primary">
              <p>Row Mode lets you work with one array item at a time, which is useful for large arrays.</p>
              
              <div className="bg-theme-bg-secondary p-2 rounded">
                <p className="font-medium text-theme-text-primary">Navigation:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Use the arrow buttons or <code className="bg-theme-bg-tertiary px-1 rounded">Shift+Left/Right</code> to navigate between items</li>
                  <li>Use the index input to jump to a specific item</li>
                  <li>Press <code className="bg-theme-bg-tertiary px-1 rounded">A</code> to exit Row Mode and show all items</li>
                </ul>
              </div>
              
              <div className="bg-theme-bg-secondary p-2 rounded">
                <p className="font-medium text-theme-text-primary">Editing:</p>
                <p className="mt-1">Changes made to the current item will be applied to the full array when you exit Row Mode.</p>
              </div>
            </div>
          </div>
        );
        
      case 'array-extraction':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-theme-text-accent">Array Extraction</h3>
            
            <div className="space-y-2 text-xs text-theme-text-primary">
              <p>The Extract Array feature helps you work with nested arrays more easily.</p>
              
              <div className="bg-theme-bg-secondary p-2 rounded">
                <p className="font-medium text-theme-text-primary">When to use:</p>
                <p className="mt-1">Use this when your JSON has a structure like:</p>
                <pre className="bg-theme-bg-primary p-1 mt-1 rounded overflow-x-auto">
                  {`{
  "data": [1, 2, 3, 4]
}`}
                </pre>
                <p className="mt-1">And you want to work directly with the array <code>[1, 2, 3, 4]</code></p>
              </div>
              
              <div className="bg-theme-bg-secondary p-2 rounded">
                <p className="font-medium text-theme-text-primary">How to use:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Click the <span className="text-theme-text-success">Extract Array</span> button when it appears</li>
                  <li>Or press the <code className="bg-theme-bg-tertiary px-1 rounded">E</code> key</li>
                </ul>
              </div>
            </div>
          </div>
        );
        
      case 'version-history':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-theme-text-accent">Version History</h3>
            
            <div className="space-y-2 text-xs text-theme-text-primary">
              <p>Version History helps you save and restore your work.</p>
              
              <div className="bg-theme-bg-secondary p-2 rounded">
                <p className="font-medium text-theme-text-primary">Saving Versions:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Click <span className="text-theme-text-success">Save</span> in the header or press <code className="bg-theme-bg-tertiary px-1 rounded">Ctrl+S</code></li>
                  <li>Each save creates a new version in history</li>
                </ul>
              </div>
              
              <div className="bg-theme-bg-secondary p-2 rounded">
                <p className="font-medium text-theme-text-primary">Restoring Versions:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Click <span className="text-theme-text-accent">History</span> in the header to open Version History</li>
                  <li>Click <span className="text-theme-text-accent">Load All</span> to restore both JSON and jq query</li>
                  <li>Click <span className="text-theme-text-success">Load jq Only</span> to restore just the jq query</li>
                </ul>
              </div>
              
              <div className="bg-theme-bg-secondary p-2 rounded">
                <p className="font-medium text-theme-text-primary">Quick Navigation:</p>
                <p className="mt-1">Click <span className="text-theme-text-accent">Browse Versions</span> in the jq Editor footer to quickly scroll through your saved jq queries.</p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-lg overflow-hidden ${className} ${
      position === 'right' ? 'w-64' : 'w-full'
    }`}>
      <div className="flex items-center justify-between p-2 bg-theme-bg-secondary border-b border-theme-border-primary">
        <div className="flex items-center space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-theme-text-accent" />
          <span className="text-xs font-medium">Contextual Help</span>
        </div>
        <button 
          onClick={handleClose}
          className="p-0.5 hover:bg-theme-bg-tertiary rounded-sm transition-colors"
          aria-label="Close help"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="p-3">
        {getContent()}
      </div>
    </div>
  );
}