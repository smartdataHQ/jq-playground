/**
 * Sample JSON schemas for testing and demonstration purposes
 */
import { fetchSchemaFromUrl, resolveSchemaReferences } from './schemaLoader';

// Cache for schemas loaded from the public/schema directory
const schemaCache: Record<string, object> = {};

// Map of schema names to their file paths in the public/schema directory
const schemaFiles: Record<string, string> = {
  'semanticEvent': '/schema/semantic_event.json',
  'product_schema': '/schema/product.json'
};

/**
 * Load a schema from the public/schema directory and cache it
 * @param schemaName The name of the schema to load
 * @returns A promise that resolves to the schema object or null if not found
 */
export async function loadSchemaByName(schemaName: string): Promise<object | null> {
  // If the schema is already in the cache, return it
  if (schemaCache[schemaName]) {
    return schemaCache[schemaName];
  }
  
  // If the schema is in the schemaFiles map, load it from the public directory
  if (schemaFiles[schemaName]) {
    try {
      // Construct the full URL to the schema file
      const schemaUrl = window.location.origin + schemaFiles[schemaName];
      console.log(`Loading schema ${schemaName} from ${schemaUrl}`);
      
      // Fetch the schema
      const schema = await fetchSchemaFromUrl(schemaUrl);
      
      // Resolve all references in the schema
      console.log(`Resolving references in schema ${schemaName}`);
      const resolvedSchema = await resolveSchemaReferences(schema as Record<string, unknown>, schemaUrl);
      
      // Cache the resolved schema
      schemaCache[schemaName] = resolvedSchema;
      
      return resolvedSchema;
    } catch (error) {
      console.error(`Error loading schema ${schemaName}:`, error);
      return null;
    }
  }
  
  return null;
}

/**
 * Simple user schema with basic properties
 */
export const userSchema = {
  type: "object",
  properties: {
    name: { 
      type: "string",
      description: "The user's full name"
    },
    email: { 
      type: "string", 
      format: "email",
      description: "The user's email address"
    },
    age: { 
      type: "integer",
      minimum: 0,
      description: "The user's age in years"
    },
    roles: {
      type: "array",
      items: { 
        type: "string", 
        enum: ["admin", "user", "guest"],
        description: "User role"
      },
      description: "List of roles assigned to the user"
    }
  },
  required: ["name", "email"],
  additionalProperties: false
};

/**
 * Product schema with nested objects
 */
export const productSchema = {
  type: "object",
  properties: {
    id: { 
      type: "string",
      description: "Unique product identifier"
    },
    name: { 
      type: "string",
      description: "Product name"
    },
    price: { 
      type: "number",
      minimum: 0,
      description: "Product price in USD"
    },
    category: { 
      type: "string",
      enum: ["electronics", "clothing", "food", "books"],
      description: "Product category"
    },
    inStock: { 
      type: "boolean",
      description: "Whether the product is in stock"
    },
    details: {
      type: "object",
      properties: {
        description: { 
          type: "string",
          description: "Detailed product description"
        },
        manufacturer: { 
          type: "string",
          description: "Product manufacturer"
        },
        weight: { 
          type: "number",
          description: "Product weight in kg"
        },
        dimensions: {
          type: "object",
          properties: {
            width: { type: "number" },
            height: { type: "number" },
            depth: { type: "number" }
          },
          description: "Product dimensions in cm"
        }
      },
      description: "Additional product details"
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "Product tags for categorization"
    }
  },
  required: ["id", "name", "price"],
  additionalProperties: false
};

/**
 * Array of items schema
 */
export const itemsArraySchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { 
        type: "integer",
        description: "Item identifier"
      },
      name: { 
        type: "string",
        description: "Item name"
      },
      value: { 
        type: "number",
        description: "Item value"
      }
    },
    required: ["id", "name"],
    additionalProperties: false
  },
  description: "Array of items"
};

/**
 * Get a schema by name
 * @param schemaName The name of the schema to retrieve
 * @returns The schema object or null if not found
 */
export function getSchemaByName(schemaName: string): object | null {
  // Check if the schema is in the cache
  if (schemaCache[schemaName]) {
    return schemaCache[schemaName];
  }
  
  // Check for built-in schemas
  switch (schemaName) {
    case 'user':
      return userSchema;
    case 'product':
      return productSchema;
    case 'itemsArray':
      return itemsArraySchema;
    default:
      // If the schema is in the schemaFiles map but not in the cache,
      // it needs to be loaded asynchronously using loadSchemaByName
      if (schemaFiles[schemaName]) {
        console.log(`Schema ${schemaName} needs to be loaded asynchronously`);
        // Return null for now, the component should use loadSchemaByName
        return null;
      }
      return null;
  }
}

/**
 * Get all available schema names
 * @returns Array of schema names
 */
export function getAvailableSchemas(): string[] {
  return ['user', 'product', 'itemsArray', 'semanticEvent', 'product_schema'];
}

/**
 * Get sample data for a schema
 * @param schemaName The name of the schema to get sample data for
 * @returns Sample data object or null if not found
 */
export function getSampleData(schemaName: string): object | null {
  switch (schemaName) {
    case 'user':
      return {
        name: "John Doe",
        email: "john.doe@example.com",
        age: 30,
        roles: ["user", "admin"]
      };
    case 'product':
      return {
        id: "prod-123",
        name: "Smartphone",
        price: 599.99,
        category: "electronics",
        inStock: true,
        details: {
          description: "Latest model with high-resolution camera",
          manufacturer: "TechCorp",
          weight: 0.18,
          dimensions: {
            width: 7.1,
            height: 14.6,
            depth: 0.8
          }
        },
        tags: ["smartphone", "camera", "5G"]
      };
    case 'itemsArray':
      return [
        { id: 1, name: "Item 1", value: 10.5 },
        { id: 2, name: "Item 2", value: 20.75 },
        { id: 3, name: "Item 3", value: 30.0 }
      ];
    case 'semanticEvent':
      return {
        "id": "event-123",
        "timestamp": "2025-07-27T22:15:00Z",
        "type": "page_view",
        "source": "web",
        "context": {
          "page": {
            "url": "https://example.com/products",
            "title": "Product Catalog",
            "referrer": "https://example.com/home"
          },
          "user_agent": {
            "browser": "Chrome",
            "os": "macOS"
          }
        },
        "traits": {
          "user_id": "user-456",
          "email": "user@example.com"
        }
      };
    case 'product_schema':
      return {
        "id": "prod-456",
        "name": "Premium Headphones",
        "description": "Noise-cancelling wireless headphones",
        "price": 299.99,
        "currency": "USD",
        "category": "Electronics",
        "subcategory": "Audio",
        "sku": "HDPHN-001",
        "brand": "AudioTech",
        "availability": "in_stock",
        "image_url": "https://example.com/images/headphones.jpg"
      };
    default:
      return null;
  }
}