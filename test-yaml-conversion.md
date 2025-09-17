# YAML to JSON Conversion Test Plan

This document outlines test cases for verifying the YAML to JSON conversion functionality in the JQ Playground application.

## Test Cases

### 1. Valid YAML Conversion

#### Test Case 1.1: Simple YAML Object
1. Paste the following YAML into the JSON Input editor:
```yaml
name: John Doe
age: 30
isActive: true
```
2. Verify that:
   - The YAML is automatically converted to JSON
   - A success notification appears
   - The converted JSON is valid and correctly formatted
   - Expected result: `{"name":"John Doe","age":30,"isActive":true}`

#### Test Case 1.2: Complex YAML with Nested Structures
1. Paste the following YAML into the JSON Input editor:
```yaml
person:
  name: John Doe
  age: 30
  address:
    street: 123 Main St
    city: Anytown
    zip: 12345
  hobbies:
    - Reading
    - Hiking
    - Coding
```
2. Verify that:
   - The YAML is automatically converted to JSON
   - A success notification appears
   - The converted JSON is valid and correctly formatted with nested objects and arrays

#### Test Case 1.3: YAML File Upload
1. Upload the `test-yaml.yml` file
2. Verify that:
   - The YAML is automatically converted to JSON
   - A success notification appears
   - The converted JSON is valid and correctly formatted

### 2. Invalid YAML Handling

#### Test Case 2.1: Malformed YAML
1. Paste the following malformed YAML into the JSON Input editor:
```yaml
name: John Doe
age: 30
  nested:
    this is improperly indented
```
2. Verify that:
   - An error notification appears with a clear error message
   - The original content remains in the editor
   - The error message indicates the specific YAML parsing issue

#### Test Case 2.2: Empty Content
1. Clear the editor content
2. Click the "Convert to JSON" button in the action menu
3. Verify that:
   - An appropriate error message is displayed
   - The empty content remains in the editor

### 3. Edge Cases

#### Test Case 3.1: YAML with Non-Object Root
1. Paste the following YAML with a string root into the JSON Input editor:
```yaml
- just a string item
- another string item
```
2. Verify that:
   - The YAML is correctly converted to a JSON array
   - A success notification appears

#### Test Case 3.2: YAML with Special Characters
1. Paste the following YAML with special characters into the JSON Input editor:
```yaml
description: |
  This is a multiline text
  that spans multiple lines
  and preserves line breaks.
specialChars: "quotes, commas, & ampersands"
```
2. Verify that:
   - The YAML is correctly converted to JSON
   - Special characters are properly escaped in the JSON
   - A success notification appears

#### Test Case 3.3: Very Large YAML
1. Create a large YAML file (e.g., with many repeated elements)
2. Upload the file
3. Verify that:
   - The YAML is correctly converted to JSON
   - The application remains responsive
   - A success notification appears

### 4. User Interface Interaction

#### Test Case 4.1: Convert to JSON Button
1. Paste invalid JSON but valid YAML into the editor
2. Verify that the "Convert to JSON" button appears in the action menu
3. Click the button
4. Verify that:
   - The YAML is converted to JSON
   - A success notification appears
   - The action menu closes

#### Test Case 4.2: Dismissing Notifications
1. Trigger a YAML conversion (success or error)
2. Click the dismiss button on the notification
3. Verify that the notification disappears

#### Test Case 4.3: Automatic Conversion on Paste
1. Copy YAML content
2. Paste it into the editor
3. Verify that:
   - The YAML is automatically converted to JSON
   - A success notification appears

## Regression Testing

Ensure that the following functionality still works correctly:

1. JSON validation for valid JSON input
2. JSON formatting and minification
3. File uploads for JSON files
4. Row mode for arrays
5. Tree view for JSON objects

## Notes for Developers

- If any test fails, document the specific failure scenario, expected behavior, and actual behavior
- Pay attention to error messages - they should be clear and helpful to users
- Verify that the application remains responsive during all operations
- Check console logs for any unexpected errors or warnings