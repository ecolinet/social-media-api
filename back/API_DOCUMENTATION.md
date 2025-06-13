# Social Media Profiles API Documentation

This Laravel API allows authenticated users to manage their social media profiles using OAuth 2 authentication via Laravel Passport.

## Base URL
```
http://localhost:8000/api
```

## Authentication

The API uses OAuth 2.0 with Bearer tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer {your-access-token}
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/register
```

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com"
        },
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
        "token_type": "Bearer"
    }
}
```

#### Login User
```http
POST /api/login
```

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User logged in successfully",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com"
        },
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
        "token_type": "Bearer"
    }
}
```

#### Get User Profile
```http
GET /api/user
```

**Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com"
        }
    }
}
```

#### Logout User
```http
POST /api/logout
```

**Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
    "success": true,
    "message": "User logged out successfully"
}
```

### Social Media Profiles

#### Get All Profiles
```http
GET /api/social-media-profiles
```

**Query Parameters:**
- `platform` (optional): Filter by platform (facebook, twitter, instagram, linkedin, etc.)
- `active` (optional): Filter by active status (true/false)

**Headers:**
```
Authorization: Bearer {access-token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "profiles": [
            {
                "id": 1,
                "platform": "twitter",
                "platform_user_id": "123456789",
                "username": "demo_user",
                "display_name": "Demo User",
                "profile_url": "https://twitter.com/demo_user",
                "avatar_url": "https://pbs.twimg.com/profile_images/demo.jpg",
                "bio": "Software developer and tech enthusiast",
                "additional_data": {
                    "followers_count": 1250,
                    "following_count": 890,
                    "tweets_count": 3456,
                    "verified": false
                },
                "is_active": true,
                "last_synced_at": "2025-06-13T03:55:05.000000Z",
                "created_at": "2025-06-13T03:55:05.000000Z",
                "updated_at": "2025-06-13T03:55:05.000000Z"
            }
        ],
        "total": 1
    }
}
```

#### Create Profile
```http
POST /api/social-media-profiles
```

**Headers:**
```
Authorization: Bearer {access-token}
Content-Type: application/json
```

**Request Body:**
```json
{
    "platform": "twitter",
    "platform_user_id": "123456789",
    "username": "demo_user",
    "display_name": "Demo User",
    "profile_url": "https://twitter.com/demo_user",
    "avatar_url": "https://pbs.twimg.com/profile_images/demo.jpg",
    "bio": "Software developer and tech enthusiast",
    "additional_data": {
        "followers_count": 1250,
        "following_count": 890,
        "tweets_count": 3456,
        "verified": false
    },
    "is_active": true
}
```

**Supported Platforms:**
- facebook
- twitter
- instagram
- linkedin
- youtube
- tiktok
- snapchat
- pinterest

#### Get Single Profile
```http
GET /api/social-media-profiles/{id}
```

#### Update Profile
```http
PUT /api/social-media-profiles/{id}
```

#### Delete Profile
```http
DELETE /api/social-media-profiles/{id}
```

#### Get Profiles by Platform
```http
GET /api/social-media-profiles-by-platform
```

**Response:**
```json
{
    "success": true,
    "data": {
        "profiles_by_platform": {
            "twitter": [
                {
                    "id": 1,
                    "platform": "twitter",
                    "username": "demo_user",
                    "display_name": "Demo User"
                }
            ],
            "linkedin": [
                {
                    "id": 2,
                    "platform": "linkedin",
                    "username": "demo-user",
                    "display_name": "Demo User"
                }
            ]
        },
        "platforms": ["twitter", "linkedin"],
        "total_platforms": 2
    }
}
```

#### Sync Profile Data
```http
POST /api/social-media-profiles/{id}/sync
```

This endpoint is a placeholder for syncing data with external social media APIs.

## Error Responses

### Validation Error (422)
```json
{
    "success": false,
    "message": "Validation errors",
    "errors": {
        "email": ["The email field is required."]
    }
}
```

### Unauthorized (401)
```json
{
    "success": false,
    "message": "Invalid credentials"
}
```

### Not Found (404)
```json
{
    "success": false,
    "message": "Profile not found"
}
```

### Conflict (409)
```json
{
    "success": false,
    "message": "Profile for this platform already exists. Use PUT to update."
}
```

## Demo User

For testing purposes, a demo user is available:

**Email:** demo@example.com  
**Password:** password123

This user has sample social media profiles for Twitter, LinkedIn, Instagram, and Facebook.

## Health Check

```http
GET /api/health
```

**Response:**
```json
{
    "success": true,
    "message": "API is running",
    "timestamp": "2025-06-13T03:55:05.000000Z"
}
```