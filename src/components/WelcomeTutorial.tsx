import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Code, FileJson, Play, Info } from 'lucide-react';

interface WelcomeTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeTutorial({ isOpen, onClose }: WelcomeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnStartup, setShowOnStartup] = useState(true);
  
  // Check if this is the first time the user is visiting
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('jq-playground-tutorial-seen');
    if (hasSeenTutorial === 'true') {
      setShowOnStartup(false);
    }
  }, []);

  const handleClose = () => {
    // Save preference to localStorage
    if (!showOnStartup) {
      localStorage.setItem('jq-playground-tutorial-seen', 'true');
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    {
      title: "Welcome to jq Playground",
      content: (
        <div className="space-y-4">
          <p>
            This interactive playground helps you transform JSON data using jq, a powerful command-line JSON processor.
          </p>
          <p>
            Whether you're new to jq or an experienced user, this tool makes it easy to experiment with jq queries and see the results instantly.
          </p>
          <div className="bg-theme-notification-info-bg border border-theme-notification-info-border rounded-lg p-4 mt-4">
            <h3 className="text-theme-text-accent font-medium flex items-center">
              <Info className="w-4 h-4 mr-2" />
              New to jq?
            </h3>
            <p className="text-sm mt-2">
              Don't worry! We'll guide you through the basics and provide examples to help you get started.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "The Basics: Three-Panel Layout",
      content: (
        <div className="space-y-4">
          <p>
            The playground is divided into three main panels:
          </p>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-accent">
              <div className="flex items-center text-theme-text-accent mb-2">
                <FileJson className="w-4 h-4 mr-2" />
                <h3 className="font-medium">JSON Input</h3>
              </div>
              <p className="text-sm">
                Paste or upload your JSON data here. You can also use the sample data provided.
              </p>
            </div>
            <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-success">
              <div className="flex items-center text-theme-text-success mb-2">
                <Code className="w-4 h-4 mr-2" />
                <h3 className="font-medium">jq Query</h3>
              </div>
              <p className="text-sm">
                Write your jq transformation query here. Press Ctrl+Space for suggestions.
              </p>
            </div>
            <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-accent">
              <div className="flex items-center text-theme-text-accent mb-2">
                <Play className="w-4 h-4 mr-2" />
                <h3 className="font-medium">Output</h3>
              </div>
              <p className="text-sm">
                See the transformed JSON result here. The output updates automatically as you type.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Working with Arrays: Row Mode",
      content: (
        <div className="space-y-4">
          <p>
            When working with large arrays, <strong>Row Mode</strong> makes it easier to focus on one item at a time:
          </p>
          <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-secondary mt-4">
            <h3 className="font-medium mb-2">How to use Row Mode:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Click the <span className="bg-theme-bg-tertiary px-2 py-1 rounded text-xs">Row Mode</span> button in the JSON Input panel</li>
              <li>Navigate between array items using the arrow buttons or Shift+Left/Right keys</li>
              <li>Edit individual items without affecting the entire array</li>
              <li>Return to the full view by clicking <span className="bg-theme-button-primary-bg px-2 py-1 rounded text-xs">Show All</span> or pressing the A key</li>
            </ul>
          </div>
          <div className="bg-theme-notification-success-bg border border-theme-notification-success-border rounded-lg p-4 mt-4">
            <h3 className="text-theme-text-success font-medium">Pro Tip:</h3>
            <p className="text-sm mt-2">
              For JSON with a structure like <code className="bg-theme-bg-secondary px-2 py-1 rounded">&#123;"data": [1,2,3]&#125;</code>, use the <span className="bg-theme-button-success-bg px-2 py-1 rounded text-xs">Extract Array</span> button to convert it to <code className="bg-theme-bg-secondary px-2 py-1 rounded">[1,2,3]</code> and enable Row Mode automatically.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Saving and Restoring Your Work",
      content: (
        <div className="space-y-4">
          <p>
            Never lose your work with our version history features:
          </p>
          <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-secondary mt-4">
            <h3 className="font-medium mb-2">Version History:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Click <span className="bg-theme-button-success-bg px-2 py-1 rounded text-xs">Save</span> to save your current work (or press Cmd/Ctrl+S)</li>
              <li>Access saved versions by clicking <span className="bg-theme-button-primary-bg px-2 py-1 rounded text-xs">History</span> in the header</li>
              <li>Choose to restore both JSON and jq query, or just the jq query</li>
              <li>Rename versions by clicking the pencil icon</li>
            </ul>
          </div>
          <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-secondary mt-4">
            <h3 className="font-medium mb-2">Quick Version Navigation:</h3>
            <p className="text-sm">
              Click <span className="bg-theme-button-primary-bg px-2 py-1 rounded text-xs">Browse Versions</span> in the jq Editor footer to quickly scroll through your saved jq queries without leaving the editor.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Getting Help",
      content: (
        <div className="space-y-4">
          <p>
            There are several ways to get help while using the playground:
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-secondary">
              <h3 className="font-medium mb-2">Keyboard Shortcuts:</h3>
              <p className="text-sm">
                Click the <span className="bg-theme-bg-tertiary px-2 py-1 rounded text-xs">Shortcuts</span> button in the header or hover over <span className="text-theme-text-secondary">Keyboard Shortcuts</span> in the jq Editor footer.
              </p>
            </div>
            <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-border-secondary">
              <h3 className="font-medium mb-2">jq Suggestions:</h3>
              <p className="text-sm">
                Press Ctrl+Space in the jq Editor to see suggestions based on your JSON structure and common jq patterns.
              </p>
            </div>
          </div>
          <div className="bg-theme-notification-info-bg border border-theme-notification-info-border rounded-lg p-4 mt-4">
            <h3 className="text-theme-text-accent font-medium flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Need more help?
            </h3>
            <p className="text-sm mt-2">
              Check out the <a href="https://stedolan.github.io/jq/manual/" target="_blank" rel="noopener noreferrer" className="text-theme-text-accent underline">jq Manual</a> for comprehensive documentation on jq syntax and functions.
            </p>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-theme-bg-primary rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border-primary">
          <h2 className="text-xl font-semibold">
            {steps[currentStep].title}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-theme-bg-tertiary rounded transition-colors"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {steps[currentStep].content}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-theme-border-primary">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show-on-startup"
              checked={showOnStartup}
              onChange={(e) => setShowOnStartup(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="show-on-startup" className="text-sm text-theme-text-primary">
              Show this tutorial on startup
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-3 py-1.5 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover disabled:bg-theme-bg-secondary disabled:text-theme-text-secondary disabled:cursor-not-allowed rounded text-sm transition-colors flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <div className="text-sm text-theme-text-secondary">
              {currentStep + 1} of {steps.length}
            </div>
            <button
              onClick={handleNext}
              className="px-3 py-1.5 bg-theme-button-primary-bg hover:bg-theme-button-primary-hover rounded text-sm transition-colors flex items-center"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                "Get Started"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}