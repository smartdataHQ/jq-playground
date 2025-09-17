import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Grip, Filter, ArrowRight, Hash, Layers } from 'lucide-react';

interface JsonPath {
  path: string;
  jqSelector: string;
  type: 'object' | 'array' | 'primitive';
  value?: unknown;
}

interface DraggableJsonViewerProps {
  jsonString: string;
  isValid: boolean;
  onPathGenerated?: (paths: JsonPath[]) => void;
  isRowMode?: boolean;
  currentRowIndex?: number;
}

interface JsonNodeProps {
  data: unknown;
  path: string;
  level: number;
  onDragStart: (jqSelector: string) => void;
  isRowMode?: boolean;
  currentRowIndex?: number;
}

interface ArrayOperationProps {
  path: string;
  arrayData: unknown[];
  onDragStart: (jqSelector: string) => void;
  isRowMode?: boolean;
  currentRowIndex?: number;
}

// Generate jq selector for a given path
function generateJqSelector(path: string, isRowMode = false, currentRowIndex?: number): string {
  if (!path || path === '.') {
    // If we're in Row Mode and at the root, we need to reference the array item
    if (isRowMode && currentRowIndex !== undefined) {
      return `.[${currentRowIndex}]`;
    }
    return '.';
  }
  
  // Handle array bracket notation in path
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  
  // Remove leading dot and split by dots
  const parts = normalizedPath.substring(1).split('.').filter(p => p !== '');
  
  // If we're in Row Mode, we need to adjust the selector to reference the array item
  let selector = isRowMode && currentRowIndex !== undefined ? `.[${currentRowIndex}]` : '.';
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Check if this part represents an array index
    if (part.match(/^\d+$/)) {
      selector += `[${part}]`;
    } else {
      // Regular field access - need to handle special characters
      if (selector !== '.' && !selector.endsWith(']')) {
        selector += '.';
      }
      
      // If field name contains special characters, wrap in quotes and use bracket notation
      if (part.match(/[^a-zA-Z0-9_]/)) {
        if (selector.endsWith('.')) {
          selector = selector.slice(0, -1); // Remove the dot we just added
        }
        selector += `["${part}"]`;
      } else {
        selector += part;
      }
    }
  }
  
  return selector;
}

// Generate array-specific jq operations
function generateArrayOperations(path: string, arrayData: unknown[], isRowMode = false, currentRowIndex?: number): Array<{label: string, selector: string, description: string, icon: React.ReactNode, category: string}> {
  const basePath = generateJqSelector(path, isRowMode, currentRowIndex);
  
  // Analyze array content to provide better suggestions
  const hasObjects = arrayData.some(item => typeof item === 'object' && item !== null);
  const hasNumbers = arrayData.some(item => typeof item === 'number');
  const hasStrings = arrayData.some(item => typeof item === 'string');
  
  const operations = [
    // Basic operations
    {
      label: 'Iterate []',
      selector: `${basePath}[]`,
      description: 'Iterate through all array elements',
      icon: <ArrowRight className="w-3 h-3" />,
      category: 'basic'
    },
    {
      label: 'Length',
      selector: `${basePath} | length`,
      description: 'Get array length',
      icon: <Hash className="w-3 h-3" />,
      category: 'basic'
    },
    {
      label: 'First',
      selector: `${basePath}[0]`,
      description: 'Get first element',
      icon: <ChevronRight className="w-3 h-3" />,
      category: 'basic'
    },
    {
      label: 'Last',
      selector: `${basePath}[-1]`,
      description: 'Get last element',
      icon: <ChevronDown className="w-3 h-3" />,
      category: 'basic'
    },
    
    // Filtering operations
    {
      label: 'Filter',
      selector: `${basePath}[] | select(. != null)`,
      description: 'Filter non-null elements',
      icon: <Filter className="w-3 h-3" />,
      category: 'filter'
    },
    {
      label: 'Map',
      selector: `${basePath}[] | `,
      description: 'Transform each element (add expression after |)',
      icon: <Layers className="w-3 h-3" />,
      category: 'transform'
    },
    
    // Advanced operations
    {
      label: 'Sort',
      selector: `${basePath} | sort`,
      description: 'Sort array elements',
      icon: <ArrowRight className="w-3 h-3" />,
      category: 'advanced'
    },
    {
      label: 'Unique',
      selector: `${basePath} | unique`,
      description: 'Get unique elements',
      icon: <Layers className="w-3 h-3" />,
      category: 'advanced'
    },
    {
      label: 'Reverse',
      selector: `${basePath} | reverse`,
      description: 'Reverse array order',
      icon: <ChevronDown className="w-3 h-3" />,
      category: 'advanced'
    }
  ];
  
  // Add type-specific operations
  if (hasObjects) {
    operations.push({
      label: 'Sort by key',
      selector: `${basePath} | sort_by(.key)`,
      description: 'Sort objects by a key (replace .key)',
      icon: <ArrowRight className="w-3 h-3" />,
      category: 'object'
    });
    operations.push({
      label: 'Group by',
      selector: `${basePath} | group_by(.key)`,
      description: 'Group objects by a key (replace .key)',
      icon: <Layers className="w-3 h-3" />,
      category: 'object'
    });
  }
  
  if (hasNumbers) {
    operations.push({
      label: 'Sum',
      selector: `${basePath} | add`,
      description: 'Sum all numbers',
      icon: <Hash className="w-3 h-3" />,
      category: 'math'
    });
    operations.push({
      label: 'Min/Max',
      selector: `${basePath} | min, max`,
      description: 'Get minimum and maximum values',
      icon: <Hash className="w-3 h-3" />,
      category: 'math'
    });
  }
  
  if (hasStrings) {
    operations.push({
      label: 'Join',
      selector: `${basePath} | join(", ")`,
      description: 'Join strings with separator',
      icon: <Layers className="w-3 h-3" />,
      category: 'string'
    });
  }
  
  return operations;
}

// Extract all paths from JSON object
function extractJsonPaths(obj: unknown, prefix = '', maxDepth = 10, currentDepth = 0, isRowMode = false, currentRowIndex?: number): JsonPath[] {
  if (currentDepth >= maxDepth || obj === null || obj === undefined) {
    return [];
  }
  
  const paths: JsonPath[] = [];
  
  if (Array.isArray(obj)) {
    const arrayPath = prefix || '.';
    paths.push({
      path: arrayPath,
      jqSelector: generateJqSelector(arrayPath, isRowMode, currentRowIndex),
      type: 'array',
      value: obj
    });
    
    // Add paths for array elements (sample first few)
    const sampleSize = Math.min(3, obj.length);
    for (let i = 0; i < sampleSize; i++) {
      const elementPath = `${arrayPath}[${i}]`;
      if (obj[i] !== null && typeof obj[i] === 'object') {
        const nestedPaths = extractJsonPaths(obj[i], elementPath, maxDepth, currentDepth + 1, isRowMode, currentRowIndex);
        paths.push(...nestedPaths);
      } else {
        paths.push({
          path: elementPath,
          jqSelector: generateJqSelector(elementPath, isRowMode, currentRowIndex),
          type: 'primitive',
          value: obj[i]
        });
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    const objectPath = prefix || '.';
    if (prefix) {
      paths.push({
        path: objectPath,
        jqSelector: generateJqSelector(objectPath, isRowMode, currentRowIndex),
        type: 'object',
        value: obj
      });
    }
    
    Object.keys(obj as Record<string, unknown>).forEach(key => {
      const fullPath = prefix ? `${prefix}.${key}` : `.${key}`;
      const value = (obj as Record<string, unknown>)[key];
      
      if (value !== null && typeof value === 'object') {
        const nestedPaths = extractJsonPaths(value, fullPath, maxDepth, currentDepth + 1, isRowMode, currentRowIndex);
        paths.push(...nestedPaths);
      } else {
        paths.push({
          path: fullPath,
          jqSelector: generateJqSelector(fullPath, isRowMode, currentRowIndex),
          type: 'primitive',
          value: value
        });
      }
    });
  }
  
  return paths;
}

// Array Operations Component
const ArrayOperations: React.FC<ArrayOperationProps> = ({ path, arrayData, onDragStart, isRowMode, currentRowIndex }) => {
  const operations = generateArrayOperations(path, arrayData, isRowMode, currentRowIndex);
  
  // Group operations by category
  const groupedOps = operations.reduce((acc, op) => {
    if (!acc[op.category]) acc[op.category] = [];
    acc[op.category].push(op);
    return acc;
  }, {} as Record<string, typeof operations>);
  
  // Using theme variables with opacity modifiers for category colors
  const categoryColors = {
    basic: 'bg-theme-button-primary-bg/20 border-theme-button-primary-bg/30 hover:bg-theme-button-primary-bg/40',
    filter: 'bg-theme-button-success-bg/20 border-theme-button-success-bg/30 hover:bg-theme-button-success-bg/40',
    transform: 'bg-theme-text-accent/20 border-theme-text-accent/30 hover:bg-theme-text-accent/40',
    advanced: 'bg-theme-text-warning/20 border-theme-text-warning/30 hover:bg-theme-text-warning/40',
    object: 'bg-theme-text-warning/20 border-theme-text-warning/30 hover:bg-theme-text-warning/40',
    math: 'bg-theme-text-error/20 border-theme-text-error/30 hover:bg-theme-text-error/40',
    string: 'bg-theme-text-accent/20 border-theme-text-accent/30 hover:bg-theme-text-accent/40'
  };
  
  return (
    <div className="ml-6 mt-2 p-3 bg-theme-bg-secondary/50 rounded border border-theme-border-secondary">
      <div className="text-xs text-theme-text-secondary mb-3 flex items-center justify-between">
        <span>Array Operations ({arrayData.length} items)</span>
        <span className="text-theme-text-secondary/70">Drag to insert →</span>
      </div>
      
      <div className="space-y-3">
        {Object.entries(groupedOps).map(([category, ops]) => (
          <div key={category}>
            <div className="text-xs font-medium text-theme-text-primary mb-1 capitalize">{category}:</div>
            <div className="grid grid-cols-2 gap-1">
              {ops.map((op, index) => (
                <button
                  key={index}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', op.selector);
                    e.dataTransfer.effectAllowed = 'copy';
                    onDragStart(op.selector);
                  }}
                  className={`flex items-center space-x-1 px-2 py-1 text-xs border rounded cursor-move transition-colors ${
                    categoryColors[category as keyof typeof categoryColors] || categoryColors.basic
                  }`}
                  title={op.description}
                >
                  {op.icon}
                  <span>{op.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const JsonNode: React.FC<JsonNodeProps> = ({ data, path, level, onDragStart, isRowMode, currentRowIndex }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const [showArrayOps, setShowArrayOps] = useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    const jqSelector = generateJqSelector(path, isRowMode, currentRowIndex);
    e.dataTransfer.setData('text/plain', jqSelector);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(jqSelector);
  };
  
  const handleKeyDragStart = (e: React.DragEvent, keyPath: string) => {
    const jqSelector = generateJqSelector(keyPath, isRowMode, currentRowIndex);
    e.dataTransfer.setData('text/plain', jqSelector);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(jqSelector);
  };
  
  const renderValue = (value: unknown, currentPath: string, currentLevel: number): React.ReactNode => {
    if (value === null) return <span className="text-theme-text-secondary/70">null</span>;
    if (value === undefined) return <span className="text-theme-text-secondary/70">undefined</span>;
    
    if (Array.isArray(value)) {
      return (
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center hover:bg-theme-bg-tertiary rounded p-1 mr-1"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              <span
                draggable
                onDragStart={handleDragStart}
                className="flex items-center cursor-move hover:bg-theme-text-accent/30 rounded px-1 py-0.5 group"
                title={`Drag to insert: ${generateJqSelector(currentPath)}`}
              >
                <Grip className="w-3 h-3 text-theme-text-secondary/70 mr-1 opacity-0 group-hover:opacity-100" />
                <span className="text-theme-text-accent">[</span>
                <span className="text-theme-text-secondary text-xs ml-1">{value.length} items</span>
                <span className="text-theme-text-accent">]</span>
              </span>
            </div>
            <button
              onClick={() => setShowArrayOps(!showArrayOps)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                showArrayOps 
                  ? 'bg-theme-button-primary-bg text-theme-button-primary-text' 
                  : 'bg-theme-bg-tertiary text-theme-text-primary hover:bg-theme-bg-tertiary/80'
              }`}
              title="Show array operations"
            >
              <Filter className="w-3 h-3" />
            </button>
          </div>
          
          {showArrayOps && (
            <ArrayOperations 
              path={currentPath} 
              arrayData={value} 
              onDragStart={onDragStart}
              isRowMode={isRowMode}
              currentRowIndex={currentRowIndex}
            />
          )}
          
          {isExpanded && (
            <div className="ml-4 border-l border-theme-border-primary pl-2">
              {value.slice(0, 5).map((item, index) => (
                <div key={index} className="py-0.5">
                  <div className="flex items-start">
                    <span className="text-theme-text-secondary/70 text-xs mr-2 mt-1">[{index}]</span>
                    <div className="flex-1">
                      <JsonNode
                        data={item}
                        path={`${currentPath}[${index}]`}
                        level={currentLevel + 1}
                        onDragStart={onDragStart}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {value.length > 5 && (
                <div className="text-theme-text-secondary/70 text-xs py-1 ml-6">
                  ... and {value.length - 5} more items
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value as Record<string, unknown>);
      return (
        <div>
          <div className="flex items-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center hover:bg-theme-bg-tertiary rounded p-1 mr-1"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            <span
              draggable
              onDragStart={handleDragStart}
              className="flex items-center cursor-move hover:bg-theme-text-accent/30 rounded px-1 py-0.5 group"
              title={`Drag to insert: ${generateJqSelector(currentPath)}`}
            >
              <Grip className="w-3 h-3 text-theme-text-secondary/70 mr-1 opacity-0 group-hover:opacity-100" />
              <span className="text-theme-text-warning">{"{"}</span>
              <span className="text-theme-text-secondary text-xs ml-1">{keys.length} keys</span>
              <span className="text-theme-text-warning">{"}"}</span>
            </span>
          </div>
          {isExpanded && (
            <div className="ml-4 border-l border-theme-border-primary pl-2">
              {keys.map((key) => (
                <div key={key} className="py-0.5">
                  <div className="flex items-start">
                    <span
                      draggable
                      onDragStart={(e) => handleKeyDragStart(e, `${currentPath}.${key}`)}
                      className="flex items-center cursor-move hover:bg-theme-text-success/30 rounded px-1 py-0.5 group mr-2"
                      title={`Drag to insert: ${generateJqSelector(`${currentPath}.${key}`)}`}
                    >
                      <Grip className="w-3 h-3 text-theme-text-secondary/70 mr-1 opacity-0 group-hover:opacity-100" />
                      <span className="text-theme-text-success">"{key}"</span>
                    </span>
                    <span className="text-theme-text-secondary/70 mr-2">:</span>
                    <div className="flex-1">
                      <JsonNode
                        data={(value as Record<string, unknown>)[key]}
                        path={`${currentPath}.${key}`}
                        level={currentLevel + 1}
                        onDragStart={onDragStart}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Primitive values
    const valueColor = typeof value === 'string' ? 'text-theme-text-success' : 
                     typeof value === 'number' ? 'text-theme-text-accent' : 
                     typeof value === 'boolean' ? 'text-theme-text-accent' : 'text-theme-text-primary';
    
    const displayValue = typeof value === 'string' ? `"${value}"` : String(value);
    
    return (
      <span
        draggable
        onDragStart={handleDragStart}
        className={`cursor-move hover:bg-theme-bg-tertiary rounded px-1 py-0.5 group ${valueColor}`}
        title={`Drag to insert: ${generateJqSelector(currentPath)}`}
      >
        <Grip className="w-3 h-3 text-theme-text-secondary/70 mr-1 opacity-0 group-hover:opacity-100 inline" />
        {displayValue}
      </span>
    );
  };
  
  return renderValue(data, path, level);
};

export const DraggableJsonViewer: React.FC<DraggableJsonViewerProps> = ({ 
  jsonString, 
  isValid, 
  onPathGenerated,
  isRowMode = false,
  currentRowIndex
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSelector, setDraggedSelector] = useState<string>('');
  
  const { parsedData, jsonPaths } = useMemo(() => {
    if (!isValid || !jsonString.trim()) {
      return { parsedData: null, jsonPaths: [] };
    }
    
    try {
      const parsed = JSON.parse(jsonString);
      const paths = extractJsonPaths(parsed, '', 10, 0, isRowMode, currentRowIndex);
      return { parsedData: parsed, jsonPaths: paths };
    } catch {
      return { parsedData: null, jsonPaths: [] };
    }
  }, [jsonString, isValid, isRowMode, currentRowIndex]);
  
  // Notify parent of generated paths
  React.useEffect(() => {
    if (onPathGenerated) {
      onPathGenerated(jsonPaths);
    }
  }, [jsonPaths, onPathGenerated]);
  
  const handleDragStart = (jqSelector: string) => {
    setIsDragging(true);
    setDraggedSelector(jqSelector);
    console.log('Dragging jq selector:', jqSelector);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedSelector('');
  };
  
  // Add global drag end listener
  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsDragging(false);
      setDraggedSelector('');
    };
    
    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => document.removeEventListener('dragend', handleGlobalDragEnd);
  }, []);
  
  if (!isValid) {
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 flex items-center justify-center text-theme-text-secondary/70" style={{ paddingBottom: '60px' }}>
          <div className="text-center">
            <div className="text-lg mb-2">Invalid JSON</div>
            <div className="text-sm">Fix the JSON syntax to see the Tree Viewer</div>
          </div>
        </div>
        {/* Quick Patterns Toolbar - absolutely positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-theme-bg-secondary border-t border-theme-border-primary p-2">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <Grip className="w-4 h-4 text-theme-text-accent flex-shrink-0" />
            <span className="text-xs text-theme-text-secondary flex-shrink-0">Quick drag:</span>
            {[
              { name: 'Identity', pattern: '.', description: 'Return input unchanged' },
              { name: 'Array iterate', pattern: '.[]', description: 'Iterate through array elements' },
              { name: 'Keys', pattern: 'keys', description: 'Get object keys' }
            ].map((pattern, index) => (
              <button
                key={index}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', pattern.pattern);
                  e.dataTransfer.effectAllowed = 'copy';
                  handleDragStart(pattern.pattern);
                }}
                className="px-2 py-1 text-xs bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded transition-colors whitespace-nowrap cursor-move"
                title={pattern.description}
              >
                {pattern.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!parsedData) {
    return (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 flex items-center justify-center text-theme-text-secondary/70" style={{ paddingBottom: '60px' }}>
          <div className="text-center">
            <div className="text-lg mb-2">No JSON Data</div>
            <div className="text-sm">Enter valid JSON to see the tree  view</div>
          </div>
        </div>
        {/* Quick Patterns Toolbar - absolutely positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-theme-bg-secondary border-t border-theme-border-primary p-2">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <Grip className="w-4 h-4 text-theme-text-accent flex-shrink-0" />
            <span className="text-xs text-theme-text-secondary flex-shrink-0">Quick drag:</span>
            {[
              { name: 'Identity', pattern: '.', description: 'Return input unchanged' },
              { name: 'Array iterate', pattern: '.[]', description: 'Iterate through array elements' },
              { name: 'Keys', pattern: 'keys', description: 'Get object keys' }
            ].map((pattern, index) => (
              <button
                key={index}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', pattern.pattern);
                  e.dataTransfer.effectAllowed = 'copy';
                  handleDragStart(pattern.pattern);
                }}
                className="px-2 py-1 text-xs bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded transition-colors whitespace-nowrap cursor-move"
                title={pattern.description}
              >
                {pattern.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Common jq patterns are defined in the buttons below

  return (
    <div className="w-full h-full relative">
      {/* Drag feedback overlay */}
      {isDragging && (
        <div className="fixed top-4 right-4 bg-theme-button-primary-bg text-theme-button-primary-text px-3 py-2 rounded shadow-lg z-50 text-sm font-mono">
          Dragging: <code className="bg-theme-button-primary-hover px-1 rounded">{draggedSelector}</code>
        </div>
      )}
      
      {/* Scrollable JSON content - absolute positioning with bottom padding for footer */}
      <div 
        className="absolute inset-0 overflow-y-auto overflow-x-hidden p-4 font-mono text-sm" 
        style={{ paddingBottom: '60px' }}
        onDragEnd={handleDragEnd}
      >
        <JsonNode
          data={parsedData}
          path="."
          level={0}
          onDragStart={handleDragStart}
          isRowMode={isRowMode}
          currentRowIndex={currentRowIndex}
        />
      </div>
    </div>
  );
};

export default DraggableJsonViewer;