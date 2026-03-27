"""
Management command to create admin user
Usage: python manage.py createadmin
"""
from django.core.management.base import BaseCommand
from api.models import User


class Command(BaseCommand):
    help = 'Creates admin user for Dolphin Naturals'

    def handle(self, *args, **options):
        admin_email = "admin@dolphinnaturals.com"
        admin_password = "Dolphin@2026"
        admin_name = "Admin"

        # Delete old admin if exists
        if User.objects.filter(email=admin_email).exists():
            User.objects.filter(email=admin_email).delete()
            self.stdout.write(self.style.WARNING(f'🗑️ Deleted existing admin: {admin_email}'))

        # Create fresh admin user
        user = User.objects.create_superuser(
            email=admin_email,
            password=admin_password,
            name=admin_name
        )

        self.stdout.write(self.style.SUCCESS(f'✅ Created admin user: {admin_email}'))
        self.stdout.write(self.style.SUCCESS(f'   Email: {user.email}'))
        self.stdout.write(self.style.SUCCESS(f'   Password: {admin_password}'))
        self.stdout.write(self.style.SUCCESS(f'   Name: {user.name}'))
        self.stdout.write(self.style.SUCCESS(f'   Staff: {user.is_staff}'))
        self.stdout.write(self.style.SUCCESS(f'   Superuser: {user.is_superuser}'))
