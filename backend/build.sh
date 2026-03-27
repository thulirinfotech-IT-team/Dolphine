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
# Hardcoded credentials - change these as needed
ADMIN_EMAIL="admin@dolphinnaturals.com"
ADMIN_PASSWORD="Dolphin@2026"
ADMIN_NAME="Admin"

python manage.py shell -c "
from api.models import User
if not User.objects.filter(email='${ADMIN_EMAIL}').exists():
    User.objects.create_superuser(
        email='${ADMIN_EMAIL}',
        password='${ADMIN_PASSWORD}',
        name='${ADMIN_NAME}'
    )
    print('✅ Superuser created successfully!')
    print('   Email: ${ADMIN_EMAIL}')
    print('   Password: ${ADMIN_PASSWORD}')
else:
    print('ℹ️ Superuser already exists')
" || echo "Superuser creation skipped"
