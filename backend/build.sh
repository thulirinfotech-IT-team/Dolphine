#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate

echo "✅ Build completed successfully!"
echo "ℹ️ Create admin user manually using setup endpoint"
