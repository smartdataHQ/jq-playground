# JSON Schema Best Practices for Monaco Editor

This document outlines the best practices for serving JSON Schema files with Monaco Editor in the JQ Playground application.

## Overview

The Monaco Editor (which powers VS Code) uses JSON Schema for validation and autocompletion of JSON documents. To properly use JSON Schema with Monaco Editor, several considerations must be taken into account:

1. Schema identification and resolution
2. Handling schema references
3. Proper registration of schemas with Monaco Editor

## Implementation Details

### Schema Identification

Each JSON Schema should have:

- A `$schema` property that identifies the JSON Schema version (e.g., `https://json-schema.org/draft/2020-12/schema`)
- An `$id` property that provides a unique identifier for the schema (e.g., `https://contextsuite.com/schemas/semantic_event.json`)

The `$id` is particularly important as it serves as the base URI for resolving relative references within the schema.

### Schema References

JSON Schema allows referencing other schemas using the `$ref` property. These references can be:

- Absolute URLs (e.g., `https://example.com/schemas/address.json`)
- Relative URLs (e.g., `address.json`)
- JSON Pointers (e.g., `#/definitions/address`)

For Monaco Editor to properly resolve these references, we've implemented a reference resolution mechanism that:

1. Recursively traverses the schema to find all `$ref` properties
2. Resolves relative references against the schema's base URL (derived from the `$id` or the URL where the schema was loaded from)
3. Fetches referenced schemas and inlines them into the main schema
4. Caches fetched schemas to avoid duplicate requests

### Monaco Editor Integration

When registering a schema with Monaco Editor, we:

1. Use the schema's `$id` as the URI when registering it with Monaco Editor
2. Pre-resolve all references in the schema before passing it to Monaco Editor
3. Enable schema request support in Monaco Editor to handle any remaining references

## Changes Made

The following changes were made to improve JSON Schema handling:

1. **Schema Loading**: Updated `loadSchemaByName` in `sampleSchemas.ts` to resolve schema references before returning the schema.

2. **Schema Registration**: Modified `applySchemaToEditor` in both `JsonInput.tsx` and `JsonOutput.tsx` to use the schema's `$id` as the URI when registering it with Monaco Editor.

3. **Reference Resolution**: Added `resolveSchemaReferences` function to `schemaLoader.ts` to recursively resolve all references in a schema.

4. **Testing**: Created a test page at `/public/test-schema-resolution.html` to verify schema loading and reference resolution.

## Best Practices for Schema Authors

When creating JSON Schema files for use with Monaco Editor:

1. Always include a `$schema` property to identify the JSON Schema version.
2. Always include an `$id` property that matches the URL where the schema is served.
3. Use absolute URLs for `$ref` properties when referencing external schemas.
4. For relative references, ensure they can be resolved against the schema's `$id`.
5. Consider bundling related schemas into a single file to reduce the number of HTTP requests.

## Testing

You can test the schema loading and reference resolution by:

1. Opening `/test-schema-resolution.html` in a browser
2. Clicking the test buttons to verify schema loading and reference resolution
3. Checking the browser console for detailed logs

## Future Improvements

Potential future improvements include:

1. Implementing a schema bundling tool to combine related schemas into a single file
2. Adding support for schema versioning
3. Improving error handling for schema loading and reference resolution
4. Adding a schema validation tool to verify schemas before serving them