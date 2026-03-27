"""
Fresh admin setup - Deletes old admin and creates new one
DELETE THIS FILE AFTER USE!
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from .models import User


@api_view(['GET', 'POST'])
def create_fresh_admin(request):
    """
    Delete old admin and create fresh one
    DELETE THIS ENDPOINT AFTER USE!

    Access: GET https://your-backend.onrender.com/api/setup/fresh-admin
    """

    # Only allow if DEBUG is True
    if not settings.DEBUG:
        return Response({
            'error': 'This endpoint is disabled',
            'message': 'Set DEBUG=True to use this'
        }, status=403)

    # Admin credentials (CHANGE THESE!)
    admin_email = "admin@dolphinnaturals.com"
    admin_password = "Dolphin@2026"
    admin_name = "Admin"

    try:
        # Delete old admin if exists
        deleted_count = 0
        if User.objects.filter(email=admin_email).exists():
            old_admin = User.objects.get(email=admin_email)
            old_admin.delete()
            deleted_count = 1

        # Create fresh admin user
        user = User.objects.create_superuser(
            email=admin_email,
            password=admin_password,
            name=admin_name
        )

        return Response({
            'status': 'success',
            'message': 'Fresh admin user created!',
            'deleted_old_admin': deleted_count > 0,
            'new_admin': {
                'email': user.email,
                'password': admin_password,
                'name': user.name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser
            },
            'action': 'Login at /admin/ with these credentials'
        })

    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)


@api_view(['GET'])
def list_all_users(request):
    """
    List all users in database (for debugging)
    DELETE THIS AFTER USE!
    """
    if not settings.DEBUG:
        return Response({'error': 'Disabled'}, status=403)

    users = User.objects.all().values('id', 'email', 'name', 'is_staff', 'is_superuser')
    return Response({
        'total_users': users.count(),
        'users': list(users)
    })


@api_view(['POST'])
def delete_all_users(request):
    """
    Delete ALL users (DANGER!)
    Only for testing - DELETE THIS AFTER USE!
    """
    if not settings.DEBUG:
        return Response({'error': 'Disabled'}, status=403)

    # Safety check - require confirmation
    confirm = request.data.get('confirm')
    if confirm != 'yes_delete_all':
        return Response({
            'error': 'Confirmation required',
            'message': 'Send POST with {"confirm": "yes_delete_all"}'
        }, status=400)

    count = User.objects.all().count()
    User.objects.all().delete()

    return Response({
        'status': 'success',
        'message': f'Deleted {count} users',
        'action': 'Now create fresh admin'
    })
