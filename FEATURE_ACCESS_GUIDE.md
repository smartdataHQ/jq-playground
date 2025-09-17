# Feature Access Guide

## Version History Features

### Accessing Version History
- Click the "History" button in the top header
- Keyboard shortcut: `Cmd+Shift+O` (Mac) or `Ctrl+Shift+O` (Windows/Linux)

### Saving Versions
- Click the "Save" button in the top header
- Keyboard shortcut: `Cmd+S` (Mac) or `Ctrl+S` (Windows/Linux)
- Note: Versions are only saved when explicitly triggered, not automatically

### Restoring a Version
- Open Version History (see above)
- Click "Load All" to restore both JSON input and jq script
- Click "Load jq Only" to restore just the jq script without changing JSON input

### Browsing Versions in the jq Editor
- Click the "Browse Versions" button in the footer of the jq Editor
- Navigate between versions using the left/right arrows
- Click the checkmark to apply the selected version
- Click the X to cancel

### Renaming Versions
- Open Version History
- Click the pencil icon next to a version name
- Type a new name and press Enter or click the checkmark

### Clearing Version History
- Open Version History
- Click the "Clear All" button
- Choose whether to keep renamed/special versions by checking/unchecking the option
- Confirm by clicking "Clear All" in the dialog

## JSON Input Features

### JSON Actions Menu
- Located in the status bar at the bottom of the JSON Input panel
- Click the blue "Actions Menu" button to open the dropdown menu
- Contains all available actions for the JSON input, including:
  - General actions: Format JSON, Minify JSON, Upload File
  - View mode options: Switch between Editor and Draggable views
  - Row mode controls: Enable/disable Row Mode, navigate between items
  - Array extraction: Extract arrays from objects with a single key
- All actions include their keyboard shortcuts where applicable

### Row Mode for Arrays
- Toggle: Click the "Row Mode" button in the JSON Input panel or use the Actions Menu
- Keyboard shortcut: Press `Alt+L`
- Navigation: Use "Previous" and "Next" buttons or Shift+Left/Right arrows
- Return to full view: Click "Show All" or press `Alt+A`

### Extract Array from Single Key
- When JSON has a structure like `{"data": [1,2,3]}`, use the Actions Menu
- Select "Extract Array" from the Row Mode section of the Actions Menu
- Keyboard shortcut: Press `Alt+E`

## Keyboard Shortcuts

Access the keyboard shortcuts menu by:
- Hovering over the "Shortcuts" button in the top header
- Hovering over the "Keyboard Shortcuts" text in the jq Editor footer

The shortcuts menu shows:
- Row navigation options (only when in Row Mode)
- General shortcuts for saving, history, and array operations