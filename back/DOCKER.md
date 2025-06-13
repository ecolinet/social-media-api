# Docker Setup for Social Media API

This document provides comprehensive instructions for running the Social Media API using Docker.

## 🐳 Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/ecolinet/social-media-api.git
cd social-media-api

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f app
```

The API will be available at: http://localhost:8080

### Using Docker Build

```bash
# Build the image
docker build -t social-media-api .

# Run the container
docker run -d \
  --name social-media-api \
  -p 8080:80 \
  -e APP_ENV=production \
  -e DB_CONNECTION=sqlite \
  social-media-api
```

## 📋 Available Endpoints

Once running, you can access:

- **API Base**: http://localhost:8080/api
- **API Documentation**: http://localhost:8080/docs.html
- **Demo Interface**: http://localhost:8080/demo.html
- **OpenAPI Spec**: http://localhost:8080/api/openapi.yaml
- **Health Check**: http://localhost:8080/api/health

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `production` | Application environment |
| `APP_DEBUG` | `false` | Enable debug mode |
| `APP_URL` | `http://localhost:8080` | Application URL |
| `DB_CONNECTION` | `sqlite` | Database driver |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `3306` | Database port |
| `DB_DATABASE` | `database.sqlite` | Database name |
| `DB_USERNAME` | - | Database username |
| `DB_PASSWORD` | - | Database password |
| `CACHE_DRIVER` | `file` | Cache driver |
| `SESSION_DRIVER` | `file` | Session driver |
| `QUEUE_CONNECTION` | `database` | Queue driver |

### Database Options

#### SQLite (Default)
```yaml
environment:
  - DB_CONNECTION=sqlite
  - DB_DATABASE=/var/www/html/database/database.sqlite
```

#### MySQL
```yaml
environment:
  - DB_CONNECTION=mysql
  - DB_HOST=mysql
  - DB_PORT=3306
  - DB_DATABASE=social_media_api
  - DB_USERNAME=laravel
  - DB_PASSWORD=your_password
```

## 🏗️ Docker Compose Configurations

### Development (docker-compose.yml)

Features:
- SQLite database (no external dependencies)
- File-based caching and sessions
- Port 8080 exposed
- Volume mounts for development

```bash
docker-compose up -d
```

### Production (docker-compose.prod.yml)

Features:
- MySQL database
- Redis for caching and sessions
- Nginx reverse proxy with SSL
- Health checks
- Persistent volumes

```bash
# Set environment variables
export DB_PASSWORD=your_secure_password
export MYSQL_ROOT_PASSWORD=your_root_password
export REDIS_PASSWORD=your_redis_password
export APP_URL=https://your-domain.com

# Start production stack
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Container Architecture

### Services Overview

1. **App Container**
   - PHP 8.3 FPM
   - Nginx web server
   - Laravel application
   - Supervisor for process management

2. **MySQL Container** (Production)
   - MySQL 8.0
   - Persistent data storage
   - Health checks

3. **Redis Container** (Production)
   - Redis 7 Alpine
   - Caching and session storage
   - Persistent data

4. **Nginx Container** (Production)
   - SSL termination
   - Load balancing
   - Static file serving

### Process Management

The main container runs multiple processes via Supervisor:

- **Nginx**: Web server (port 80)
- **PHP-FPM**: PHP processor
- **Laravel Worker**: Queue processing
- **Laravel Schedule**: Cron jobs

## 🚀 Deployment

### Local Development

```bash
# Start development environment
docker-compose up -d

# View application logs
docker-compose logs -f app

# Execute commands in container
docker-compose exec app php artisan migrate
docker-compose exec app php artisan openapi:generate-models
```

### Production Deployment

```bash
# Create environment file
cp .env.example .env.production

# Edit production settings
nano .env.production

# Deploy with production compose
docker-compose -f docker-compose.prod.yml up -d

# Monitor deployment
docker-compose -f docker-compose.prod.yml logs -f
```

### Cloud Deployment

#### AWS ECS
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t social-media-api .
docker tag social-media-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/social-media-api:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/social-media-api:latest
```

#### Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/social-media-api
gcloud run deploy --image gcr.io/PROJECT-ID/social-media-api --platform managed
```

#### Azure Container Instances
```bash
# Build and push to ACR
az acr build --registry myregistry --image social-media-api .
az container create --resource-group myResourceGroup --name social-media-api --image myregistry.azurecr.io/social-media-api:latest
```

## 🔧 Maintenance

### Container Management

```bash
# View running containers
docker-compose ps

# Restart services
docker-compose restart app

# Update application
docker-compose pull
docker-compose up -d

# View resource usage
docker stats
```

### Database Operations

```bash
# Run migrations
docker-compose exec app php artisan migrate

# Seed database
docker-compose exec app php artisan db:seed

# Backup database (SQLite)
docker-compose exec app cp /var/www/html/database/database.sqlite /var/www/html/storage/backup.sqlite

# Backup database (MySQL)
docker-compose exec mysql mysqldump -u laravel -p social_media_api > backup.sql
```

### Log Management

```bash
# View application logs
docker-compose logs -f app

# View specific service logs
docker-compose logs nginx
docker-compose logs mysql
docker-compose logs redis

# Clear logs
docker-compose exec app php artisan log:clear
```

## 🛠️ Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs app

# Check resource usage
docker system df
```

#### Database Connection Issues
```bash
# Test database connection
docker-compose exec app php artisan tinker
>>> DB::connection()->getPdo();

# Check database container
docker-compose exec mysql mysql -u laravel -p -e "SHOW DATABASES;"
```

#### Permission Issues
```bash
# Fix storage permissions
docker-compose exec app chown -R www-data:www-data /var/www/html/storage
docker-compose exec app chmod -R 775 /var/www/html/storage
```

#### Memory Issues
```bash
# Increase memory limits
docker-compose exec app php -d memory_limit=1G artisan migrate

# Monitor memory usage
docker stats social-media-api
```

### Performance Optimization

#### OPcache Configuration
```ini
# docker/php/php.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=10000
opcache.revalidate_freq=0
```

#### Nginx Optimization
```nginx
# docker/nginx/default.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain application/json application/javascript text/css;
```

## 🔒 Security

### Production Security Checklist

- [ ] Use HTTPS with valid SSL certificates
- [ ] Set strong database passwords
- [ ] Enable Redis authentication
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor container logs
- [ ] Use secrets management
- [ ] Enable container scanning

### SSL Configuration

```bash
# Generate self-signed certificate (development)
mkdir -p docker/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/ssl/nginx.key \
  -out docker/ssl/nginx.crt
```

### Environment Security

```bash
# Use Docker secrets (Swarm mode)
echo "your_secret_password" | docker secret create db_password -

# Use external secret management
export DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id prod/db/password --query SecretString --output text)
```

## 📊 Monitoring

### Health Checks

The container includes built-in health checks:

```bash
# Check container health
docker-compose ps

# Manual health check
curl http://localhost:8080/api/health
```

### Metrics Collection

```yaml
# Add to docker-compose.yml for monitoring
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/docker.yml
name: Docker Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Build Docker image
      run: docker build -t social-media-api .
    
    - name: Run tests
      run: docker run --rm social-media-api php artisan test
    
    - name: Deploy to production
      run: |
        docker tag social-media-api ${{ secrets.REGISTRY_URL }}/social-media-api:latest
        docker push ${{ secrets.REGISTRY_URL }}/social-media-api:latest
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - docker build -t social-media-api .
    - docker tag social-media-api $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  script:
    - docker run --rm $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA php artisan test

deploy:
  stage: deploy
  script:
    - docker-compose -f docker-compose.prod.yml up -d
  only:
    - main
```

## 📚 Additional Resources

- [Laravel Docker Documentation](https://laravel.com/docs/sail)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [MySQL Docker Hub](https://hub.docker.com/_/mysql)
- [Redis Docker Hub](https://hub.docker.com/_/redis)

## 🆘 Support

For Docker-related issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review container logs: `docker-compose logs -f`
3. Verify resource availability: `docker system df`
4. Open an issue on GitHub with:
   - Docker version: `docker --version`
   - Compose version: `docker-compose --version`
   - System info: `uname -a`
   - Error logs and steps to reproduce