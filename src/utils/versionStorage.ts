export interface JqVersion {
  id: string;
  timestamp: number;
  name: string;
  jsonInput: string;
  jqQuery: string;
  output: string;
  isAutoSave?: boolean;
}

const STORAGE_KEY = 'jq-editor-versions';
const MAX_VERSIONS = 50; // Keep last 50 versions

export class VersionStorage {
  static getVersions(): JqVersion[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static getMostRecentVersion(excludeAutoSave: boolean = false): JqVersion | null {
    const versions = this.getVersions();
    if (excludeAutoSave) {
      const manualVersions = versions.filter(v => !v.isAutoSave);
      return manualVersions.length > 0 ? manualVersions[0] : null;
    }
    return versions.length > 0 ? versions[0] : null;
  }

  static saveVersion(version: Omit<JqVersion, 'id' | 'timestamp'>): JqVersion {
    const versions = this.getVersions();
    
    // Check if there's a previous version with the same jqQuery
    const mostRecentVersion = versions.length > 0 ? versions[0] : null;
    
    // Only save if there's no previous version or the jqQuery is different
    if (!mostRecentVersion || mostRecentVersion.jqQuery !== version.jqQuery) {
      const newVersion: JqVersion = {
        ...version,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      // Add to beginning of array
      versions.unshift(newVersion);

      // Keep only the most recent versions
      if (versions.length > MAX_VERSIONS) {
        versions.splice(MAX_VERSIONS);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
      return newVersion;
    }
    
    // If the jqQuery is the same as the most recent version, return that version
    return mostRecentVersion;
  }

  static deleteVersion(id: string): void {
    const versions = this.getVersions().filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
  }

  static updateVersionName(id: string, name: string): void {
    const versions = this.getVersions();
    const version = versions.find(v => v.id === id);
    if (version) {
      version.name = name;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
    }
  }

  static downloadVersion(version: JqVersion, type: 'json' | 'jq' | 'both' = 'both'): void {
    const timestamp = new Date(version.timestamp).toISOString().slice(0, 19).replace(/:/g, '-');
    
    if (type === 'json' || type === 'both') {
      this.downloadFile(
        version.output || version.jsonInput,
        `jq-output-${timestamp}.json`,
        'application/json'
      );
    }
    
    if (type === 'jq' || type === 'both') {
      const jqContent = `# jq Query saved on ${new Date(version.timestamp).toLocaleString()}\n# Name: ${version.name}\n\n${version.jqQuery}`;
      this.downloadFile(
        jqContent,
        `jq-query-${timestamp}.jq`,
        'text/plain'
      );
    }
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static exportAllVersions(): void {
    const versions = this.getVersions();
    const exportData = {
      exportDate: new Date().toISOString(),
      versions: versions
    };
    
    this.downloadFile(
      JSON.stringify(exportData, null, 2),
      `jq-versions-export-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
  }

  static importVersions(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);
          
          if (!importData.versions || !Array.isArray(importData.versions)) {
            throw new Error('Invalid import file format');
          }

          const currentVersions = this.getVersions();
          const newVersions = importData.versions.map((v: any) => ({
            ...v,
            id: crypto.randomUUID(), // Generate new IDs to avoid conflicts
          }));

          const allVersions = [...newVersions, ...currentVersions];
          
          // Keep only the most recent versions
          if (allVersions.length > MAX_VERSIONS) {
            allVersions.splice(MAX_VERSIONS);
          }

          localStorage.setItem(STORAGE_KEY, JSON.stringify(allVersions));
          resolve(newVersions.length);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Checks if a version is a renamed/special version
   * A version is considered renamed/special if:
   * 1. It's not an auto-save
   * 2. Its name doesn't match the default naming patterns
   */
  static isRenamedOrSpecialVersion(version: JqVersion): boolean {
    // Check if it's not an auto-save
    if (version.isAutoSave) {
      return false;
    }
    
    // Check if the name doesn't match default patterns
    const defaultPatterns = [
      /^Auto-save/,
      /^Quick Save/,
      /^Version/
    ];
    
    return !defaultPatterns.some(pattern => pattern.test(version.name));
  }

  /**
   * Clears all versions from storage
   * @param keepRenamed If true, renamed/special versions will be kept
   */
  static clearAllVersions(keepRenamed: boolean = false): void {
    if (!keepRenamed) {
      // Clear all versions
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return;
    }
    
    // Keep renamed/special versions
    const versions = this.getVersions();
    const renamedVersions = versions.filter(v => this.isRenamedOrSpecialVersion(v));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(renamedVersions));
  }
}