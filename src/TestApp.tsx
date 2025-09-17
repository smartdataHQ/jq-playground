import React from 'react';

function TestApp() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold text-blue-400">Test App</h1>
      <p className="mt-4 text-gray-300">If you can see this, React and Tailwind are working.</p>
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <p>This should have a gray background with rounded corners.</p>
      </div>
    </div>
  );
}

export default TestApp;