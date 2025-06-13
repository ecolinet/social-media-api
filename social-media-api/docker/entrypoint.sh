#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Laravel API container..."

# Wait for database to be ready (if using external database)
if [ ! -z "$DB_HOST" ] && [ "$DB_HOST" != "localhost" ] && [ "$DB_HOST" != "127.0.0.1" ]; then
    echo "⏳ Waiting for database connection..."
    while ! nc -z $DB_HOST ${DB_PORT:-3306}; do
        sleep 1
    done
    echo "✅ Database is ready!"
fi

# Create .env file if it doesn't exist
if [ ! -f /var/www/html/.env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp /var/www/html/.env.example /var/www/html/.env
fi

# Generate application key if not set
if ! grep -q "APP_KEY=base64:" /var/www/html/.env; then
    echo "🔑 Generating application key..."
    php artisan key:generate --no-interaction
fi

# Create SQLite database if using SQLite
if grep -q "DB_CONNECTION=sqlite" /var/www/html/.env; then
    echo "📊 Setting up SQLite database..."
    touch /var/www/html/database/database.sqlite
    chown www-data:www-data /var/www/html/database/database.sqlite
fi

# Run database migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force --no-interaction

# Install Passport if not already installed
echo "🔐 Setting up Laravel Passport..."
if [ ! -f /var/www/html/storage/oauth-private.key ]; then
    php artisan passport:install --force --no-interaction
fi

# Seed the database
echo "🌱 Seeding database..."
php artisan db:seed --force --no-interaction

# Clear and cache configuration
echo "⚡ Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link
if [ ! -L /var/www/html/public/storage ]; then
    echo "🔗 Creating storage link..."
    php artisan storage:link
fi

# Set proper permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Create log directories
mkdir -p /var/log/supervisor /var/log/nginx
chown -R www-data:www-data /var/log/supervisor

echo "✅ Laravel API is ready!"
echo "📚 API Documentation: http://localhost/docs.html"
echo "🧪 Demo Interface: http://localhost/demo.html"
echo "📋 OpenAPI Spec: http://localhost/api/openapi.yaml"

# Execute the main command
exec "$@"