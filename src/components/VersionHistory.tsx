import React, { useState, useEffect } from 'react';
import { 
  History, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Clock, 
  FileText,
  Upload,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { VersionStorage, JqVersion } from '../utils/versionStorage';

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadVersion: (version: JqVersion) => void;
  onLoadJqScriptOnly: (version: JqVersion) => void;
  currentState: {
    jsonInput: string;
    jqQuery: string;
    output: string;
  };
}

export function VersionHistory({ isOpen, onClose, onLoadVersion, onLoadJqScriptOnly, currentState }: VersionHistoryProps) {
  const [versions, setVersions] = useState<JqVersion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [keepRenamedVersions, setKeepRenamedVersions] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setVersions(VersionStorage.getVersions());
    }
  }, [isOpen]);

  const handleSaveCurrentVersion = () => {
    const name = `Version ${new Date().toLocaleString()}`;
    VersionStorage.saveVersion({
      name,
      jsonInput: currentState.jsonInput,
      jqQuery: currentState.jqQuery,
      output: currentState.output,
    });
    setVersions(VersionStorage.getVersions());
  };

  const handleDeleteVersion = (id: string) => {
    VersionStorage.deleteVersion(id);
    setVersions(VersionStorage.getVersions());
  };

  const handleStartEdit = (version: JqVersion) => {
    setEditingId(version.id);
    setEditingName(version.name);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      VersionStorage.updateVersionName(editingId, editingName);
      setVersions(VersionStorage.getVersions());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDownload = (version: JqVersion, type: 'json' | 'jq' | 'both') => {
    VersionStorage.downloadVersion(version, type);
  };

  const handleExportAll = () => {
    VersionStorage.exportAllVersions();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      VersionStorage.importVersions(file)
        .then((count) => {
          alert(`Successfully imported ${count} versions`);
          setVersions(VersionStorage.getVersions());
        })
        .catch((error) => {
          alert(`Import failed: ${error.message}`);
        });
    }
    // Reset input
    event.target.value = '';
  };

  const handleClearAllVersions = () => {
    setShowClearConfirmation(true);
  };

  const confirmClearAllVersions = () => {
    VersionStorage.clearAllVersions(keepRenamedVersions);
    // Refresh the versions list after clearing
    setVersions(VersionStorage.getVersions());
    setShowClearConfirmation(false);
  };

  const cancelClearAllVersions = () => {
    setShowClearConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Confirmation Dialog */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-theme-bg-secondary rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-theme-text-warning" />
              <h3 className="text-lg font-semibold">Clear All Versions?</h3>
            </div>
            <p className="text-theme-text-primary mb-4">
              Are you sure you want to delete all {versions.length} saved versions? This action cannot be undone.
            </p>
            
            {/* Option to keep renamed/special versions */}
            <div className="bg-theme-bg-tertiary rounded-lg p-3 mb-6">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepRenamedVersions}
                  onChange={(e) => setKeepRenamedVersions(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-theme-text-accent">Keep renamed/special versions</p>
                  <p className="text-xs text-theme-text-secondary mt-1">
                    Versions with custom names that you've manually renamed will be preserved.
                    Auto-saved versions and versions with default names will still be deleted.
                  </p>
                </div>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelClearAllVersions}
                className="px-4 py-2 bg-theme-button-secondary-bg hover:bg-theme-button-secondary-hover rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAllVersions}
                className="px-4 py-2 bg-theme-button-danger-bg hover:bg-theme-button-danger-hover rounded transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-theme-bg-secondary rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border-primary">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-theme-text-accent" />
            <h2 className="text-xl font-semibold">Version History</h2>
            <span className="text-sm text-theme-text-secondary">({versions.length} versions)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveCurrentVersion}
              className="px-3 py-1.5 bg-theme-button-primary-bg hover:bg-theme-button-primary-hover rounded text-sm transition-colors"
            >
              Save Current
            </button>
            <button
              onClick={handleExportAll}
              className="px-3 py-1.5 bg-theme-button-success-bg hover:bg-theme-button-success-hover rounded text-sm transition-colors flex items-center space-x-1"
            >
              <Archive className="w-4 h-4" />
              <span>Export All</span>
            </button>
            <label className="px-3 py-1.5 bg-theme-button-primary-bg hover:bg-theme-button-primary-hover rounded text-sm transition-colors cursor-pointer flex items-center space-x-1">
              <Upload className="w-4 h-4" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            {versions.length > 0 && (
              <button
                onClick={handleClearAllVersions}
                className="px-3 py-1.5 bg-theme-button-danger-bg hover:bg-theme-button-danger-hover rounded text-sm transition-colors flex items-center space-x-1"
                title="Clear all saved versions"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-theme-bg-tertiary rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto p-4">
          {versions.length === 0 ? (
            <div className="text-center text-theme-text-secondary py-8">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No versions saved yet</p>
              <p className="text-sm">Save your current work to start building version history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="bg-theme-bg-tertiary rounded-lg p-4 hover:bg-theme-bg-tertiary/80 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingId === version.id ? (
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit();
                              }
                            }}
                            className="bg-theme-bg-primary border border-theme-border-secondary rounded px-2 py-1 text-sm flex-1"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 hover:bg-theme-bg-primary rounded text-theme-text-success"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 hover:bg-theme-bg-primary rounded text-theme-text-error"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{version.name}</h3>
                          {version.isAutoSave && (
                            <span className="text-xs bg-theme-bg-primary px-2 py-0.5 rounded">Auto</span>
                          )}
                          <button
                            onClick={() => handleStartEdit(version)}
                            className="p-1 hover:bg-theme-bg-primary rounded text-theme-text-secondary"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-theme-text-secondary mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(version.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>{version.jqQuery.length} chars</span>
                        </div>
                      </div>

                      <div className="text-sm text-theme-text-primary mb-3">
                        <div className="bg-theme-bg-secondary rounded p-2 font-mono text-xs">
                          {version.jqQuery.length > 100 
                            ? `${version.jqQuery.substring(0, 100)}...` 
                            : version.jqQuery}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={() => onLoadVersion(version)}
                        className="px-3 py-1.5 bg-theme-button-primary-bg hover:bg-theme-button-primary-hover rounded text-sm transition-colors"
                      >
                        Load All
                      </button>
                      <button
                        onClick={() => onLoadJqScriptOnly(version)}
                        className="px-3 py-1.5 bg-theme-button-success-bg hover:bg-theme-button-success-hover rounded text-sm transition-colors"
                        title="Load only the jq script without changing the JSON input"
                      >
                        Load jq Only
                      </button>
                      
                      <div className="relative group">
                        <button className="p-1.5 hover:bg-theme-bg-primary rounded transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-theme-bg-primary border border-theme-border-secondary rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="p-1">
                            <button
                              onClick={() => handleDownload(version, 'json')}
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded nowrap"
                            >
                              Download JSON
                            </button>
                            <button
                              onClick={() => handleDownload(version, 'jq')}
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded"
                            >
                              Download jq Query
                            </button>
                            <button
                              onClick={() => handleDownload(version, 'both')}
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-theme-bg-tertiary rounded"
                            >
                              Download Both
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVersion(version.id)}
                        className="p-1.5 hover:bg-theme-bg-primary rounded transition-colors text-theme-text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}