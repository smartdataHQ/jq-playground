import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Code, AlertCircle, CheckCircle, History, Save, HelpCircle, FileJson } from 'lucide-react';
import { Tooltip } from './components/Tooltip';
import { ThemeToggle } from './components/ThemeToggle';
import JsonInput, { JsonInputRef } from './components/JsonInput';
import JqEditor from './components/JqEditor';
import { JsonOutput } from './components/JsonOutput';
import { VersionHistory } from './components/VersionHistory';
import { ResizableLayout } from './components/ResizableLayout';
import { WelcomeTutorial } from './components/WelcomeTutorial';
import { HelpPanel } from './components/HelpPanel';
import { processJq, JqError, JqErrorDetails } from './utils/jqProcessor';
import { introspectJson } from './utils/jsonIntrospector';
import { formatJqOutput, isJsonOutput } from './utils/outputFormatter';
import { sampleJsons } from './data/sampleJsons';
import { VersionStorage, JqVersion } from './utils/versionStorage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
function App() {
  const [jsonInput, setJsonInput] = useState('');
  const [jqQuery, setJqQuery] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<JqErrorDetails | null>(null);
  const [isValidJson, setIsValidJson] = useState(true);
  const [outputIsJson, setOutputIsJson] = useState(true);
  const [jsonViewMode, setJsonViewMode] = useState<'editor' | 'viewer'>('editor');
  const [selectedSample, setSelectedSample] = useState('users');
  const [pathCount, setPathCount] = useState(0);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [loadedFromSavePoint, setLoadedFromSavePoint] = useState<string | null>(null);
  const [currentRowData, setCurrentRowData] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
  const jsonInputRef = useRef<JsonInputRef>(null);


  // JSON introspection for autocomplete
  const jsonPaths = useMemo(() => {
    try {
      // Use currentRowData if available (row mode is enabled), otherwise use full jsonInput
      const jsonToIntrospect = currentRowData || jsonInput;
      const parsed = JSON.parse(jsonToIntrospect);
      const paths = introspectJson(parsed);
      setPathCount(paths.length);
      return paths;
    } catch {
      setPathCount(0);
      return [];
    }
  }, [jsonInput, currentRowData]);

  // Process jq transformation
  useEffect(() => {
    console.log('🔄 jq processing useEffect triggered:', {
      isValidJson,
      jqQueryLength: jqQuery.length,
      jqQueryTrimmed: jqQuery.trim(),
      timestamp: new Date().toISOString(),
      isRowMode: !!currentRowData
    });

    if (!isValidJson) {
      console.log('⚠️ Skipping jq processing: invalid JSON');
      setOutput('');
      setError('');
      return;
    }

    if (!jqQuery.trim()) {
      console.log('⚠️ Skipping jq processing: empty query');
      setOutput('');
      setError('');
      return;
    }

    console.log('✅ Starting jq processing...');

    const processQuery = async () => {
      try {
        console.log('🚀 Calling processJq...');
        // Use currentRowData if available (row mode is enabled), otherwise use full jsonInput
        const jsonToProcess = currentRowData || jsonInput;
        const result = await processJq(jsonToProcess, jqQuery);
        console.log('✅ processJq completed successfully');
        console.log('📤 Setting output...');
        const formattedOutput = formatJqOutput(result);
        const isJson = isJsonOutput(result);
        setOutput(formattedOutput);
        setOutputIsJson(isJson);
        setError('');
        console.log('✅ Output and error state updated');
      } catch (err) {
        console.error('❌ processJq failed:', err);
        
        // Check if it's a JqError with detailed error information
        if (err instanceof JqError) {
          const errorMessage = err.message;
          console.error('📝 Setting error message with details:', errorMessage, err.details);
          setError(errorMessage);
          setErrorDetails(err.details);
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          console.error('📝 Setting error message:', errorMessage);
          setError(errorMessage);
          setErrorDetails(null);
        }
        
        setOutput('');
        console.log('❌ Error state updated');
      }
    };

    processQuery();
  }, [jsonInput, jqQuery, isValidJson, currentRowData]);

  // Auto-save functionality removed as per requirements
  // Only save versions when "Save" is explicitly triggered

  // Check if this is the first visit and show tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('jq-playground-tutorial-seen');
    if (hasSeenTutorial !== 'true') {
      // Show tutorial on first visit
      setIsTutorialOpen(true);
    }
  }, []);

  // Load last active state from browser memory on startup
  useEffect(() => {
    // First, check localStorage for the last active state
    const saved = localStorage.getItem('jq-editor-state');
    let localStorageState = null;
    let localStorageTimestamp = 0;
    
    if (saved) {
      try {
        localStorageState = JSON.parse(saved);
        localStorageTimestamp = localStorageState.timestamp || 0;
        
        // Check if the data was trimmed during save
        if (localStorageState.wasTrimmed) {
          console.warn('Loading trimmed editor state. Some content may have been truncated to fit in localStorage.');
        }
      } catch (error) {
        console.error('Failed to parse localStorage state:', error);
        // Invalid localStorage state
      }
    }
    
    // Then check version history for more recent save points
    const mostRecentVersion = VersionStorage.getMostRecentVersion();
    
    // Prioritize browser memory, but load save point if it's more recent
    if (localStorageState && (!mostRecentVersion || localStorageTimestamp >= mostRecentVersion.timestamp)) {
      // Load from localStorage (browser memory)
      console.log('Loading from browser memory (localStorage)');
      setJsonInput(localStorageState.jsonInput);
      setJqQuery(localStorageState.jqQuery);
    } else if (mostRecentVersion) {
      // Load from most recent save point if it's newer than localStorage
      console.log('Loading from most recent save point:', mostRecentVersion.name);
      setJsonInput(mostRecentVersion.jsonInput);
      setJqQuery(mostRecentVersion.jqQuery);
      setLoadedFromSavePoint(mostRecentVersion.name);
      
      // Clear the indicator after 3 seconds
      setTimeout(() => setLoadedFromSavePoint(null), 3000);
    } else {
      // Only use examples if absolutely nothing is saved
      console.log('No saved state found, using default examples');
      setJsonInput(sampleJsons.users);
      setJqQuery(`# Advanced user data transformation
    # Get active developers with their skills, sorted by skill count
    [
      .users[] 
      | select(.active == true and .role == "developer") 
      | {
          name: .name, 
          email: .email, 
          skill_count: (.skills | length),
          skills: .skills,
          github: (.profile.social.github // "N/A"),
          experience: ("Joined " + .joinDate + " in " + .city)
        }
    ] | sort_by(-.skill_count)`);
    }
  }, []);

  useEffect(() => {
    // Only save to localStorage if there's actual content
    if (jsonInput.trim() || jqQuery.trim()) {
      const state = { 
        jsonInput, 
        jqQuery, 
        timestamp: Date.now() 
      };
      
      try {
        // Check if the data is too large (estimating size)
        const stateString = JSON.stringify(state);
        const estimatedSize = new Blob([stateString]).size;
        
        // If data is larger than 4MB (conservative limit), trim it down
        const MAX_SIZE = 4 * 1024 * 1024; // 4MB
        
        if (estimatedSize > MAX_SIZE) {
          console.warn(`Editor state exceeds safe size limit (${(estimatedSize / (1024 * 1024)).toFixed(2)}MB). Trimming data.`);
          
          // Create a trimmed version with limited JSON input
          const trimmedState = {
            jsonInput: jsonInput.length > 100000 ? jsonInput.substring(0, 100000) + "... (trimmed for storage)" : jsonInput,
            jqQuery,
            timestamp: Date.now(),
            wasTrimmed: true
          };
          
          localStorage.setItem('jq-editor-state', JSON.stringify(trimmedState));
        } else {
          // Normal case - data fits in localStorage
          localStorage.setItem('jq-editor-state', stateString);
        }
      } catch (error) {
        console.error('Failed to save editor state to localStorage:', error);
        // Could implement alternative storage here if needed
      }
    }
  }, [jsonInput, jqQuery]);

  const handleSampleChange = (sampleKey: string) => {
    setSelectedSample(sampleKey);
    setJsonInput(sampleJsons[sampleKey as keyof typeof sampleJsons]);
    // Reset query for new sample
    if (sampleKey === 'users') {
      setJqQuery(`# Advanced user data transformation
# Get active developers with their skills, sorted by skill count
[
  .users[] 
  | select(.active == true and .role == "developer") 
  | {
      name: .name, 
      email: .email, 
      skill_count: (.skills | length),
      skills: .skills,
      github: (.profile.social.github // "N/A"),
      experience: ("Joined " + .joinDate + " in " + .city)
    }
] | sort_by(-.skill_count)`);
    } else if (sampleKey === 'products') {
      setJqQuery(`# Product inventory analysis
# Calculate value and availability metrics
.products | map(
  . as $product |
  {
    name: .name, 
    price: .price, 
    inventory_value: (.price * .quantity),
    availability: (if .inStock then 
                    "In Stock (" + (.quantity | tostring) + " units)" 
                  else 
                    "Out of Stock" 
                  end),
    popularity: {
      rating: .rating,
      review_count: .reviews,
      sentiment: (if .rating >= 4.5 then 
                   "Excellent" 
                 elif .rating >= 4.0 then 
                   "Very Good" 
                 elif .rating >= 3.0 then 
                   "Good" 
                 else 
                   "Average" 
                 end)
    },
    tags: .tags
  }
) | sort_by(-.inventory_value)`);
    } else if (sampleKey === 'logs') {
      setJqQuery(`# Log analysis and error reporting
# Group by log level with detailed error information
{
  summary: .summary,
  by_level: (.logs 
    | group_by(.level) 
    | map({
        level: .[0].level,
        count: length,
        entries: map({
          time: .timestamp,
          message: .message,
          endpoint: .endpoint,
          details: (
            if .level == "error" then 
              {error_code: (.error.code // .error.field), error_message: .error.message} 
            elif .level == "warn" then 
              {warning_details: (.memoryUsage // {})} 
            else 
              {user: (.userId // "system"), response_time: (.responseTime // 0)}
            end
          )
        })
      })
    | map({key: .level, value: .}) 
    | from_entries)
}`);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  const downloadOutput = () => {
    const mimeType = outputIsJson ? 'application/json' : 'text/plain';
    const extension = outputIsJson ? 'json' : 'txt';
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jq-output.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Version management functions
  const handleQuickSave = useCallback(() => {
    if (!jqQuery.trim() || !isValidJson) return;
    
    const version = VersionStorage.saveVersion({
      name: `Quick Save ${new Date().toLocaleString()}`,
      jsonInput,
      jqQuery,
      output,
    });
    setLastSaveTime(version.timestamp);
    
    // Show brief feedback
    setTimeout(() => setLastSaveTime(null), 2000);
  }, [jsonInput, jqQuery, output, isValidJson]);

  const handleSaveAs = useCallback(() => {
    setIsVersionHistoryOpen(true);
  }, []);

  const handleLoadVersion = useCallback((version: JqVersion) => {
    setJsonInput(version.jsonInput);
    setJqQuery(version.jqQuery);
    setIsVersionHistoryOpen(false);
  }, []);
  
  const handleLoadJqScriptOnly = useCallback((version: JqVersion) => {
    setJqQuery(version.jqQuery);
    setIsVersionHistoryOpen(false);
  }, []);



  // Long array mode functions
  const handleToggleLongArrayMode = useCallback(() => {
    jsonInputRef.current?.toggleLongArrayMode();
  }, []);

  const handleNextArrayItem = useCallback(() => {
    jsonInputRef.current?.nextArrayItem();
  }, []);

  const handlePrevArrayItem = useCallback(() => {
    jsonInputRef.current?.prevArrayItem();
  }, []);

  const handleShowAllItems = useCallback(() => {
    jsonInputRef.current?.showAllItems();
  }, []);
  
  const handleExtractArray = useCallback(() => {
    jsonInputRef.current?.extractArrayFromSingleKey();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleQuickSave,
    onSaveAs: handleSaveAs,
    onOpen: () => setIsVersionHistoryOpen(true),
    onToggleLongArrayMode: handleToggleLongArrayMode,
    onNextArrayItem: handleNextArrayItem,
    onPrevArrayItem: handlePrevArrayItem,
    onShowAllItems: handleShowAllItems,
    onExtractArray: handleExtractArray,
    onShowHelp: () => setIsHelpPanelOpen(true),
  });

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary">
      {/* 
        Header - Simplified and decluttered
        
        Organization principles:
        1. Reduced visual clutter by removing the keyboard shortcuts dropdown
           (shortcuts are still accessible through the Help panel)
        2. Grouped related elements together:
           - Left side: App title and branding
           - Right side: Configuration options and primary actions
        3. Made UI more compact with smaller elements and tighter spacing
        4. Used dropdowns for less frequently accessed options (samples)
        5. Consolidated status indicators into a single area
        
        This creates a cleaner, more focused interface while maintaining all functionality.
      */}
      {/* 
        Header - Ultra-simplified
        
        Further simplification principles:
        1. Converted text+icon buttons to icon-only buttons with tooltips
        2. Made the status indicator more subtle and integrated with the layout
        3. Created an even more compact layout with minimal spacing
        4. Maintained all essential functionality while reducing visual elements
        5. Used consistent button styling for a cleaner appearance
        
        This creates an extremely minimal interface while preserving all functionality.
      */}
      <header className="bg-theme-bg-secondary border-b border-theme-border-primary px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left side: App title (simplified) */}
          <div className="flex items-center space-x-2">
            <Code className="w-6 h-6 text-theme-text-accent" />
            <h1 className="text-lg font-bold">jq Editor</h1>
            
            {/* Status indicator - integrated with title */}
            {loadedFromSavePoint && (
              <div className="flex items-center space-x-1 text-theme-text-accent text-xs bg-theme-notification-info-bg px-1.5 py-0.5 rounded">
                <History className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{loadedFromSavePoint}</span>
              </div>
            )}
            {lastSaveTime && !loadedFromSavePoint && (
              <div className="flex items-center text-theme-text-success text-xs">
                <CheckCircle className="w-3 h-3" />
              </div>
            )}
            {error && !loadedFromSavePoint && !lastSaveTime && (
              <div className="flex items-center text-theme-text-error text-xs">
                <AlertCircle className="w-3 h-3" />
              </div>
            )}
          </div>
          
          {/* Right side: Actions and controls (simplified) */}
          <div className="flex items-center space-x-2">
            {/* Sample selector - icon only with tooltip */}
            <div className="relative group">
              <Tooltip content="Sample Data" position="bottom">
                <button 
                  className="p-1.5 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded transition-colors"
                >
                  <FileJson className="w-4 h-4 text-theme-text-accent" />
                </button>
              </Tooltip>
              <div className="absolute right-0 top-full mt-1 bg-theme-bg-primary border border-theme-border-secondary rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 w-48">
                <div className="p-1">
                  <button
                    onClick={() => handleSampleChange('users')}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded transition-colors ${selectedSample === 'users' ? 'bg-theme-bg-tertiary text-theme-text-accent' : ''}`}
                  >
                    Users
                  </button>
                  <button
                    onClick={() => handleSampleChange('products')}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded transition-colors ${selectedSample === 'products' ? 'bg-theme-bg-tertiary text-theme-text-accent' : ''}`}
                  >
                    Products
                  </button>
                  <button
                    onClick={() => handleSampleChange('logs')}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded transition-colors ${selectedSample === 'logs' ? 'bg-theme-bg-tertiary text-theme-text-accent' : ''}`}
                  >
                    Server Logs
                  </button>
                </div>
              </div>
            </div>
            
            
            {/* Save button - icon only with tooltip */}
            <Tooltip content="Save (⌘ S)" position="bottom">
              <button
                onClick={handleQuickSave}
                disabled={!jqQuery.trim() || !isValidJson}
                className="p-1.5 bg-theme-button-success-bg hover:bg-theme-button-success-hover disabled:bg-theme-button-disabled-bg disabled:cursor-not-allowed rounded transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
            </Tooltip>
            
            {/* History button - icon only with tooltip */}
            <Tooltip content="Version History (⌘ ⇧ O)" position="bottom">
              <button
                onClick={() => setIsVersionHistoryOpen(true)}
                className="p-1.5 bg-theme-button-primary-bg hover:bg-theme-button-primary-hover rounded transition-colors"
              >
                <History className="w-4 h-4" />
              </button>
            </Tooltip>
            
            {/* Help button - icon only with tooltip */}
            <Tooltip content="Help & Documentation" position="bottom">
              <button
                onClick={() => setIsHelpPanelOpen(true)}
                className="p-1.5 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </Tooltip>
            
            {/* Theme toggle button */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <div className="flex-1 h-[calc(100vh-80px)]">
        <ResizableLayout
          initialSizes={[33.33, 33.33, 33.34]}
          minSizes={[20, 20, 20]}
        >
          <div className="flex flex-col h-full">
            <JsonInput
              ref={jsonInputRef}
              value={jsonInput}
              onChange={setJsonInput}
              onValidityChange={setIsValidJson}
              pathCount={pathCount}
              viewMode={jsonViewMode}
              onViewModeChange={setJsonViewMode}
              onJsonPathsGenerated={(paths) => {
                // Optional: could use these enhanced paths for additional features
                console.log('Generated JSON paths:', paths);
              }}
              onRowDataChange={setCurrentRowData}
              // New props for consolidated header
              onSave={handleQuickSave}
              onVersionHistory={() => setIsVersionHistoryOpen(true)}
              onHelp={() => setIsHelpPanelOpen(true)}
              onSampleChange={handleSampleChange}
              sampleOptions={Object.fromEntries(Object.keys(sampleJsons).map(key => [key, key.charAt(0).toUpperCase() + key.slice(1)]))}
              selectedSample={selectedSample}
            />
          </div>

          <div className="flex flex-col h-full">
            <JqEditor
              value={jqQuery}
              onChange={setJqQuery}
              jsonPaths={jsonPaths}
              pathCount={pathCount}
              errorDetails={errorDetails}
              isRowModeEnabled={currentRowData !== null}
              onNextRow={handleNextArrayItem}
              onPrevRow={handlePrevArrayItem}
              // New props for consolidated header
              onSave={handleQuickSave}
              onVersionHistory={() => setIsVersionHistoryOpen(true)}
              onHelp={() => setIsHelpPanelOpen(true)}
              onDownloadQuery={() => {
                const blob = new Blob([jqQuery], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'query.jq';
                a.click();
                URL.revokeObjectURL(url);
              }}
              // Pass the JSON input directly to avoid DOM searching
              inputJson={currentRowData || jsonInput}
            />
          </div>

          <div className="flex flex-col h-full">
            <JsonOutput
              value={output}
              error={error}
              isJson={outputIsJson}
              // New props for consolidated header
              onCopy={copyOutput}
              onDownload={downloadOutput}
              onSave={handleQuickSave}
            />
          </div>
        </ResizableLayout>
      </div>

      {/* Version History Modal */}
      <VersionHistory
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        onLoadVersion={handleLoadVersion}
        onLoadJqScriptOnly={handleLoadJqScriptOnly}
        currentState={{ jsonInput, jqQuery, output }}
      />

      {/* Welcome Tutorial */}
      <WelcomeTutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* Help Panel */}
      <HelpPanel
        isOpen={isHelpPanelOpen}
        onClose={() => setIsHelpPanelOpen(false)}
      />
    </div>
  );
}

export default App;