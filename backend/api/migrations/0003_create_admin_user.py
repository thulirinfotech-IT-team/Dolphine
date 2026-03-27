"""
Data migration to create initial admin user
This runs automatically during 'python manage.py migrate'
"""
from django.db import migrations
from django.contrib.auth.hashers import make_password


def create_admin_user(apps, schema_editor):
    """Create admin user if it doesn't exist"""
    User = apps.get_model('api', 'User')

    admin_email = "admin@dolphinnaturals.com"
    admin_password = "Dolphin@2026"
    admin_name = "Admin"

    # Only create if doesn't exist
    if not User.objects.filter(email=admin_email).exists():
        User.objects.create(
            email=admin_email,
            password=make_password(admin_password),
            name=admin_name,
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        print(f"✅ Created admin user: {admin_email}")
    else:
        print(f"ℹ️ Admin user already exists: {admin_email}")


def delete_admin_user(apps, schema_editor):
    """Reverse migration - delete admin user"""
    User = apps.get_model('api', 'User')
    User.objects.filter(email="admin@dolphinnaturals.com").delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_banner_image_file_category_icon_file_and_more'),
    ]

    operations = [
        migrations.RunPython(create_admin_user, delete_admin_user),
    ]
