export const sampleJsons = {
  users: `{
  "users": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "age": 28,
      "city": "New York",
      "role": "developer",
      "skills": ["JavaScript", "React", "Node.js"],
      "active": true,
      "joinDate": "2023-01-15",
      "profile": {
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
        "bio": "Full-stack developer with 5 years of experience",
        "social": {
          "github": "alice-dev",
          "linkedin": "alice-johnson"
        }
      }
    },
    {
      "id": 2,
      "name": "Bob Smith",
      "email": "bob@example.com",
      "age": 32,
      "city": "San Francisco",
      "role": "designer",
      "skills": ["Figma", "Sketch", "Adobe XD"],
      "active": true,
      "joinDate": "2022-11-20",
      "profile": {
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
        "bio": "UI/UX designer passionate about user experience",
        "social": {
          "dribbble": "bob-designs",
          "behance": "bob-smith"
        }
      }
    },
    {
      "id": 3,
      "name": "Carol Wilson",
      "email": "carol@example.com",
      "age": 24,
      "city": "Austin",
      "role": "developer",
      "skills": ["Python", "Django", "PostgreSQL"],
      "active": false,
      "joinDate": "2023-06-10",
      "profile": {
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
        "bio": "Backend developer specializing in Python",
        "social": {
          "github": "carol-py",
          "twitter": "carol_codes"
        }
      }
    }
  ],
  "metadata": {
    "total": 3,
    "lastUpdated": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}`,

  products: `{
  "products": [
    {
      "id": "p001",
      "name": "Wireless Headphones",
      "price": 89.99,
      "category": "Electronics",
      "brand": "AudioTech",
      "inStock": true,
      "quantity": 150,
      "rating": 4.5,
      "reviews": 1247,
      "tags": ["wireless", "bluetooth", "music"],
      "specs": {
        "color": "Black",
        "batteryLife": "30 hours",
        "connectivity": ["Bluetooth 5.0", "3.5mm jack"],
        "weight": "250g"
      },
      "images": [
        "https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg",
        "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg"
      ]
    },
    {
      "id": "p002",
      "name": "Smart Watch",
      "price": 199.99,
      "category": "Electronics",
      "brand": "TechTime",
      "inStock": true,
      "quantity": 75,
      "rating": 4.2,
      "reviews": 892,
      "tags": ["smartwatch", "fitness", "health"],
      "specs": {
        "color": "Silver",
        "batteryLife": "7 days",
        "waterproof": "IP68",
        "display": "1.4 inch OLED"
      },
      "images": [
        "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg"
      ]
    },
    {
      "id": "p003",
      "name": "Coffee Mug",
      "price": 12.99,
      "category": "Home",
      "brand": "CupCraft",
      "inStock": false,
      "quantity": 0,
      "rating": 4.8,
      "reviews": 156,
      "tags": ["ceramic", "dishwasher-safe", "gift"],
      "specs": {
        "color": "White",
        "capacity": "350ml",
        "material": "Ceramic",
        "microwaveSafe": true
      },
      "images": [
        "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg"
      ]
    }
  ],
  "categories": ["Electronics", "Home", "Fashion", "Sports"],
  "totalProducts": 3,
  "lastSync": "2024-01-15T14:22:00Z"
}`,

  logs: `{
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:15.123Z",
      "level": "info",
      "message": "User authentication successful",
      "userId": "user123",
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "responseTime": 145,
      "endpoint": "/api/login",
      "method": "POST"
    },
    {
      "timestamp": "2024-01-15T10:31:22.456Z",
      "level": "error",
      "message": "Database connection failed",
      "error": {
        "code": "ECONNREFUSED",
        "message": "Connection refused by database server",
        "stack": "Error: ECONNREFUSED\\n    at TCPConnectWrap.afterConnect"
      },
      "retryAttempt": 3,
      "endpoint": "/api/users",
      "method": "GET"
    },
    {
      "timestamp": "2024-01-15T10:32:08.789Z",
      "level": "warn",
      "message": "High memory usage detected",
      "memoryUsage": {
        "used": "1.2GB",
        "total": "2GB",
        "percentage": 60
      },
      "pid": 1234,
      "service": "api-server"
    },
    {
      "timestamp": "2024-01-15T10:33:45.012Z",
      "level": "info",
      "message": "API request processed",
      "userId": "user456",
      "ip": "10.0.0.15",
      "responseTime": 89,
      "endpoint": "/api/products",
      "method": "GET",
      "statusCode": 200
    },
    {
      "timestamp": "2024-01-15T10:34:12.345Z",
      "level": "error",
      "message": "Invalid request parameters",
      "error": {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      },
      "endpoint": "/api/register",
      "method": "POST",
      "statusCode": 400
    }
  ],
  "summary": {
    "totalLogs": 5,
    "errorCount": 2,
    "warnCount": 1,
    "infoCount": 2,
    "timeRange": {
      "start": "2024-01-15T10:30:15.123Z",
      "end": "2024-01-15T10:34:12.345Z"
    }
  }
}`
};