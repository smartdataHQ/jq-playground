# ContextSuite JSON Schemas

This directory contains JSON Schemas that define the structure and constraints for various data objects within the ContextSuite ecosystem. These schemas are crucial for data validation, ensuring consistency, and providing clear data contracts for producers and consumers.

## Overview

The schemas are designed based on a combination of:
-   **Avro schemas (`.avsc` files)**: Considered the primary source of truth for data structure and field definitions.
-   **Pydantic models**: Used within the Python applications for data validation and manipulation.

All schemas adhere to the **JSON Schema Draft 2020-12** specification.

## Main Schema

The root schema that acts as an entry point and references all primary data type schemas is:
-   **`cxs_schema.json`**: Contains references to `entity.json`, `semantic_event.json`, `timeseries.json`, `data_point.json`, and `uom.json`.

## Structure

The schemas are organized into:
1.  **Primary Object Schemas**: Define the top-level data types.
    *   `entity.json`: Describes entities (e.g., people, places, organizations, products).
    *   `semantic_event.json`: Describes events that occur within the system, often related to entities. This is a rich schema with many nested properties.
    *   `timeseries.json`: Describes metadata for time series.
    *   `data_point.json`: Describes individual data points within a time series.
    *   `uom.json`: Describes Units of Measure.
2.  **Shared/Nested Object Schemas**: Define common data structures that are reused across multiple primary schemas (e.g., `location_schema.json`, `classification_schema.json`) or complex properties within a single primary schema (e.g., `product_schema.json` nested within `commerce_schema.json`). These are referenced from the primary schemas using the `$ref` keyword.

## Key Principles

-   **Avro as Source of Truth**: Where discrepancies existed between data definitions (Avro, Pydantic), the Avro schema definition was prioritized for structure and nullability in the JSON schemas.
-   **Optionality and Nullability**: Fields are generally made nullable (e.g., `type: ["null", "string"]`) and excluded from `required` arrays if they are optional in Avro or Pydantic models, or nullable in SQL. This provides flexibility for data producers. Mandatory fields are explicitly listed in `required` arrays.
-   **Descriptions**: Efforts have been made to include meaningful `description` fields for properties, drawing from Avro `doc` strings, SQL comments, and Pydantic model field descriptions. Further enrichment of these descriptions is an ongoing process.

## Usage

These schemas can be used with any JSON Schema validator to:
-   Validate incoming data against the defined contracts.
-   Generate documentation.
-   Potentially generate code or data entry forms.

A dedicated script is provided to validate all JSON schema files in this directory against the JSON Schema specification (specifically Draft 2020-12, with fallbacks for other drafts).

To validate the schemas, run the following command from the `cxs-schema` directory:

```bash
python validate_json_schemas.py
```
This script will check each `.json` file and report any validation errors or JSON formatting issues.

## List of Schemas

(This section could be auto-generated or manually curated in more detail if needed)

**Root:**
- `cxs_schema.json`

**Primary Types:**
- `entity.json`
- `semantic_event.json`
- `timeseries.json`
- `data_point.json`
- `uom.json`

**Selected Shared/Nested Types (illustrative, not exhaustive):**
- `location_schema.json`
- `classification_schema.json`
- `id_schema.json`
- `content_schema.json`
- `media_schema.json`
- `embeddings_schema.json`
- `defined_metric_schema.json`
- `involved_schema.json`
- `campaign_schema.json`
- `product_schema.json`
- `commerce_schema.json`
- ... and many more for specific properties of `semantic_event.json`.

Refer to the `$ref` properties within each schema to understand their specific dependencies.
