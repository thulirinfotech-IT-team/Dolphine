"""
File upload views for Dolphin Naturals API
"""
import os
import uuid
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .permissions import IsAdminUser


@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    """Upload a single image"""
    if 'file' not in request.FILES:
        return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']

    # Validate file type
    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    file_ext = file.name.split('.')[-1].lower()

    if file_ext not in allowed_extensions:
        return Response({'detail': 'Invalid file type. Allowed: jpg, jpeg, png, gif, webp'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}_{file.name}"

    # Save file
    fs = FileSystemStorage(location=settings.MEDIA_ROOT)
    filename = fs.save(unique_filename, file)
    file_url = f"{settings.MEDIA_URL}{filename}"

    return Response({
        'status': 'success',
        'url': file_url,
        'filename': filename
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_multiple_images(request):
    """Upload multiple images"""
    if 'files' not in request.FILES:
        return Response({'detail': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)

    files = request.FILES.getlist('files')
    uploaded_urls = []

    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    fs = FileSystemStorage(location=settings.MEDIA_ROOT)

    for file in files:
        # Validate file type
        file_ext = file.name.split('.')[-1].lower()

        if file_ext not in allowed_extensions:
            continue  # Skip invalid files

        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}_{file.name}"

        # Save file
        filename = fs.save(unique_filename, file)
        file_url = f"{settings.MEDIA_URL}{filename}"

        uploaded_urls.append({
            'url': file_url,
            'filename': filename
        })

    return Response({
        'status': 'success',
        'files': uploaded_urls,
        'count': len(uploaded_urls)
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def upload_video(request):
    """Upload a video file"""
    if 'file' not in request.FILES:
        return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']

    # Validate file type
    allowed_extensions = ['mp4', 'webm', 'mov', 'avi']
    file_ext = file.name.split('.')[-1].lower()

    if file_ext not in allowed_extensions:
        return Response({'detail': 'Invalid file type. Allowed: mp4, webm, mov, avi'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}_{file.name}"

    # Save file
    fs = FileSystemStorage(location=settings.MEDIA_ROOT)
    filename = fs.save(unique_filename, file)
    file_url = f"{settings.MEDIA_URL}{filename}"

    return Response({
        'status': 'success',
        'url': file_url,
        'filename': filename
    })
