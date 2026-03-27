#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate

# Create admin user
echo "Creating admin user..."
python manage.py createadmin

echo "✅ Build completed successfully!"
