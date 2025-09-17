import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

function SimpleApp() {
  const [jsonInput, setJsonInput] = useState('{"test": "hello world"}');
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4">
        <h1 className="text-2xl font-bold text-blue-400">Simple jq Editor</h1>
      </header>
      
      <div className="p-4">
        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading Monaco Editor...</div>
          </div>
        )}
        
        <div className="h-96 border border-gray-700 rounded">
          <Editor
            height="100%"
            language="json"
            theme="vs-dark"
            value={jsonInput}
            onChange={(val) => setJsonInput(val || '')}
            onMount={() => {
              console.log('Monaco Editor mounted successfully');
              setLoading(false);
            }}
            loading={<div className="text-center py-8 text-gray-400">Loading editor...</div>}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
            }}
          />
        </div>
        
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold mb-2">Current JSON:</h3>
          <pre className="text-sm text-gray-300">{jsonInput}</pre>
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;