"""
Custom permissions for Dolphin Naturals API
"""
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Permission for admin users only"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission for object owner or admin"""

    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role == 'admin':
            return True

        # Check if user owns the object
        if hasattr(obj, 'user'):
            return obj.user == request.user

        return False
