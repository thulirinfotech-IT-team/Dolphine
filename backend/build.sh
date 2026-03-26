#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate

# Create superuser automatically if it doesn't exist
python manage.py shell -c "
from api.models import User
if not User.objects.filter(email='${DJANGO_SUPERUSER_EMAIL:-admin@dolphinnaturals.com}').exists():
    User.objects.create_superuser(
        email='${DJANGO_SUPERUSER_EMAIL:-admin@dolphinnaturals.com}',
        password='${DJANGO_SUPERUSER_PASSWORD:-Admin@123}',
        name='${DJANGO_SUPERUSER_NAME:-Admin}'
    )
    print('✅ Superuser created successfully!')
else:
    print('ℹ️ Superuser already exists')
" || echo "Superuser creation skipped"
