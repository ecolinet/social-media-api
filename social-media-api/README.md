# Social Media Profiles API

A Laravel API that allows authenticated users to manage their social media profiles using OAuth 2 authentication via Laravel Passport.

## 🚀 Features

- **OAuth 2 Authentication** using Laravel Passport
- **User Registration & Login** with JWT tokens
- **Social Media Profile Management** (CRUD operations)
- **Multiple Platform Support** (Twitter, Facebook, Instagram, LinkedIn, YouTube, TikTok, etc.)
- **Profile Grouping by Platform**
- **Profile Synchronization** endpoints
- **Comprehensive API Documentation**
- **Interactive Demo Interface**

## 🛠️ Tech Stack

- **Backend**: Laravel 11
- **Authentication**: Laravel Passport (OAuth 2)
- **Database**: SQLite (for demo)
- **API**: RESTful JSON API
- **Documentation**: Markdown + Interactive Demo

## 📋 Requirements

- PHP 8.2+
- Composer
- Laravel 11
- SQLite

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-api
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Run migrations and seed data**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

5. **Install Passport**
   ```bash
   php artisan passport:install
   php artisan passport:client --personal
   ```

6. **Start the server**
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```


## Docker Setup (Recommended)

For a containerized environment, use Docker:

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# The API will be available at http://localhost:8080
```

**Docker Features:**
- Complete containerized environment
- Auto-setup with migrations and seeding
- SQLite database (no external dependencies)
- Production-ready with nginx + PHP-FPM
- Built-in health checks

For detailed Docker documentation, see: [DOCKER.md](DOCKER.md)

## 🎯 API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `GET /api/user` - Get authenticated user profile
- `POST /api/logout` - Logout user

### Social Media Profiles
- `GET /api/social-media-profiles` - Get all user's profiles
- `POST /api/social-media-profiles` - Create new profile
- `GET /api/social-media-profiles/{id}` - Get specific profile
- `PUT /api/social-media-profiles/{id}` - Update profile
- `DELETE /api/social-media-profiles/{id}` - Delete profile
- `GET /api/social-media-profiles-by-platform` - Get profiles grouped by platform
- `POST /api/social-media-profiles/{id}/sync` - Sync profile data

### Health Check
- `GET /api/health` - API health status

## 🔐 Authentication

The API uses OAuth 2.0 with Bearer tokens. Include the token in the Authorization header:

```bash
Authorization: Bearer {your-access-token}
```

## 📱 Demo User

For testing purposes, a demo user is available:

- **Email**: `demo@example.com`
- **Password**: `password123`

This user has sample social media profiles for Twitter, LinkedIn, Instagram, and Facebook.

## 🌐 Interactive Demo

Visit `/demo.html` for an interactive web interface to test the API:

```
http://localhost:8000/demo.html
```

## 📖 API Documentation

### OpenAPI Specification
The API is fully documented using OpenAPI 3.0 specification:

- **Swagger UI Documentation**: `/docs.html` - Interactive API documentation
- **OpenAPI YAML**: `/api/openapi.yaml` - Machine-readable API specification
- **OpenAPI JSON**: `/api/openapi.json` - JSON format API specification
- **Detailed Documentation**: `API_DOCUMENTATION.md` - Comprehensive API guide

### Quick Access
```
http://localhost:8000/docs.html     # Interactive Swagger UI
http://localhost:8000/demo.html     # Interactive Demo Interface
http://localhost:8000/api/openapi.yaml  # OpenAPI Specification
```

## 🧪 Testing

### Manual Testing with cURL

1. **Login**
   ```bash
   curl -X POST http://localhost:8000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"demo@example.com","password":"password123"}'
   ```

2. **Get Profiles** (replace TOKEN with actual token)
   ```bash
   curl -X GET http://localhost:8000/api/social-media-profiles \
     -H "Authorization: Bearer TOKEN"
   ```

3. **Create Profile**
   ```bash
   curl -X POST http://localhost:8000/api/social-media-profiles \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "platform": "youtube",
       "platform_user_id": "UC123456789",
       "username": "demo_channel",
       "display_name": "Demo Channel",
       "profile_url": "https://youtube.com/c/demo_channel",
       "bio": "Tech tutorials and reviews",
       "is_active": true
     }'
   ```

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - User's email (unique)
- `password` - Hashed password
- `timestamps`

### Social Media Profiles Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `platform` - Social media platform (enum)
- `platform_user_id` - User ID on the platform
- `username` - Username on the platform
- `display_name` - Display name
- `profile_url` - Profile URL
- `avatar_url` - Avatar image URL
- `bio` - Profile bio/description
- `additional_data` - JSON field for platform-specific data
- `is_active` - Boolean flag
- `last_synced_at` - Last synchronization timestamp
- `timestamps`

## 🔧 Configuration

### Supported Platforms
- Facebook
- Twitter
- Instagram
- LinkedIn
- YouTube
- TikTok
- Snapchat
- Pinterest

### Token Lifetimes
- Access tokens: 15 days
- Refresh tokens: 30 days
- Personal access tokens: 6 months

## 🚀 Deployment

For production deployment:

1. Set up a proper database (MySQL/PostgreSQL)
2. Configure environment variables
3. Set up SSL/HTTPS
4. Configure CORS if needed
5. Set up proper logging
6. Configure rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## 🆘 Support

For support or questions:
- Check the API documentation
- Use the interactive demo interface
- Review the code examples
- Open an issue on GitHub

## 🤖 OpenAPI Model Generation

The API includes an advanced model generation system that automatically creates and maintains PHP models from the OpenAPI specification:

### Commands
```bash
# Generate models from OpenAPI specification
php artisan openapi:generate-models

# Verify models are in sync with OpenAPI
php artisan openapi:verify-sync

# Refresh models with backup
php artisan openapi:refresh-models --backup
```

### Features
- **Automatic Model Generation**: Creates PHP models from OpenAPI schemas
- **Type Safety**: Generates proper type hints and casts
- **Validation Rules**: Auto-generates Laravel validation rules
- **Synchronization Verification**: Ensures models stay in sync with API spec
- **Backup System**: Safe model regeneration with backups

For detailed documentation, see: [OPENAPI_MODEL_GENERATION.md](OPENAPI_MODEL_GENERATION.md)

## 🔮 Future Enhancements

- [ ] External API integrations for real-time sync
- [ ] Rate limiting and throttling
- [ ] Profile analytics and insights
- [ ] Bulk operations
- [ ] Profile verification status
- [ ] Advanced filtering and search
- [ ] Webhook support for profile updates
- [ ] Multi-tenant support
- [ ] Profile backup and export
- [ ] Social media posting capabilities
- [ ] Automatic migration generation from OpenAPI
- [ ] API resource class generation
- [ ] Test case generation from OpenAPI examples