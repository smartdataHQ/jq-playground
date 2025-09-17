import React, { useState } from 'react';
import { X, ExternalLink, BookOpen, Code, HelpCircle } from 'lucide-react';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'examples' | 'shortcuts'>('basics');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-theme-bg-primary rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border-primary">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-theme-text-accent" />
            <h2 className="text-xl font-semibold">Help & Documentation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-theme-bg-tertiary rounded transition-colors"
            aria-label="Close help panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-theme-border-primary">
          <button
            onClick={() => setActiveTab('basics')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'basics' 
                ? 'border-b-2 border-theme-border-accent text-theme-text-accent' 
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary'
            }`}
          >
            jq Basics
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'examples' 
                ? 'border-b-2 border-theme-border-accent text-theme-text-accent' 
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary'
            }`}
          >
            Common Examples
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'shortcuts' 
                ? 'border-b-2 border-theme-border-accent text-theme-text-accent' 
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary'
            }`}
          >
            Keyboard Shortcuts
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'basics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">What is jq?</h3>
                <p className="text-theme-text-primary">
                  jq is a lightweight and flexible command-line JSON processor. It's like sed for JSON data – you can use it to slice, filter, map, and transform structured data.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Basic Syntax</h3>
                <div className="space-y-4">
                  <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-primary">
                    <h4 className="font-medium text-theme-text-accent mb-2">Identity: <code>.</code></h4>
                    <p className="text-sm text-theme-text-primary mb-2">
                      The simplest jq program is the identity operator <code>.</code>, which returns the input unchanged.
                    </p>
                    <div className="bg-theme-bg-primary p-3 rounded text-sm font-mono">
                      <div className="text-theme-text-success">Input: &#123; "name": "John", "age": 30 &#125;</div>
                      <div className="text-theme-text-accent">Query: .</div>
                      <div className="text-theme-text-accent">Output: &#123; "name": "John", "age": 30 &#125;</div>
                    </div>
                  </div>
                  
                  <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-primary">
                    <h4 className="font-medium text-theme-text-accent mb-2">Field Access: <code>.fieldname</code></h4>
                    <p className="text-sm text-theme-text-primary mb-2">
                      Access a specific field using dot notation.
                    </p>
                    <div className="bg-theme-bg-primary p-3 rounded text-sm font-mono">
                      <div className="text-theme-text-success">Input: &#123; "name": "John", "age": 30 &#125;</div>
                      <div className="text-theme-text-accent">Query: .name</div>
                      <div className="text-theme-text-accent">Output: "John"</div>
                    </div>
                  </div>
                  
                  <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-primary">
                    <h4 className="font-medium text-theme-text-accent mb-2">Array Iteration: <code>.[]</code></h4>
                    <p className="text-sm text-theme-text-primary mb-2">
                      Iterate over array elements.
                    </p>
                    <div className="bg-theme-bg-primary p-3 rounded text-sm font-mono">
                      <div className="text-theme-text-success">Input: [1, 2, 3]</div>
                      <div className="text-theme-text-accent">Query: .[]</div>
                      <div className="text-theme-text-accent">Output: 1 2 3</div>
                    </div>
                  </div>
                  
                  <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-primary">
                    <h4 className="font-medium text-theme-text-accent mb-2">Pipe: <code>|</code></h4>
                    <p className="text-sm text-theme-text-primary mb-2">
                      Chain operations together using the pipe operator.
                    </p>
                    <div className="bg-theme-bg-primary p-3 rounded text-sm font-mono">
                      <div className="text-theme-text-success">Input: &#123; "user": &#123; "name": "John", "age": 30 &#125; &#125;</div>
                      <div className="text-theme-text-accent">Query: .user | .name</div>
                      <div className="text-theme-text-accent">Output: "John"</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <a 
                  href="https://stedolan.github.io/jq/manual/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-theme-text-accent hover:text-theme-text-accent transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>jq Manual</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                
                <a 
                  href="https://jqplay.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-theme-text-accent hover:text-theme-text-accent transition-colors"
                >
                  <Code className="w-4 h-4" />
                  <span>jq Play (Online Playground)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
          
          {activeTab === 'examples' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Common jq Patterns</h3>
                <p className="text-theme-text-primary mb-4">
                  Here are some common jq patterns that you can use as templates for your own queries.
                </p>
                
                <div className="space-y-6">
                  <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-primary">
                    <h4 className="font-medium text-theme-text-accent mb-2">Filter Array Items</h4>
                    <p className="text-sm text-theme-text-primary mb-2">
                      Filter an array based on a condition.
                    </p>
                    <div className="bg-theme-bg-primary p-3 rounded text-sm font-mono">
                      <div className="text-theme-text-success">Input: [&#123;"name":"John","age":30&#125;,&#123;"name":"Jane","age":25&#125;]</div>
                      <div className="text-theme-text-accent">Query: .[] | select(.age &gt; 28)</div>
                      <div className="text-theme-text-accent">Output: &#123; "name": "John", "age": 30 &#125;</div>
                    </div>
                    <button 
                      className="mt-2 text-xs text-theme-text-accent hover:text-theme-text-accent transition-colors"
                      onClick={() => {
                        // This would be implemented to copy the example to the editor
                        alert('This would copy the example to the editor in a real implementation');
                      }}
                    >
                      Try this example
                    </button>
                  </div>
                  
                  <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-primary">
                    <h4 className="font-medium text-theme-text-accent mb-2">Transform Array Items</h4>
                    <p className="text-sm text-theme-text-primary mb-2">
                      Create a new object for each item in an array.
                    </p>
                    <div className="bg-theme-bg-primary p-3 rounded text-sm font-mono">
                      <div className="text-theme-text-success">Input: [&#123;"name":"John","age":30&#125;,&#123;"name":"Jane","age":25&#125;]</div>
                      <div className="text-theme-text-accent">Query: [.[] | &#123;name: .name, isAdult: (.age &gt;= 18)&#125;]</div>
                      <div className="text-theme-text-accent">Output: [&#123;"name":"John","isAdult":true&#125;,&#123;"name":"Jane","isAdult":true&#125;]</div>
                    </div>
                    <button 
                      className="mt-2 text-xs text-theme-text-accent hover:text-theme-text-accent transition-colors"
                      onClick={() => {
                        // This would be implemented to copy the example to the editor
                        alert('This would copy the example to the editor in a real implementation');
                      }}
                    >
                      Try this example
                    </button>
                  </div>
                  
                  <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-primary">
                    <h4 className="font-medium text-theme-text-accent mb-2">Group and Count</h4>
                    <p className="text-sm text-theme-text-primary mb-2">
                      Group items by a field and count occurrences.
                    </p>
                    <div className="bg-theme-bg-primary p-3 rounded text-sm font-mono">
                      <div className="text-theme-text-success">Input: [&#123;"type":"A"&#125;,&#123;"type":"B"&#125;,&#123;"type":"A"&#125;]</div>
                      <div className="text-theme-text-accent">Query: group_by(.type) | map(&#123;type: .[0].type, count: length&#125;)</div>
                      <div className="text-theme-text-accent">Output: [&#123;"type":"A","count":2&#125;,&#123;"type":"B","count":1&#125;]</div>
                    </div>
                    <button 
                      className="mt-2 text-xs text-theme-text-accent hover:text-theme-text-accent transition-colors"
                      onClick={() => {
                        // This would be implemented to copy the example to the editor
                        alert('This would copy the example to the editor in a real implementation');
                      }}
                    >
                      Try this example
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Keyboard Shortcuts</h3>
                <p className="text-theme-text-primary mb-4">
                  These keyboard shortcuts will help you work more efficiently with the jq playground.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-primary">
                    <h4 className="font-medium text-theme-text-accent mb-3">General</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-theme-text-primary">Save</span>
                        <code className="text-xs bg-theme-bg-primary px-2 py-1 rounded">⌘ S / Ctrl+S</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-theme-text-primary">Open Version History</span>
                        <code className="text-xs bg-theme-bg-primary px-2 py-1 rounded">⌘ ⇧ O / Ctrl+Shift+O</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-theme-text-primary">Show Help</span>
                        <code className="text-xs bg-theme-bg-primary px-2 py-1 rounded">?</code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-primary">
                    <h4 className="font-medium text-theme-text-accent mb-3">Row Mode</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-theme-text-primary">Toggle Row Mode</span>
                        <code className="text-xs bg-theme-bg-primary px-2 py-1 rounded">Alt+L</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-theme-text-primary">Next Array Item</span>
                        <code className="text-xs bg-theme-bg-primary px-2 py-1 rounded">⇧ →</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-theme-text-primary">Previous Array Item</span>
                        <code className="text-xs bg-theme-bg-primary px-2 py-1 rounded">⇧ ←</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-theme-text-primary">Show All Items</span>
                        <code className="text-xs bg-theme-bg-primary px-2 py-1 rounded">Alt+A</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-theme-text-primary">Extract Array</span>
                        <code className="text-xs bg-theme-bg-primary px-2 py-1 rounded">Alt+E</code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-primary">
                    <h4 className="font-medium text-theme-text-accent mb-3">Editor</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-theme-text-primary">Show Suggestions</span>
                        <code className="text-xs bg-theme-bg-primary px-2 py-1 rounded">Ctrl+Space</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-theme-text-primary">Format JSON</span>
                        <code className="text-xs bg-theme-bg-primary px-2 py-1 rounded">Alt+Shift+F</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-theme-border-primary">
          <div className="text-sm text-theme-text-secondary">
            Press <code className="text-xs bg-theme-bg-secondary px-2 py-1 rounded">?</code> anytime to open this help panel
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}