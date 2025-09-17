import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { VersionStorage, JqVersion } from '../utils/versionStorage';

interface JqVersionNavigatorProps {
  currentJqQuery: string;
  onApplyVersion: (jqQuery: string) => void;
  onClose: () => void;
  onPreview?: (jqQuery: string) => void;
}

export function JqVersionNavigator({ currentJqQuery, onApplyVersion, onClose, onPreview }: JqVersionNavigatorProps) {
  const [versions, setVersions] = useState<JqVersion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewJqQuery, setPreviewJqQuery] = useState('');

  // Load versions when component mounts
  useEffect(() => {
    const allVersions = VersionStorage.getVersions();
    setVersions(allVersions);
    
    // Initialize with current jq query
    setPreviewJqQuery(currentJqQuery);
    
    // Find if current query matches any version
    const matchingIndex = allVersions.findIndex(v => v.jqQuery === currentJqQuery);
    if (matchingIndex !== -1) {
      setCurrentIndex(matchingIndex);
    } else {
      // Start with the most recent version
      setCurrentIndex(0);
      if (allVersions.length > 0) {
        setPreviewJqQuery(allVersions[0].jqQuery);
        // Call onPreview if provided
        if (onPreview) {
          onPreview(allVersions[0].jqQuery);
        }
      }
    }
  }, [currentJqQuery, onPreview]);

  // Navigate to previous version
  const handlePrevious = () => {
    if (currentIndex < versions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const newJqQuery = versions[newIndex].jqQuery;
      setPreviewJqQuery(newJqQuery);
      
      // Call onPreview if provided
      if (onPreview) {
        onPreview(newJqQuery);
      }
    }
  };

  // Navigate to next version
  const handleNext = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const newJqQuery = versions[newIndex].jqQuery;
      setPreviewJqQuery(newJqQuery);
      
      // Call onPreview if provided
      if (onPreview) {
        onPreview(newJqQuery);
      }
    }
  };

  // Apply the current preview
  const handleApply = () => {
    onApplyVersion(previewJqQuery);
    onClose();
  };

  // Cancel navigation
  const handleCancel = () => {
    onClose();
  };

  const currentVersion = versions[currentIndex];

  return (
    <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-2 shadow-lg z-20 w-80">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">
          {versions.length > 0 ? (
            <span>
              Version {versions.length - currentIndex} of {versions.length}:
              {currentVersion && ` ${currentVersion.name}`}
            </span>
          ) : (
            <span>No versions available</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrevious}
            disabled={currentIndex >= versions.length - 1}
            className="p-1 hover:bg-theme-bg-tertiary rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous version"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex <= 0}
            className="p-1 hover:bg-theme-bg-tertiary rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next version"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleApply}
            className="p-1 hover:bg-theme-bg-tertiary rounded text-theme-text-success"
            title="Apply this version"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-theme-bg-tertiary rounded text-theme-text-error"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {currentVersion && (
        <div className="text-xs text-theme-text-secondary">
          Created: {new Date(currentVersion.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}